from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.security import HTTPBasic, HTTPBasicCredentials
import motor.motor_asyncio
from pydantic import BaseModel, EmailStr
from typing import Optional, List
import os
from datetime import datetime, timezone, timedelta
import uuid
import base64
import json
import paypalrestsdk
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
import pytz
import secrets
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

# Basic HTTP authentication
security = HTTPBasic()

# Admin credentials (in production, use proper authentication)
ADMIN_USERNAME = "liz"
ADMIN_PASSWORD = "psico2024"

def get_admin_user(credentials: HTTPBasicCredentials = Depends(security)):
    correct_username = secrets.compare_digest(credentials.username, ADMIN_USERNAME)
    correct_password = secrets.compare_digest(credentials.password, ADMIN_PASSWORD)
    if not (correct_username and correct_password):
        raise HTTPException(
            status_code=401,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Basic"},
        )
    return credentials.username

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB connection
MONGO_URL = os.getenv("MONGO_URL")
client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_URL)
db = client.psicoliz

# PayPal configuration
paypalrestsdk.configure({
    "mode": os.getenv("PAYPAL_MODE", "sandbox"),
    "client_id": os.getenv("PAYPAL_CLIENT_ID"),
    "client_secret": os.getenv("PAYPAL_CLIENT_SECRET")
})

# SMTP configuration
SMTP_SERVER = os.getenv('SMTP_SERVER')
SMTP_PORT = int(os.getenv('SMTP_PORT', '587'))
SMTP_LOGIN = os.getenv('SMTP_LOGIN')
SMTP_PASSWORD = os.getenv('SMTP_PASSWORD')
FROM_EMAIL = os.getenv('FROM_EMAIL')

# Venezuela timezone
VET = pytz.timezone('America/Caracas')

# Pydantic models
class AppointmentBooking(BaseModel):
    full_name: str
    email: EmailStr
    whatsapp: str
    appointment_date: str
    appointment_time: str
    payment_method: str  # "paypal" or "zelle"
    session_duration: str = "standard"  # "standard", "plus_30min", "plus_60min"

class ZelleUpload(BaseModel):
    booking_id: str
    receipt_file: str  # base64 encoded

class SettingsUpdate(BaseModel):
    zelle_email: str
    consultation_price: float = 50.00
    half_hour_extension: float = 25.00
    full_hour_extension: float = 45.00

class ScheduleUpdate(BaseModel):
    day_of_week: str  # "monday", "tuesday", etc.
    available_times: List[str]  # ["09:00", "10:00", etc.]

class CustomSchedule(BaseModel):
    date: str  # "2024-07-30"
    available_times: List[str]  # Override for specific date
    is_available: bool = True  # False for holidays/blocked days

# Available time slots
DEFAULT_SCHEDULE = {
    "monday": ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"],
    "tuesday": ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"],
    "wednesday": ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"],
    "thursday": ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"],
    "friday": ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"],
    "saturday": ["09:00", "10:00", "11:00"],
    "sunday": []  # Closed on Sundays
}

WEEKDAY_NAMES = {
    0: "monday", 1: "tuesday", 2: "wednesday", 3: "thursday", 
    4: "friday", 5: "saturday", 6: "sunday"
}

@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}

@app.get("/api/zelle-config")
async def get_zelle_config():
    """Get Zelle payment configuration"""
    # First check database for settings, then fall back to env
    settings = await db.settings.find_one({"type": "zelle_config"})
    if settings:
        return {
            "zelle_email": settings.get("zelle_email", os.getenv('ZELLE_EMAIL', 'psicolizparra@gmail.com')),
            "amount": f"${settings.get('consultation_price', 50.00):.2f}",
            "currency": "USD"
        }
    
    return {
        "zelle_email": os.getenv('ZELLE_EMAIL', 'psicolizparra@gmail.com'),
        "amount": "$50.00",
        "currency": "USD"
    }

