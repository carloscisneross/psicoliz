#!/usr/bin/env python3
"""
Backend API Testing for Liz Parra's Psychology Website
Tests all appointment booking backend endpoints
"""

import requests
import json
import base64
import io
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('/app/frontend/.env')

# Get backend URL from frontend env
BACKEND_URL = os.getenv('REACT_APP_BACKEND_URL', 'http://localhost:8001')
API_BASE = f"{BACKEND_URL}/api"

print(f"Testing backend at: {API_BASE}")

# Test data as specified in the review request
TEST_DATA = {
    "full_name": "Test User",
    "email": "test@example.com",
    "whatsapp": "+58 412-999-8888",
    "appointment_date": "2024-07-31",
    "appointment_time": "14:00",
    "payment_method": "paypal"
}

def test_health_check():
    """Test 1: Health Check endpoint"""
    print("\n=== Testing Health Check Endpoint ===")
    try:
        response = requests.get(f"{API_BASE}/health")
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 200 and response.json().get("status") == "healthy":
            print("✅ Health check passed")
            return True
        else:
            print("❌ Health check failed")
            return False
    except Exception as e:
        print(f"❌ Health check error: {str(e)}")
        return False

def test_available_slots():
    """Test 2: Available Slots endpoint"""
    print("\n=== Testing Available Slots Endpoint ===")
    try:
        test_date = TEST_DATA["appointment_date"]
        response = requests.get(f"{API_BASE}/available-slots/{test_date}")
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 200:
            data = response.json()
            if "available_times" in data and isinstance(data["available_times"], list):
                print(f"✅ Available slots retrieved: {len(data['available_times'])} slots")
                return True
            else:
                print("❌ Invalid response format")
                return False
        else:
            print("❌ Available slots request failed")
            return False
    except Exception as e:
        print(f"❌ Available slots error: {str(e)}")
        return False

