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
                sid TEXT UNIQUE,
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

# Improved Coordinate Mapping
COUNTRY_COORDS = {
    'India': [20.59, 78.96], 'United States': [37.09, -95.71], 'United Kingdom': [55.37, -3.43],
    'Germany': [51.16, 10.45], 'France': [46.22, 2.21], 'Canada': [56.13, -106.34],
    'Australia': [-25.27, 133.77], 'Singapore': [1.35, 103.81], 'Japan': [36.20, 138.25],
    'Netherlands': [52.13, 5.29], 'United Arab Emirates': [23.42, 53.84], 'Brazil': [-14.23, -51.92]
}

# ... (rest of geo/device functions)

@app.route('/logo.gif', methods=['GET', 'POST'])
def beacon():
    sid = request.args.get('sid')
    duration = request.args.get('duration')
    
    if sid:
        try:
            country, region = get_geo_info()
            device = get_device()
            now = datetime.now(timezone.utc)
            dur_sec = int(float(duration)) if duration else 0
            
            with get_db() as conn:
                # Check if session exists
                existing = conn.execute('SELECT id FROM sessions WHERE sid = ?', (sid,)).fetchone()
                if existing:
                    if dur_sec > 0:
                        conn.execute('UPDATE sessions SET duration_sec = ? WHERE sid = ?', (dur_sec, sid))
                else:
                    conn.execute('''
                        INSERT INTO sessions (sid, country, region, device, duration_sec, date, hour, timestamp)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    ''', (sid, country, region, device, dur_sec, now.strftime('%Y-%m-%d'), now.hour, now.isoformat()))
                conn.commit()
        except Exception as e:
            app.logger.error(f"Beacon Error: {e}")

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

            # Section 2: By Country (for Map and Table)
            countries_data = conn.execute('''
                SELECT country, COUNT(*) as count, AVG(duration_sec) as avg_dur
                FROM sessions GROUP BY country ORDER BY count DESC
            ''').fetchall()
            
            # Prepare data for JS Map
            map_data = {r['country']: r['count'] for r in countries_data}

            # Section 3: By Region
            regions = conn.execute('''
                SELECT region, country, COUNT(*) as count
                FROM sessions GROUP BY region, country ORDER BY count DESC LIMIT 10
            ''').fetchall()

            # Section 4: By Device
            devices_data = conn.execute('''
                SELECT device, COUNT(*) as count
                FROM sessions GROUP BY device ORDER BY count DESC
            ''').fetchall()

            # Section 5: By Hour
            hours_raw = conn.execute('SELECT hour, COUNT(*) as count FROM sessions GROUP BY hour').fetchall()
            hours_map = {h['hour']: h['count'] for h in hours_raw}
            hour_labels = [f"{h:02d}:00" for h in range(24)]
            hour_values = [hours_map.get(h, 0) for h in range(24)]

            # Recent Items
            recent_sessions = conn.execute('SELECT * FROM sessions ORDER BY timestamp DESC LIMIT 20').fetchall()
            recent_inquiries = conn.execute('SELECT * FROM inquiries ORDER BY timestamp DESC LIMIT 10').fetchall()

        # Build HTML
        return f'''
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Occulo Analytics | Instrument Panel</title>
            <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
            <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
            <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
            <style>
                :root {{ --primary: #2c6bde; --bg: #0a0a0a; --card: #141414; --border: #222; --text: #eee; --text-dim: #666; }}
                * {{ box-sizing: border-box; }}
                body {{ background: var(--bg); color: var(--text); font-family: 'Inter', -apple-system, monospace; margin: 0; padding: 20px; }}
                .container {{ max-width: 1400px; margin: 0 auto; }}
                header {{ display: flex; justify-content: space-between; align-items: center; padding: 20px 0; border-bottom: 1px solid var(--border); margin-bottom: 30px; }}
                .logo-text {{ font-weight: 800; letter-spacing: 4px; color: var(--primary); font-size: 1.2rem; }}
                
                .grid {{ display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 30px; }}
                .stat-card {{ background: var(--card); border: 1px solid var(--border); padding: 25px; border-radius: 12px; }}
                .stat-label {{ color: var(--text-dim); font-size: 0.75rem; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; }}
                .stat-value {{ font-size: 2rem; font-weight: 700; color: var(--text); }}
                
                .main-grid {{ display: grid; grid-template-columns: 2fr 1fr; gap: 20px; margin-bottom: 30px; }}
                .panel {{ background: var(--card); border: 1px solid var(--border); border-radius: 12px; padding: 25px; }}
                .panel-header {{ font-size: 0.85rem; font-weight: 700; color: var(--text-dim); text-transform: uppercase; margin-bottom: 20px; border-bottom: 1px solid var(--border); padding-bottom: 10px; }}
                
                #map {{ height: 400px; border-radius: 8px; background: #111; }}
                
                table {{ width: 100%; border-collapse: collapse; font-size: 0.85rem; }}
                th {{ text-align: left; color: var(--text-dim); padding: 12px 8px; border-bottom: 1px solid var(--border); }}
                td {{ padding: 12px 8px; border-bottom: 1px solid #1a1a1a; }}
                tr:hover {{ background: #1a1a1a; }}
                
                .badge {{ background: var(--primary); color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.7rem; font-weight: 700; }}
                .msg {{ color: var(--text-dim); font-style: italic; font-size: 0.8rem; }}
            </style>
        </head>
        <body>
            <div class="container">
                <header>
                    <div class="logo-text">OCCULO / INSTRUMENT</div>
                    <div style="font-size: 0.75rem; color: var(--text-dim);">LIVE ANALYTICS FEED • UTC {datetime.now(timezone.utc).strftime('%H:%M')}</div>
                </header>

                <div class="grid">
                    <div class="stat-card">
                        <div class="stat-label">Total Traffic</div>
                        <div class="stat-value">{total_sessions}</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">Avg. Persistence</div>
                        <div class="stat-value">{avg_min}m {avg_sec}s</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">Gross Inquiries</div>
                        <div class="stat-value">{total_inquiries}</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">Capture Rate</div>
                        <div class="stat-value">{inquiry_rate:.1f}%</div>
                    </div>
                </div>

                <div class="main-grid">
                    <div class="panel">
                        <div class="panel-header">Spatial Distribution</div>
                        <div id="map"></div>
                    </div>
                    <div class="panel">
                        <div class="panel-header">Temporal Activity</div>
                        <canvas id="hourChart"></canvas>
                    </div>
                </div>

                <div class="main-grid">
                    <div class="panel">
                        <div class="panel-header">Geographic Breakdown</div>
                        <table>
                            <thead><tr><th>Country</th><th>Sessions</th><th>Avg Dur</th><th>Share</th></tr></thead>
                            <tbody>
                                {''.join(f"<tr><td>{r['country']}</td><td>{r['count']}</td><td>{int(r['avg_dur'])}s</td><td><span class='badge'>{(r['count']/total_sessions*100 if total_sessions > 0 else 0):.1f}%</span></td></tr>" for r in countries_data[:8])}
                            </tbody>
                        </table>
                    </div>
                    <div class="panel">
                        <div class="panel-header">Device Composition</div>
                        <canvas id="deviceChart"></canvas>
                    </div>
                </div>

                <div class="panel" style="margin-bottom: 30px;">
                    <div class="panel-header">Lead Pipeline (Recent Inquiries)</div>
                    <table>
                        <thead><tr><th>Date</th><th>Name</th><th>Email</th><th>Origin</th><th>Device</th><th>Message Preview</th></tr></thead>
                        <tbody>
                            {''.join(f"<tr><td>{r['timestamp'][:10]}</td><td>{r['name']}</td><td>{r['email']}</td><td>{r['country']}</td><td>{r['device']}</td><td class='msg'>{r['message'][:70]}...</td></tr>" for r in recent_inquiries)}
                        </tbody>
                    </table>
                </div>
            </div>

            <script>
                // Hour Chart
                new Chart(document.getElementById('hourChart'), {{
                    type: 'bar',
                    data: {{
                        labels: {json.dumps(hour_labels)},
                        datasets: [{{
                            label: 'Sessions',
                            data: {json.dumps(hour_values)},
                            backgroundColor: '#2c6bde',
                            borderRadius: 4
                        }}]
                    }},
                    options: {{
                        responsive: true,
                        plugins: {{ legend: {{ display: false }} }},
                        scales: {{ 
                            y: {{ beginAtZero: true, grid: {{ color: '#222' }}, ticks: {{ color: '#666' }} }},
                            x: {{ grid: {{ display: false }}, ticks: {{ color: '#666' }} }}
                        }}
                    }}
                }});

                // Device Chart
                new Chart(document.getElementById('deviceChart'), {{
                    type: 'doughnut',
                    data: {{
                        labels: {json.dumps([r['device'] for r in devices_data])},
                        datasets: [{{
                            data: {json.dumps([r['count'] for r in devices_data])},
                            backgroundColor: ['#2c6bde', '#1a4ba3', '#0d2d66'],
                            borderWidth: 0
                        }}]
                    }},
                    options: {{
                        responsive: true,
                        cutout: '70%',
                        plugins: {{ 
                            legend: {{ position: 'bottom', labels: {{ color: '#eee', boxWidth: 12, padding: 20 }} }} 
                        }}
                    }}
                }});

                // World Map Initialization
                const map = L.map('map', {{ zoomControl: false, attributionControl: false }}).setView([20, 0], 2);
                L.tileLayer('https://{{s}}.basemaps.cartocdn.com/dark_all/{{z}}/{{x}}/{{y}}{{r}}.png').addTo(map);

                const countryData = {json.dumps(map_data)};
                const coords = {{
                    'India': [20.59, 78.96], 'United States': [37.09, -95.71], 'United Kingdom': [55.37, -3.43],
                    'Germany': [51.16, 10.45], 'France': [46.22, 2.21], 'Canada': [56.13, -106.34]
                }};

                Object.keys(countryData).forEach(country => {{
                    if (coords[country]) {{
                        L.circle(coords[country], {{
                            color: '#2c6bde', fillColor: '#2c6bde', fillOpacity: 0.5,
                            radius: Math.sqrt(countryData[country]) * 200000
                        }}).addTo(map).bindPopup(country + ': ' + countryData[country] + ' sessions');
                    }}
                }});
            </script>
        </body>
        </html>
        '''
    except Exception as e:
        return f"Dashboard Error: {str(e)}", 500

if __name__ == '__main__':
    port = int(os.getenv("PORT", 5000))
    app.run(host='0.0.0.0', port=port)
