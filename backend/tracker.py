import os
import json
import time
import sqlite3
import requests
from datetime import datetime, timezone
from flask import Flask, request, Response, jsonify
from flask_cors import CORS
from urllib.parse import urlparse

app = Flask(__name__)
CORS(app)

# Database Setup
DATABASE_PATH = os.getenv("DATABASE_PATH", "data/tracker.db")
os.makedirs(os.path.dirname(DATABASE_PATH), exist_ok=True)

def get_db():
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    with get_db() as conn:
        conn.execute('''
            CREATE TABLE IF NOT EXISTS sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                country TEXT,
                region TEXT,
                device TEXT,
                duration_sec INTEGER,
                date TEXT,
                hour INTEGER,
                timestamp DATETIME
            )
        ''')
        conn.execute('''
            CREATE TABLE IF NOT EXISTS inquiries (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT,
                email TEXT,
                message TEXT,
                country TEXT,
                device TEXT,
                timestamp DATETIME
            )
        ''')
        conn.commit()

init_db()

# Country Mapping (Simple fallback for ip-api)
COUNTRY_MAP = {
    "IN": "India", "US": "United States", "GB": "United Kingdom", "CA": "Canada",
    "AU": "Australia", "DE": "Germany", "FR": "France", "AE": "United Arab Emirates",
    "SG": "Singapore", "JP": "Japan", "NL": "Netherlands", "SE": "Sweden",
    "NO": "Norway", "DK": "Denmark", "CH": "Switzerland", "AT": "Austria",
    "IE": "Ireland", "ES": "Spain", "IT": "Italy", "BR": "Brazil",
    "ZA": "South Africa", "RU": "Russia", "CN": "China", "HK": "Hong Kong"
}

# Geolocation Cache
GEO_CACHE = {}

def get_geo_info():
    # Priority 1: Cloudflare Headers
    country_code = request.headers.get('CF-IPCountry')
    region = request.headers.get('CF-IPRegion', 'Unknown')
    
    if country_code and country_code != 'XX':
        country = COUNTRY_MAP.get(country_code, country_code)
        return country, region

    # Priority 2: Fallback to ip-api.com
    ip = request.headers.get('CF-Connecting-IP') or \
         request.headers.get('X-Forwarded-For', '').split(',')[0].strip() or \
         request.remote_addr

    if not ip or ip in ['127.0.0.1', '::1']:
        return "Local", "Dev"

    if ip in GEO_CACHE:
        return GEO_CACHE[ip]

    try:
        r = requests.get(f"http://ip-api.com/json/{ip}?fields=status,country,countryCode,regionName", timeout=2)
        if r.status_code == 200:
            data = r.json()
            if data.get('status') == 'success':
                country = data.get('country')
                region = data.get('regionName')
                GEO_CACHE[ip] = (country, region)
                return country, region
    except Exception:
        pass

    return "Unknown", "Unknown"

def get_device():
    ua = request.headers.get('User-Agent', '').lower()
    if 'ipad' in ua or 'tablet' in ua:
        return 'Tablet'
    if 'mobile' in ua or 'android' in ua or 'iphone' in ua:
        return 'Mobile'
    return 'Desktop'

@app.route('/')
def home():
    return jsonify({"status": "online", "service": "occulo-tracker", "version": "1.0.1"})

@app.route('/logo.gif')
def beacon():
    duration = request.args.get('duration')
    if duration:
        try:
            dur_sec = int(float(duration))
            country, region = get_geo_info()
            device = get_device()
            now = datetime.now(timezone.utc)
            
            with get_db() as conn:
                conn.execute('''
                    INSERT INTO sessions (country, region, device, duration_sec, date, hour, timestamp)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                ''', (country, region, device, dur_sec, now.strftime('%Y-%m-%d'), now.hour, now.isoformat()))
                conn.commit()
        except Exception as e:
            app.logger.error(f"Error saving session: {e}")

    # 1x1 Transparent GIF
    gif = b'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
    return Response(gif, mimetype='image/gif')

