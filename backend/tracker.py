import os
import json
import sqlite3
import requests
import uuid
from datetime import datetime, timezone
from flask import Flask, request, Response, jsonify
from flask_cors import CORS

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
                id TEXT PRIMARY KEY,
                country TEXT,
                region TEXT,
                device TEXT,
                duration_sec INTEGER DEFAULT 0,
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

def get_geo_info():
    country_code = request.headers.get('CF-IPCountry')
    region = request.headers.get('CF-IPRegion', 'Unknown')
    if country_code and country_code != 'XX':
        return country_code, region
    ip = request.headers.get('CF-Connecting-IP') or request.headers.get('X-Forwarded-For', '').split(',')[0].strip() or request.remote_addr
    try:
        r = requests.get(f"http://ip-api.com/json/{ip}?fields=status,countryCode,regionName", timeout=2)
        if r.status_code == 200:
            data = r.json()
            if data.get('status') == 'success': return data.get('countryCode'), data.get('regionName')
    except: pass
    return "US", "Unknown"

def get_device():
    ua = request.headers.get('User-Agent', '').lower()
    if 'ipad' in ua or 'tablet' in ua: return 'Tablet'
    if 'mobile' in ua or 'android' in ua or 'iphone' in ua: return 'Mobile'
    return 'Desktop'

@app.route('/')
def home():
    return jsonify({"status": "online", "service": "occulo-tracker", "version": "2.2.0"})

@app.route('/logo.gif', methods=['GET', 'POST'])
def beacon():
    sid = request.args.get('sid')
    duration = request.args.get('duration')
    if not sid and request.method == 'GET':
        new_sid = str(uuid.uuid4())
        country, region = get_geo_info()
        device = get_device()
        now = datetime.now(timezone.utc)
        try:
            with get_db() as conn:
                conn.execute('INSERT INTO sessions (id, country, region, device, date, hour, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)',
                           (new_sid, country, region, device, now.strftime('%Y-%m-%d'), now.hour, now.isoformat()))
                conn.commit()
            gif = b'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
            resp = Response(gif, mimetype='image/gif')
            resp.headers['X-Session-ID'] = new_sid
            return resp
        except: pass
    if sid and duration:
        try:
            dur_sec = int(float(duration))
            with get_db() as conn:
                conn.execute('UPDATE sessions SET duration_sec = ? WHERE id = ?', (dur_sec, sid))
                conn.commit()
        except: pass
    return Response(b'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', mimetype='image/gif')

@app.route('/api/inquiry', methods=['POST'])
def inquiry():
    data = request.get_json()
    country, _ = get_geo_info()
    device = get_device()
    now = datetime.now(timezone.utc).isoformat()
    with get_db() as conn:
        conn.execute('INSERT INTO inquiries (name, email, message, country, device, timestamp) VALUES (?, ?, ?, ?, ?, ?)',
                   (data.get('name'), data.get('email'), data.get('message'), country, device, now))
        conn.commit()
    return jsonify({"ok": True})

