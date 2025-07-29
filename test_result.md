# Psicoliz - Appointment Booking Website

## Project Overview
Building a modern, elegant appointment booking website for psychologist Liz Parra with her specific branding and payment integration requirements.

## User Problem Statement
Build a booking website for psychologist Liz Parra using her branding from a pink and gold flyer. Use a blush pink background (#FCE6EA), gold/brown headings (#A6753D), and floral-style accents. Include her circular profile image at the top of the homepage with this text:

- Atención Psicológica
- Liz Parra
- FPV: 16.491
- Button: "Agendar Cita"

Booking flow:
1. User selects an available date and time
2. Enters: Full name, email, WhatsApp number
3. Selects payment method: PayPal or Zelle

If PayPal:
- Redirect to PayPal sandbox checkout using provided credentials
- After payment, show confirmation page and send receipt email

If Zelle:
- Show payment instructions (e.g. "Send to psicolizparra@gmail.com")
- Allow user to upload proof of payment (screenshot)
- Show confirmation page after upload
- Email both user and Liz with booking info and file attachment

WhatsApp is the only session method.
Use timezone: VET (Venezuela, UTC-4)

## Current Progress
- ✅ Set up full-stack architecture (React + FastAPI + MongoDB)
- ✅ Created beautiful homepage with Liz's branding and profile image
- ✅ Built complete booking flow with date/time selection
- ✅ Implemented PayPal integration with provided credentials
- ✅ Added Zelle payment flow with file upload
- ✅ Created confirmation and error pages
- ✅ Added WhatsApp and Instagram contact links

## API Credentials
- PayPal Client ID: AUS_T01QcPYZDMxzGJgk9V2QI5pGG3Pukra3MN6vKjao4qM3BMIWooaO8OYz34A2xW96WDlve-ghaM7c
- PayPal Client Secret: EOQgEDkZUNXMg9Dwoba2P0fFEKMiOSjcfEwZy7teh9vds3dhpxkoAlwntsaywlzdRTaJ_diONG-TN4N9
- PayPal Mode: sandbox

## Still Needed
- SendGrid API key for email confirmations
- Testing of complete booking flow
- Admin panel for Liz to view appointments

## Testing Protocol
1. Test backend API endpoints first
2. Test frontend booking flow
3. Test PayPal integration
4. Test Zelle upload functionality
5. Test email notifications (pending SendGrid key)

## Technical Stack
- Frontend: React 18 + Tailwind CSS + React Router
- Backend: FastAPI + Python
- Database: MongoDB
- Payment: PayPal SDK
- Email: SendGrid (pending API key)
- File Upload: Base64 encoding for images