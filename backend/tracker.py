import time
import os
import json
import urllib.request
from flask import Flask, request, Response
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

# In-memory session tracking
sessions = {}

# Configuration
COOLDOWN_SECONDS = 60 * 5  # Don't send more than 1 email per 5 minutes per IP

# EmailJS Configuration
EMAILJS_SERVICE_ID = os.getenv("EMAILJS_SERVICE_ID", "")
EMAILJS_TEMPLATE_ID = "template_np4vb5h"
EMAILJS_PUBLIC_KEY = os.getenv("EMAILJS_PUBLIC_KEY", "")
EMAILJS_PRIVATE_KEY = os.getenv("EMAILJS_PRIVATE_KEY", "")

def send_alert(ip, duration_seconds):
    now = time.time()
    session_data = sessions.get(ip, {})
    last_email = session_data.get("last_email_time", 0)

    if now - last_email < COOLDOWN_SECONDS:
        print(f"[BLOCKED] Debouncer caught IP {ip}. Next email allowed in {int(COOLDOWN_SECONDS - (now - last_email))}s.")
        return

    # Update cooldown
    if ip not in sessions:
        sessions[ip] = {}
    sessions[ip]["last_email_time"] = now

    duration_mins = round(duration_seconds / 60, 2)
    duration_secs = round(duration_seconds)
    
    print("="*40)
    print("📧 DISPATCHING EMAILJS ALERT")
    print(f"IP: {ip}")
    print(f"Duration: {duration_mins} mins ({duration_secs} secs)")
    print("="*40)

    if EMAILJS_SERVICE_ID and EMAILJS_PUBLIC_KEY:
        payload = {
            "service_id": EMAILJS_SERVICE_ID,
            "template_id": EMAILJS_TEMPLATE_ID,
            "user_id": EMAILJS_PUBLIC_KEY,
            "accessToken": EMAILJS_PRIVATE_KEY,
            "template_params": {
                "ip_address": ip,
                "duration_mins": str(duration_mins),
                "duration_secs": str(duration_secs)
            }
        }
        
        try:
            req = urllib.request.Request('https://api.emailjs.com/api/v1.0/email/send')
            req.add_header('Content-Type', 'application/json')
            req.add_header('Origin', 'https://occulo.in')
            req.add_header('User-Agent', 'Mozilla/5.0')
            jsondata = json.dumps(payload).encode('utf-8')
            response = urllib.request.urlopen(req, jsondata)
            print(f"[SUCCESS] EmailJS Alert Sent! Status: {response.status}")
        except urllib.error.HTTPError as e:
            body = e.read().decode('utf-8')
            print(f"[ERROR] EmailJS returned {e.code}: {body}")
        except Exception as e:
            print(f"[ERROR] Failed to send via EmailJS: {e}")
    else:
        print("[WARNING] EmailJS credentials not set in .env. Logged to console only.")

@app.route('/logo.gif')
def telemetry():
    ip = request.remote_addr
    start_time = time.time()
    
    print(f"🔌 [CONNECTED] IP {ip} joined the site.")

    # A tiny 1x1 transparent GIF
    GIF_HEADER = b'GIF89a\x01\x00\x01\x00\x80\x00\x00\xff\xff\xff\x00\x00\x00!\xf9\x04\x01\x00\x00\x00\x00,\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02D\x01\x00;'

    def stream():
        # First send the GIF header so the browser accepts it as an image
        yield GIF_HEADER
        try:
            while True:
                # Yield a blank space every second to keep the connection alive
                time.sleep(1)
                yield b' '
        except GeneratorExit:
            # Client closed the browser tab or navigated away
            end_time = time.time()
            duration = end_time - start_time
            print(f"🚫 [DISCONNECTED] IP {ip} left after {round(duration)} seconds.")
            send_alert(ip, duration)
            
    # MIME type is image/gif to avoid suspicion
    return Response(stream(), mimetype='image/gif')

if __name__ == '__main__':
    port = int(os.getenv("PORT", 5000))
    print(f"🚀 Occulo Telemetry Server starting on port {port}...")
    app.run(host='0.0.0.0', port=port, threaded=True)