@app.route('/analytics')
@app.route('/analytics/')
def dashboard():
    with get_db() as conn:
        stats = conn.execute('SELECT COUNT(*) as total, AVG(duration_sec) as avg_dur FROM sessions').fetchone()
        avg_dur = stats['avg_dur'] if stats['avg_dur'] is not None else 0
        total_inquiries = conn.execute('SELECT COUNT(*) FROM inquiries').fetchone()[0]
        geo_data = conn.execute('SELECT country, COUNT(*) as count FROM sessions GROUP BY country').fetchall()
        hourly_data = conn.execute('SELECT hour, COUNT(*) as count FROM sessions GROUP BY hour ORDER BY hour').fetchall()
        recent = conn.execute('SELECT * FROM sessions ORDER BY timestamp DESC LIMIT 15').fetchall()

    return f'''
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>Occulo | Analytics Instrument</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <style>
            :root {{
                --bg: #f4f4f4;
                --primary: #2c6bde;
                --text-black: #000000;
                --text-white: #ffffff;
                --border: rgba(0, 0, 0, 0.08);
            }}
            * {{ box-sizing: border-box; -webkit-font-smoothing: antialiased; }}
            body {{ 
                background: var(--bg); 
                color: var(--text-black); 
                font-family: 'Inter', sans-serif; 
                margin: 0; padding: 0; 
            }}
            ::-webkit-scrollbar {{ display: none; }}
            .container {{ max-width: 1400px; margin: 0 auto; padding: 40px 20px; }}
            
            header {{ 
                display: flex; justify-content: space-between; align-items: center; 
                padding-bottom: 30px; border-bottom: 1px solid var(--border); margin-bottom: 40px; 
            }}
            .logo {{ font-weight: 800; letter-spacing: -0.02em; color: var(--primary); font-size: 1.5rem; }}
            .status {{ display: flex; align-items: center; gap: 8px; font-size: 0.75rem; font-weight: 700; color: #666; text-transform: uppercase; letter-spacing: 0.1em; }}
            .dot {{ width: 8px; height: 8px; background: #10b981; border-radius: 50%; box-shadow: 0 0 8px #10b981; animation: pulse 2s infinite; }}
            @keyframes pulse {{ 0% {{ opacity: 1; }} 50% {{ opacity: 0.5; }} 100% {{ opacity: 1; }} }}

            .kpi-grid {{ display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; margin-bottom: 40px; }}
            .kpi-card {{ 
                background: var(--primary); 
                color: var(--text-white);
                padding: 32px; 
                border-radius: 24px;
                box-shadow: 0 10px 30px rgba(44, 107, 222, 0.15);
                transition: transform 0.3s ease;
            }}
            .kpi-card:hover {{ transform: translateY(-6px); }}
            .kpi-label {{ opacity: 0.8; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; margin-bottom: 12px; }}
            .kpi-value {{ font-size: 2.5rem; font-weight: 800; }}

            .main-grid {{ display: grid; grid-template-columns: 1.8fr 1fr; gap: 24px; margin-bottom: 24px; }}
            .panel {{ 
                background: #ffffff; 
                border: 1px solid var(--border); 
                border-radius: 32px; 
                padding: 40px; 
                box-shadow: 0 4px 20px rgba(0,0,0,0.02);
            }}
            .panel-title {{ font-size: 0.9rem; font-weight: 700; color: #999; text-transform: uppercase; margin-bottom: 30px; letter-spacing: 0.05em; }}
            
            #map {{ height: 450px; border-radius: 24px; background: #eee; overflow: hidden; border: 1px solid #eee; }}
            .chart-container {{ height: 350px; position: relative; }}
            
            table {{ width: 100%; border-collapse: collapse; font-size: 0.9rem; }}
            th {{ text-align: left; color: #999; padding: 15px 10px; border-bottom: 1px solid var(--border); }}
            td {{ padding: 20px 10px; border-bottom: 1px solid #f9f9f9; font-weight: 500; }}
            .tag {{ background: rgba(44, 107, 222, 0.1); color: var(--primary); padding: 6px 12px; border-radius: 8px; font-weight: 700; font-size: 0.75rem; }}
            tr:hover {{ background: #fcfcfc; }}
        </style>
    </head>
    <body>
        <div class="container">
            <header>
                <div class="logo">OCCULO INSTRUMENT</div>
                <div class="status"><div class="dot"></div> LIVE SYSTEM FEED</div>
            </header>

            <div class="kpi-grid">
                <div class="kpi-card">
                    <div class="kpi-label">TOTAL SESSIONS</div>
                    <div class="kpi-value">{stats['total']}</div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-label">AVERAGE DURATION</div>
                    <div class="kpi-value">{int(avg_dur)}s</div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-label">TOTAL INQUIRIES</div>
                    <div class="kpi-value">{total_inquiries}</div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-label">ENGAGEMENT RATE</div>
                    <div class="kpi-value">{(total_inquiries/stats['total']*100 if stats['total']>0 else 0):.1f}%</div>
                </div>
            </div>

            <div class="main-grid">
                <div class="panel">
                    <div class="panel-title">Active Spatial Nodes</div>
                    <div id="map"></div>
                </div>
                <div class="panel">
                    <div class="panel-title">System Load (24h)</div>
                    <div class="chart-container">
                        <canvas id="trafficChart"></canvas>
                    </div>
                </div>
            </div>

            <div class="panel" style="margin-top: 24px;">
                <div class="panel-title">Raw Telemetry Stream</div>
                <table>
                    <thead>
                        <tr><th>Timestamp</th><th>Node Origin</th><th>Sub-Region</th><th>Device Platform</th><th>Dur.</th></tr>
                    </thead>
                    <tbody>
                        {''.join(f"<tr><td>{r['timestamp'][11:19]}</td><td><span class='tag'>{r['country']}</span></td><td>{r['region']}</td><td>{r['device']}</td><td>{r['duration_sec']}s</td></tr>" for r in recent)}
                    </tbody>
                </table>
            </div>
        </div>

        <script>
            // Map Initialization
            const map = L.map('map', {{ zoomControl: false }}).setView([20, 0], 2);
            L.tileLayer('https://{{s}}.basemaps.cartocdn.com/rastertiles/voyager/{{z}}/{{x}}/{{y}}{{r}}.png').addTo(map);

            const countryCoords = {{
                'US': [37, -95], 'GB': [55, -2], 'IN': [20, 78], 'DE': [51, 9], 'FR': [46, 2],
                'CA': [56, -106], 'AU': [-25, 133], 'JP': [36, 138], 'BR': [-14, -51]
            }};

            const geoData = {json.dumps([dict(r) for r in geo_data])};
            geoData.forEach(d => {{
                const coords = countryCoords[d.country] || [Math.random()*60, Math.random()*60];
                L.circle(coords, {{
                    color: '#2c6bde',
                    fillColor: '#2c6bde',
                    fillOpacity: 0.6,
                    radius: 400000 + (d.count * 15000),
                    weight: 2
                }}).addTo(map);
            }});

            // Line Chart Initialization
            const ctx = document.getElementById('trafficChart').getContext('2d');
            new Chart(ctx, {{
                type: 'line',
                data: {{
                    labels: {json.dumps([r['hour'] for r in hourly_data])},
                    datasets: [{{
                        label: 'Visits',
                        data: {json.dumps([r['count'] for r in hourly_data])},
                        borderColor: '#2c6bde',
                        backgroundColor: 'rgba(44, 107, 222, 0.05)',
                        fill: true,
                        tension: 0.4,
                        borderWidth: 4,
                        pointRadius: 4,
                        pointBackgroundColor: '#fff',
                        pointBorderColor: '#2c6bde',
                        pointBorderWidth: 2
                    }}]
                }},
                options: {{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {{ legend: {{ display: false }} }},
                    scales: {{
                        x: {{ grid: {{ display: false }}, ticks: {{ color: '#999', font: {{ family: 'Inter', weight: 600 }} }} }},
                        y: {{ grid: {{ color: '#eee' }}, ticks: {{ color: '#999', font: {{ family: 'Inter' }} }} }}
                    }}
                }}
            }});
        </script>
    </body>
    </html>
    '''

if __name__ == '__main__':
    port = int(os.getenv("PORT", 5000))
    app.run(host='0.0.0.0', port=port)