@app.route('/api/inquiry', methods=['POST'])
def inquiry():
    data = request.get_json()
    if not data:
        return jsonify({"ok": False, "error": "No data"}), 400
    
    country, _ = get_geo_info()
    device = get_device()
    now = datetime.now(timezone.utc)
    
    with get_db() as conn:
        conn.execute('''
            INSERT INTO inquiries (name, email, message, country, device, timestamp)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (data.get('name'), data.get('email'), data.get('message'), country, device, now.isoformat()))
        conn.commit()
        
    return jsonify({"ok": True})

@app.route('/analytics')
@app.route('/analytics/')
def dashboard():
    try:
        with get_db() as conn:
            # Section 1: Numbers
            total_sessions = conn.execute('SELECT COUNT(*) FROM sessions').fetchone()[0]
            avg_dur = conn.execute('SELECT AVG(duration_sec) FROM sessions').fetchone()[0] or 0
            total_inquiries = conn.execute('SELECT COUNT(*) FROM inquiries').fetchone()[0]
            inquiry_rate = (total_inquiries / total_sessions * 100) if total_sessions > 0 else 0
            
            avg_min, avg_sec = divmod(int(avg_dur), 60)

            # Section 2: By Country
            countries = conn.execute('''
                SELECT country, COUNT(*) as count, AVG(duration_sec) as avg_dur
                FROM sessions GROUP BY country ORDER BY count DESC LIMIT 10
            ''').fetchall()

            # Section 3: By Region
            regions = conn.execute('''
                SELECT region, country, COUNT(*) as count
                FROM sessions GROUP BY region, country ORDER BY count DESC LIMIT 10
            ''').fetchall()

            # Section 4: By Device
            devices = conn.execute('''
                SELECT device, COUNT(*) as count
                FROM sessions GROUP BY device ORDER BY count DESC
            ''').fetchall()

            # Section 5: By Hour
            hours_raw = conn.execute('SELECT hour, COUNT(*) as count FROM sessions GROUP BY hour').fetchall()
            hours = {h['hour']: h['count'] for h in hours_raw}
            max_h = max(hours.values()) if hours else 1

            # Section 6: Recent Sessions
            recent_sessions = conn.execute('SELECT * FROM sessions ORDER BY timestamp DESC LIMIT 20').fetchall()

            # Section 7: Recent Inquiries
            recent_inquiries = conn.execute('SELECT * FROM inquiries ORDER BY timestamp DESC LIMIT 10').fetchall()

        # Build HTML
        html = f'''
        <!DOCTYPE html>
        <html>
        <head>
            <title>Occulo Analytics</title>
            <style>
                body {{ background: #0a0a0a; color: #fff; font-family: monospace; padding: 40px; line-height: 1.5; }}
                h1, h2 {{ border-bottom: 1px solid #333; padding-bottom: 10px; margin-top: 40px; letter-spacing: 2px; }}
                .numbers {{ display: flex; gap: 40px; margin-bottom: 40px; }}
                .stat {{ border: 1px solid #333; padding: 20px; flex: 1; }}
                .stat-val {{ font-size: 24px; font-weight: bold; color: #2c6bde; }}
                table {{ width: 100%; border-collapse: collapse; margin-top: 20px; }}
                th, td {{ text-align: left; padding: 8px; border-bottom: 1px solid #222; }}
                th {{ color: #666; font-size: 12px; text-transform: uppercase; }}
                .bar-row {{ display: flex; align-items: center; gap: 10px; margin: 2px 0; }}
                .bar {{ background: #2c6bde; height: 12px; }}
                .msg {{ color: #888; font-style: italic; }}
            </style>
        </head>
        <body>
            <h1>OCCULO INSTRUMENT PANEL</h1>
            
            <div class="numbers">
                <div class="stat"><div class="stat-val">{total_sessions}</div><div class="stat-label">Total Sessions</div></div>
                <div class="stat"><div class="stat-val">{avg_min}m {avg_sec}s</div><div class="stat-label">Avg. Time on Site</div></div>
                <div class="stat"><div class="stat-val">{total_inquiries}</div><div class="stat-label">Total Inquiries</div></div>
                <div class="stat"><div class="stat-val">{inquiry_rate:.1f}%</div><div class="stat-label">Inquiry Rate</div></div>
            </div>

            <h2>BY COUNTRY</h2>
            <table>
                <tr><th>Country</th><th>Sessions</th><th>Avg Dur</th><th>Share</th></tr>
                {''.join(f"<tr><td>{r['country']}</td><td>{r['count']}</td><td>{int(r['avg_dur'])}s</td><td>{(r['count']/total_sessions*100):.1f}%</td></tr>" for r in countries)}
            </table>

            <h2>BY REGION</h2>
            <table>
                <tr><th>Region</th><th>Country</th><th>Sessions</th></tr>
                {''.join(f"<tr><td>{r['region']}</td><td>{r['country']}</td><td>{r['count']}</td></tr>" for r in regions)}
            </table>

            <h2>BY DEVICE</h2>
            <table>
                <tr><th>Device</th><th>Count</th><th>Share</th></tr>
                {''.join(f"<tr><td>{r['device']}</td><td>{r['count']}</td><td>{(r['count']/total_sessions*100):.1f}%</td></tr>" for r in devices)}
            </table>

            <h2>BY HOUR (UTC)</h2>
            <div style="margin-top:20px;">
                {''.join(f'<div class="bar-row"><span>{h:02d}</span><div class="bar" style="width:{(hours.get(h,0)/max_h*300)}px"></div><span>{hours.get(h,0)}</span></div>' for h in range(24))}
            </div>

            <h2>RECENT SESSIONS</h2>
            <table>
                <tr><th>Date</th><th>Hour</th><th>Country</th><th>Region</th><th>Device</th><th>Duration</th></tr>
                {''.join(f"<tr><td>{r['date']}</td><td>{r['hour']:02d}:00</td><td>{r['country']}</td><td>{r['region']}</td><td>{r['device']}</td><td>{r['duration_sec']}s</td></tr>" for r in recent_sessions)}
            </table>

            <h2>RECENT INQUIRIES</h2>
            <table>
                <tr><th>Date</th><th>Name</th><th>Email</th><th>Country</th><th>Device</th><th>Message</th></tr>
                {''.join(f"<tr><td>{r['timestamp'][:10]}</td><td>{r['name']}</td><td>{r['email']}</td><td>{r['country']}</td><td>{r['device']}</td><td class='msg'>{r['message'][:80]}{'...' if len(r['message'])>80 else ''}</td></tr>" for r in recent_inquiries)}
            </table>
        </body>
        </html>
        '''
        return html
    except Exception as e:
        return f"Dashboard Error: {e}"

if __name__ == '__main__':
    port = int(os.getenv("PORT", 5000))
    app.run(host='0.0.0.0', port=port)