@app.get("/api/pricing-config")
async def get_pricing_config():
    """Get pricing configuration for all session types"""
    settings = await db.settings.find_one({"type": "zelle_config"})
    if settings:
        base_price = settings.get("consultation_price", 50.00)
        half_hour_ext = settings.get("half_hour_extension", 25.00)
        full_hour_ext = settings.get("full_hour_extension", 45.00)
    else:
        base_price = 50.00
        half_hour_ext = 25.00
        full_hour_ext = 45.00
    
    return {
        "standard": {
            "duration": "1 hora",
            "price": base_price,
            "description": "Sesión estándar de 60 minutos"
        },
        "plus_30min": {
            "duration": "1.5 horas",
            "price": base_price + half_hour_ext,
            "description": "Sesión estándar + 30 minutos adicionales"
        },
        "plus_60min": {
            "duration": "2 horas", 
            "price": base_price + full_hour_ext,
            "description": "Sesión estándar + 60 minutos adicionales"
        },
        "currency": "USD"
    }

@app.get("/api/available-slots/{date}")
async def get_available_slots(date: str):
    """Get available time slots for a specific date"""
    try:
        # Parse the date
        appointment_date = datetime.strptime(date, "%Y-%m-%d").date()
        
        # Get day of week (0=Monday, 6=Sunday)
        day_of_week = appointment_date.weekday()
        day_name = WEEKDAY_NAMES[day_of_week]
        
        # Get default schedule for this day
        day_schedule = DEFAULT_SCHEDULE.get(day_name, [])
        
        # Check for custom schedule override for this specific date
        custom_schedule = await db.custom_schedules.find_one({"date": date})
        if custom_schedule:
            if not custom_schedule.get("is_available", True):
                # Day is blocked/holiday
                return {"available_times": []}
            day_schedule = custom_schedule.get("available_times", day_schedule)
        
        # Get existing bookings for this date
        existing_bookings = await db.appointments.find({
            "appointment_date": date,
            "status": {"$in": ["confirmed", "pending"]}
        }).to_list(100)
        
        booked_times = [booking["appointment_time"] for booking in existing_bookings]
        available_times = [time for time in day_schedule if time not in booked_times]
        
        return {"available_times": available_times}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid date format: {str(e)}")

@app.post("/api/create-paypal-order")
async def create_paypal_order(booking: AppointmentBooking):
    """Create PayPal payment order"""
    try:
        # Get current pricing settings
        settings = await db.settings.find_one({"type": "zelle_config"})
        base_price = settings.get("consultation_price", 50.00) if settings else 50.00
        half_hour_ext = settings.get("half_hour_extension", 25.00) if settings else 25.00
        full_hour_ext = settings.get("full_hour_extension", 45.00) if settings else 45.00
        
        # Calculate final price based on session duration
        if booking.session_duration == "plus_30min":
            final_price = base_price + half_hour_ext
            session_description = "1.5 horas (60min + 30min extra)"
        elif booking.session_duration == "plus_60min":
            final_price = base_price + full_hour_ext
            session_description = "2 horas (60min + 60min extra)"
        else:
            final_price = base_price
            session_description = "1 hora (sesión estándar)"
        
        # Create appointment in database with pending status
        appointment_id = str(uuid.uuid4())
        appointment_data = {
            "id": appointment_id,
            "full_name": booking.full_name,
            "email": booking.email,
            "whatsapp": booking.whatsapp,
            "appointment_date": booking.appointment_date,
            "appointment_time": booking.appointment_time,
            "payment_method": "paypal",
            "session_duration": booking.session_duration,
            "session_price": final_price,
            "status": "pending",
            "created_at": datetime.now(VET).isoformat()
        }
        
        await db.appointments.insert_one(appointment_data)
        
        # Create PayPal payment
        payment = paypalrestsdk.Payment({
            "intent": "sale",
            "payer": {
                "payment_method": "paypal"
            },
            "redirect_urls": {
                "return_url": f"{os.getenv('FRONTEND_URL', 'http://localhost:3000')}/payment-success?booking_id={appointment_id}",
                "cancel_url": f"{os.getenv('FRONTEND_URL', 'http://localhost:3000')}/payment-cancel"
            },
            "transactions": [{
                "item_list": {
                    "items": [{
                        "name": f"Consulta Psicológica - Liz Parra ({session_description})",
                        "sku": f"psych-consultation-{booking.session_duration}",
                        "price": f"{final_price:.2f}",
                        "currency": "USD",
                        "quantity": 1
                    }]
                },
                "amount": {
                    "total": f"{final_price:.2f}",
                    "currency": "USD"
                },
                "description": f"Cita psicológica para {booking.full_name} - {booking.appointment_date} {booking.appointment_time} - {session_description}"
            }]
        })
        
        if payment.create():
            # Find approval URL
            approval_url = None
            for link in payment.links:
                if link.rel == "approval_url":
                    approval_url = link.href
                    break
            
            # Store PayPal payment ID
            await db.appointments.update_one(
                {"id": appointment_id},
                {"$set": {"paypal_payment_id": payment.id}}
            )
            
            return {"approval_url": approval_url, "booking_id": appointment_id}
        else:
            raise HTTPException(status_code=400, detail="Error creating PayPal payment")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/confirm-paypal-payment")
