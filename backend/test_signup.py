import requests
import json

SUPABASE_URL = 'https://xioqjopumlnpudxvtnic.supabase.co'
SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhpb3Fqb3B1bWxucHVkeHZ0bmljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzNzU1NjQsImV4cCI6MjA5NDk1MTU2NH0.x4rj5IRPZ0V0P1HMC-VGUsdv3umZMK73sryjJ9OnLgk'

headers = {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': f'Bearer {SUPABASE_ANON_KEY}',
    'Content-Type': 'application/json'
}

data = {
    "email": "test@example.com",
    "password": "Password123!",
    "data": {"full_name": "Test User"}
}

# we'll try without emailRedirectTo first
response = requests.post(f"{SUPABASE_URL}/auth/v1/signup", headers=headers, json=data)
print("Sign Up Response without redirect:")
print(response.status_code)
print(response.text)

# and with redirect
data["gotrue_meta_security"] = {}
response = requests.post(
    f"{SUPABASE_URL}/auth/v1/signup?redirect_to=co.occulo.olink://auth-callback", 
    headers=headers, 
    json=data
)
print("Sign Up Response with redirect:")
print(response.status_code)
print(response.text)