def test_paypal_integration():
    """Test 3: PayPal Integration - Create PayPal Order"""
    print("\n=== Testing PayPal Integration ===")
    try:
        paypal_data = TEST_DATA.copy()
        paypal_data["payment_method"] = "paypal"
        
        response = requests.post(
            f"{API_BASE}/create-paypal-order",
            json=paypal_data,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 200:
            data = response.json()
            if "approval_url" in data and "booking_id" in data:
                print("✅ PayPal order created successfully")
                print(f"Booking ID: {data['booking_id']}")
                print(f"Approval URL: {data['approval_url'][:50]}...")
                return True, data["booking_id"]
            else:
                print("❌ Invalid PayPal response format")
                return False, None
        else:
            print("❌ PayPal order creation failed")
            return False, None
    except Exception as e:
        print(f"❌ PayPal integration error: {str(e)}")
        return False, None

def test_zelle_booking():
    """Test 4: Zelle Booking Creation"""
    print("\n=== Testing Zelle Booking ===")
    try:
        zelle_data = TEST_DATA.copy()
        zelle_data["payment_method"] = "zelle"
        
        response = requests.post(
            f"{API_BASE}/create-zelle-booking",
            json=zelle_data,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 200:
            data = response.json()
            if "booking_id" in data and "zelle_email" in data:
                print("✅ Zelle booking created successfully")
                print(f"Booking ID: {data['booking_id']}")
                print(f"Zelle Email: {data['zelle_email']}")
                return True, data["booking_id"]
            else:
                print("❌ Invalid Zelle response format")
                return False, None
        else:
            print("❌ Zelle booking creation failed")
            return False, None
    except Exception as e:
        print(f"❌ Zelle booking error: {str(e)}")
        return False, None

def test_file_upload(booking_id):
    """Test 5: File Upload for Zelle Receipt"""
    print("\n=== Testing File Upload (Zelle Receipt) ===")
    try:
        # Create a dummy image file for testing
        dummy_image_data = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\tpHYs\x00\x00\x0b\x13\x00\x00\x0b\x13\x01\x00\x9a\x9c\x18\x00\x00\x00\nIDATx\x9cc\xf8\x00\x00\x00\x01\x00\x01\x00\x00\x00\x00IEND\xaeB`\x82'
        
        files = {
            'file': ('receipt.png', io.BytesIO(dummy_image_data), 'image/png')
        }
        data = {
            'booking_id': booking_id
        }
        
        response = requests.post(
            f"{API_BASE}/upload-zelle-proof",
            files=files,
            data=data
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 200:
            data = response.json()
            if "message" in data:
                print("✅ File upload successful")
                return True
            else:
                print("❌ Invalid upload response format")
                return False
        else:
            print("❌ File upload failed")
            return False
    except Exception as e:
        print(f"❌ File upload error: {str(e)}")
        return False

def test_appointments_list():
    """Test 6: Get Appointments List (Admin functionality)"""
    print("\n=== Testing Appointments List ===")
    try:
        response = requests.get(f"{API_BASE}/appointments")
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            appointments = response.json()
            print(f"✅ Appointments retrieved: {len(appointments)} appointments")
            if appointments:
                print("Sample appointment data:")
                print(json.dumps(appointments[0], indent=2))
            return True
        else:
            print("❌ Appointments list request failed")
            return False
    except Exception as e:
        print(f"❌ Appointments list error: {str(e)}")
        return False

def test_admin_stats():
    """Test 7: Admin Stats endpoint with authentication"""
    print("\n=== Testing Admin Stats Endpoint ===")
    try:
        # Use basic auth with admin credentials
        auth = ('liz', 'psico2024')
        response = requests.get(f"{API_BASE}/admin/stats", auth=auth)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 200:
            data = response.json()
            required_fields = ['total_appointments', 'confirmed_appointments', 'pending_appointments', 'paypal_appointments', 'zelle_appointments']
            if all(field in data for field in required_fields):
                print("✅ Admin stats retrieved successfully")
                return True
            else:
                print("❌ Invalid admin stats response format")
                return False
        else:
            print("❌ Admin stats request failed")
            return False
    except Exception as e:
        print(f"❌ Admin stats error: {str(e)}")
        return False

def test_admin_appointments():
    """Test 8: Admin Appointments endpoint with authentication"""
    print("\n=== Testing Admin Appointments Endpoint ===")
    try:
        # Use basic auth with admin credentials
        auth = ('liz', 'psico2024')
        response = requests.get(f"{API_BASE}/admin/appointments", auth=auth)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            appointments = response.json()
            print(f"✅ Admin appointments retrieved: {len(appointments)} appointments")
            return True
        else:
            print("❌ Admin appointments request failed")
            return False
    except Exception as e:
        print(f"❌ Admin appointments error: {str(e)}")
        return False

def run_all_tests():
    """Run all backend tests"""
    print("🧪 Starting Backend API Tests for Liz Parra's Psychology Website")
    print("=" * 60)
    
    results = {}
    
    # Test 1: Health Check
    results['health_check'] = test_health_check()
    
    # Test 2: Available Slots
    results['available_slots'] = test_available_slots()
    
    # Test 3: PayPal Integration
    paypal_success, paypal_booking_id = test_paypal_integration()
    results['paypal_integration'] = paypal_success
    
    # Test 4: Zelle Booking
    zelle_success, zelle_booking_id = test_zelle_booking()
    results['zelle_booking'] = zelle_success
    
    # Test 5: File Upload (only if Zelle booking was successful)
    if zelle_success and zelle_booking_id:
        results['file_upload'] = test_file_upload(zelle_booking_id)
    else:
        print("\n⚠️ Skipping file upload test - no valid Zelle booking ID")
        results['file_upload'] = False
    
    # Test 6: Appointments List
    results['appointments_list'] = test_appointments_list()
    
    # Summary
    print("\n" + "=" * 60)
    print("🏁 TEST SUMMARY")
    print("=" * 60)
    
    passed = sum(results.values())
    total = len(results)
    
    for test_name, passed_test in results.items():
        status = "✅ PASS" if passed_test else "❌ FAIL"
        print(f"{test_name.replace('_', ' ').title()}: {status}")
    
    print(f"\nOverall: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! Backend is working correctly.")
    else:
        print("⚠️ Some tests failed. Please check the issues above.")
    
    return results

if __name__ == "__main__":
    run_all_tests()