async def confirm_paypal_payment(payment_id: str, payer_id: str, booking_id: str):
    """Confirm PayPal payment and complete booking"""
    try:
        # Execute PayPal payment
        payment = paypalrestsdk.Payment.find(payment_id)
        
        if payment.execute({"payer_id": payer_id}):
            # Update appointment status
            await db.appointments.update_one(
                {"id": booking_id},
                {"$set": {
                    "status": "confirmed",
                    "paypal_payer_id": payer_id,
                    "payment_confirmed_at": datetime.now(VET).isoformat()
                }}
            )
            
            # Get appointment details
            appointment = await db.appointments.find_one({"id": booking_id})
            
            # Send confirmation emails
            await send_confirmation_emails(appointment)
            
            return {"message": "Payment confirmed successfully"}
        else:
            raise HTTPException(status_code=400, detail="Payment confirmation failed")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/create-zelle-booking")
async def create_zelle_booking(booking: AppointmentBooking):
    """Create Zelle booking (pending payment proof)"""
    try:
        # Get current settings
        settings = await db.settings.find_one({"type": "zelle_config"})
        zelle_email = settings.get("zelle_email", os.getenv('ZELLE_EMAIL', 'psicolizparra@gmail.com')) if settings else os.getenv('ZELLE_EMAIL', 'psicolizparra@gmail.com')
        base_price = settings.get("consultation_price", 50.00) if settings else 50.00
        half_hour_ext = settings.get("half_hour_extension", 25.00) if settings else 25.00
        full_hour_ext = settings.get("full_hour_extension", 45.00) if settings else 45.00
        
        # Calculate final price based on session duration
        if booking.session_duration == "plus_30min":
            final_price = base_price + half_hour_ext
        elif booking.session_duration == "plus_60min":
            final_price = base_price + full_hour_ext
        else:
            final_price = base_price
        
        appointment_id = str(uuid.uuid4())
        appointment_data = {
            "id": appointment_id,
            "full_name": booking.full_name,
            "email": booking.email,
            "whatsapp": booking.whatsapp,
            "appointment_date": booking.appointment_date,
            "appointment_time": booking.appointment_time,
            "payment_method": "zelle",
            "session_duration": booking.session_duration,
            "session_price": final_price,
            "status": "awaiting_payment_proof",
            "created_at": datetime.now(VET).isoformat()
        }
        
        await db.appointments.insert_one(appointment_data)
        
        return {
            "booking_id": appointment_id,
            "zelle_email": zelle_email,
            "amount": f"${final_price:.2f}",
            "message": "Please send payment proof after completing Zelle transfer"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/upload-zelle-proof")
async def upload_zelle_proof(
    booking_id: str = Form(...),
    file: UploadFile = File(...)
):
    """Upload Zelle payment proof"""
    try:
        # Read file content and encode to base64
        file_content = await file.read()
        file_base64 = base64.b64encode(file_content).decode()
        
        # Update appointment with receipt
        result = await db.appointments.update_one(
            {"id": booking_id},
            {"$set": {
                "status": "confirmed",
                "zelle_receipt": file_base64,
                "zelle_receipt_filename": file.filename,
                "payment_confirmed_at": datetime.now(VET).isoformat()
            }}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Booking not found")
        
        # Get appointment details
        appointment = await db.appointments.find_one({"id": booking_id})
        
        # Send confirmation emails with attachment
        await send_confirmation_emails(appointment)
        
        return {"message": "Payment proof uploaded successfully"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

async def send_confirmation_emails(appointment):
    """Send confirmation emails to user and Liz using SMTP"""
    try:
        # User confirmation email
        user_msg = MIMEMultipart('alternative')
        user_msg['Subject'] = 'Confirmación de Cita - Liz Parra Psicóloga'
        user_msg['From'] = FROM_EMAIL
        user_msg['To'] = appointment['email']
        
        user_html = f'''
        <h2>¡Tu cita ha sido confirmada!</h2>
        <p>Hola {appointment['full_name']},</p>
        <p>Tu cita psicológica ha sido confirmada para:</p>
        <ul>
            <li><strong>Fecha:</strong> {appointment['appointment_date']}</li>
            <li><strong>Hora:</strong> {appointment['appointment_time']}</li>
            <li><strong>Método de pago:</strong> {appointment['payment_method']}</li>
        </ul>
        <p><strong>Importante:</strong> Liz se contactará contigo por WhatsApp en la hora de tu cita.</p>
        <p>¡Nos vemos pronto!</p>
        <p>Saludos,<br>Liz Parra<br>Psicóloga</p>
        '''
        
        user_html_part = MIMEText(user_html, 'html')
        user_msg.attach(user_html_part)
        
        # Liz notification email
        liz_msg = MIMEMultipart('mixed')
        liz_msg['Subject'] = f'Nueva Cita - {appointment["full_name"]} - {appointment["appointment_date"]}'
        liz_msg['From'] = FROM_EMAIL
        liz_msg['To'] = os.getenv('LIZA_EMAIL')
        
        liz_html = f'''
        <h2>Nueva Cita Reservada</h2>
        <p><strong>Cliente:</strong> {appointment['full_name']}</p>
        <p><strong>WhatsApp:</strong> {appointment['whatsapp']}</p>
        <p><strong>Email:</strong> {appointment['email']}</p>
        <p><strong>Fecha:</strong> {appointment['appointment_date']}</p>
        <p><strong>Hora:</strong> {appointment['appointment_time']}</p>
        <p><strong>Método de pago:</strong> {appointment['payment_method']}</p>
        '''
        
        liz_html_part = MIMEText(liz_html, 'html')
        liz_msg.attach(liz_html_part)
        
        # Add Zelle receipt attachment if exists
        if appointment.get('zelle_receipt'):
            attachment_data = base64.b64decode(appointment['zelle_receipt'])
            attachment = MIMEBase('application', 'octet-stream')
            attachment.set_payload(attachment_data)
            encoders.encode_base64(attachment)
            attachment.add_header(
                'Content-Disposition',
                f'attachment; filename={appointment.get("zelle_receipt_filename", "receipt.jpg")}'
            )
            liz_msg.attach(attachment)
        
        # Send emails using SMTP
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_LOGIN, SMTP_PASSWORD)
            
            # Send user email
            server.send_message(user_msg)
            
            # Send Liz email
            server.send_message(liz_msg)
        
    except Exception as e:
        print(f"Error sending emails: {str(e)}")

@app.get("/api/appointments")
async def get_appointments():
    """Get all appointments (for admin panel)"""
    appointments = await db.appointments.find().to_list(1000)
    # Convert ObjectId to string for JSON serialization
    for appointment in appointments:
        if '_id' in appointment:
            appointment['_id'] = str(appointment['_id'])
    return appointments

@app.get("/api/admin/appointments")
async def get_admin_appointments(admin: str = Depends(get_admin_user)):
    """Get all appointments with admin authentication"""
    appointments = await db.appointments.find().sort("created_at", -1).to_list(1000)
    # Convert ObjectId to string for JSON serialization
    for appointment in appointments:
        if '_id' in appointment:
            appointment['_id'] = str(appointment['_id'])
    return appointments

@app.put("/api/admin/appointments/{appointment_id}/confirm-zelle")
async def confirm_zelle_payment(appointment_id: str, admin: str = Depends(get_admin_user)):
    """Confirm Zelle payment for an appointment"""
    try:
        result = await db.appointments.update_one(
            {"id": appointment_id},
            {"$set": {
                "status": "confirmed",
                "admin_confirmed_at": datetime.now(VET).isoformat(),
                "admin_confirmed_by": admin
            }}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Appointment not found")
        
        return {"message": "Zelle payment confirmed successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/admin/appointments/{appointment_id}")
async def delete_appointment(appointment_id: str, admin: str = Depends(get_admin_user)):
    """Delete an appointment"""
    try:
        result = await db.appointments.delete_one({"id": appointment_id})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Appointment not found")
        
        return {"message": "Appointment deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/admin/appointments/export")
async def export_appointments(admin: str = Depends(get_admin_user)):
    """Export appointments as CSV data"""
    appointments = await db.appointments.find().sort("created_at", -1).to_list(1000)
    
    csv_data = "Date,Time,Name,Email,WhatsApp,Payment Method,Status,Created At\n"
    for apt in appointments:
        csv_data += f"{apt.get('appointment_date', '')},{apt.get('appointment_time', '')},{apt.get('full_name', '')},{apt.get('email', '')},{apt.get('whatsapp', '')},{apt.get('payment_method', '')},{apt.get('status', '')},{apt.get('created_at', '')}\n"
    
    return {"csv_data": csv_data}

@app.get("/api/admin/stats")
async def get_admin_stats(admin: str = Depends(get_admin_user)):
    """Get appointment statistics"""
    try:
        total_appointments = await db.appointments.count_documents({})
        confirmed_appointments = await db.appointments.count_documents({"status": "confirmed"})
        pending_appointments = await db.appointments.count_documents({"status": {"$in": ["pending", "awaiting_payment_proof"]}})
        paypal_appointments = await db.appointments.count_documents({"payment_method": "paypal"})
        zelle_appointments = await db.appointments.count_documents({"payment_method": "zelle"})
        
        return {
            "total_appointments": total_appointments,
            "confirmed_appointments": confirmed_appointments,
            "pending_appointments": pending_appointments,
            "paypal_appointments": paypal_appointments,
            "zelle_appointments": zelle_appointments
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/admin/settings")
async def get_admin_settings(admin: str = Depends(get_admin_user)):
    """Get admin settings"""
    try:
        settings = await db.settings.find_one({"type": "zelle_config"})
        if not settings:
            # Create default settings if none exist
            default_settings = {
                "type": "zelle_config",
                "zelle_email": os.getenv('ZELLE_EMAIL', 'psicolizparra@gmail.com'),
                "consultation_price": 50.00,
                "half_hour_extension": 25.00,
                "full_hour_extension": 45.00,
                "created_at": datetime.now(VET).isoformat()
            }
            await db.settings.insert_one(default_settings)
            return {
                "zelle_email": default_settings["zelle_email"],
                "consultation_price": default_settings["consultation_price"],
                "half_hour_extension": default_settings["half_hour_extension"],
                "full_hour_extension": default_settings["full_hour_extension"]
            }
        
        return {
            "zelle_email": settings.get("zelle_email", os.getenv('ZELLE_EMAIL', 'psicolizparra@gmail.com')),
            "consultation_price": settings.get("consultation_price", 50.00),
            "half_hour_extension": settings.get("half_hour_extension", 25.00),
            "full_hour_extension": settings.get("full_hour_extension", 45.00)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/admin/settings")
async def update_admin_settings(settings_update: SettingsUpdate, admin: str = Depends(get_admin_user)):
    """Update admin settings"""
    try:
        # Validate email format
        if "@" not in settings_update.zelle_email or "." not in settings_update.zelle_email:
            raise HTTPException(status_code=400, detail="Invalid email format")
        
        # Validate prices
        if settings_update.consultation_price <= 0:
            raise HTTPException(status_code=400, detail="Consultation price must be greater than 0")
        if settings_update.half_hour_extension < 0:
            raise HTTPException(status_code=400, detail="Half hour extension price cannot be negative")
        if settings_update.full_hour_extension < 0:
            raise HTTPException(status_code=400, detail="Full hour extension price cannot be negative")
        
        # Update or create settings
        result = await db.settings.update_one(
            {"type": "zelle_config"},
            {"$set": {
                "zelle_email": settings_update.zelle_email,
                "consultation_price": settings_update.consultation_price,
                "half_hour_extension": settings_update.half_hour_extension,
                "full_hour_extension": settings_update.full_hour_extension,
                "updated_at": datetime.now(VET).isoformat(),
                "updated_by": admin
            }},
            upsert=True
        )
        
        return {
            "message": "Settings updated successfully",
            "zelle_email": settings_update.zelle_email,
            "consultation_price": settings_update.consultation_price,
            "half_hour_extension": settings_update.half_hour_extension,
            "full_hour_extension": settings_update.full_hour_extension
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/admin/schedule")
async def get_admin_schedule(admin: str = Depends(get_admin_user)):
    """Get current weekly schedule and custom overrides"""
    try:
        # Get current default schedule
        schedule_settings = await db.settings.find_one({"type": "weekly_schedule"})
        
        if not schedule_settings:
            # Create default schedule if none exists
            default_schedule_settings = {
                "type": "weekly_schedule",
                "schedule": DEFAULT_SCHEDULE,
                "created_at": datetime.now(VET).isoformat()
            }
            await db.settings.insert_one(default_schedule_settings)
            current_schedule = DEFAULT_SCHEDULE
        else:
            current_schedule = schedule_settings.get("schedule", DEFAULT_SCHEDULE)
        
        # Get custom schedule overrides for the next 60 days
        today = datetime.now(VET).date()
        end_date = today + timedelta(days=60)
        
        custom_schedules = await db.custom_schedules.find({
            "date": {"$gte": today.isoformat(), "$lte": end_date.isoformat()}
        }).to_list(100)
        
        return {
            "weekly_schedule": current_schedule,
            "custom_schedules": custom_schedules
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/admin/schedule/weekly")
async def update_weekly_schedule(schedule_update: dict, admin: str = Depends(get_admin_user)):
    """Update weekly default schedule"""
    try:
        # Validate schedule format
        valid_days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
        for day in schedule_update.keys():
            if day not in valid_days:
                raise HTTPException(status_code=400, detail=f"Invalid day: {day}")
            
            # Validate time format
            for time_slot in schedule_update[day]:
                try:
                    datetime.strptime(time_slot, "%H:%M")
                except ValueError:
                    raise HTTPException(status_code=400, detail=f"Invalid time format: {time_slot}")
        
        # Update or create weekly schedule
        await db.settings.update_one(
            {"type": "weekly_schedule"},
            {"$set": {
                "schedule": schedule_update,
                "updated_at": datetime.now(VET).isoformat(),
                "updated_by": admin
            }},
            upsert=True
        )
        
        return {"message": "Weekly schedule updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/admin/schedule/custom")
async def update_custom_schedule(custom_schedule: CustomSchedule, admin: str = Depends(get_admin_user)):
    """Update custom schedule for specific date"""
    try:
        # Validate date format
        try:
            datetime.strptime(custom_schedule.date, "%Y-%m-%d")
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
        
        # Validate time format if available
        if custom_schedule.is_available:
            for time_slot in custom_schedule.available_times:
                try:
                    datetime.strptime(time_slot, "%H:%M")
                except ValueError:
                    raise HTTPException(status_code=400, detail=f"Invalid time format: {time_slot}")
        
        # Update or create custom schedule
        await db.custom_schedules.update_one(
            {"date": custom_schedule.date},
            {"$set": {
                "available_times": custom_schedule.available_times,
                "is_available": custom_schedule.is_available,
                "updated_at": datetime.now(VET).isoformat(),
                "updated_by": admin
            }},
            upsert=True
        )
        
        return {"message": f"Custom schedule updated for {custom_schedule.date}"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/admin/schedule/custom/{date}")
async def delete_custom_schedule(date: str, admin: str = Depends(get_admin_user)):
    """Delete custom schedule for specific date (revert to weekly default)"""
    try:
        result = await db.custom_schedules.delete_one({"date": date})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Custom schedule not found for this date")
        
        return {"message": f"Custom schedule deleted for {date}. Reverted to weekly default."}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)