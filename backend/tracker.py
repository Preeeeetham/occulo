import os, json, psycopg2, requests, uuid, time
from psycopg2.extras import RealDictCursor
from datetime import datetime, timezone, timedelta
from flask import Flask, request, Response, jsonify, session, redirect, url_for, render_template, g
from flask_cors import CORS
from authlib.integrations.flask_client import OAuth
from dotenv import load_dotenv
from ip_resolver import get_real_ip
from geo_service import get_geo_info, cache as redis_cache

load_dotenv()

# Allow OAuth over HTTP for local development
os.environ['AUTHLIB_INSECURE_TRANSPORT'] = '1'

app = Flask(__name__)
from werkzeug.middleware.proxy_fix import ProxyFix
# Trust 2 proxies (Cloudflare + Railway) to get the real User IP
app.wsgi_app = ProxyFix(app.wsgi_app, x_for=2, x_proto=2, x_host=2)

app.secret_key = os.getenv("SECRET_KEY", "occulo_fallback_secret_dev_only")
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
CORS(app)

# Load allowed emails from .env, split by comma, and clean up whitespace
_env_emails = os.getenv("ALLOWED_EMAILS", "")
ALLOWED_EMAILS = [e.strip().lower() for e in _env_emails.split(",") if e.strip()]



oauth = OAuth(app)
google = oauth.register(
    name='google',
    client_id=os.getenv("GOOGLE_CLIENT_ID"),
    client_secret=os.getenv("GOOGLE_CLIENT_SECRET"),
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    client_kwargs={'scope': 'openid email profile'}
)

DATABASE_URL = os.getenv("DATABASE_URL")

PIXEL_GIF = b'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
START_TIME = time.time()

def get_db():
    if not DATABASE_URL:
        raise EnvironmentError("DATABASE_URL is missing! Please add it to your environment variables.")
    conn = psycopg2.connect(DATABASE_URL)
    return conn

def ensure_col(conn, tbl, col, defn):
    with conn.cursor() as cur:
        try:
            cur.execute(f'ALTER TABLE {tbl} ADD COLUMN IF NOT EXISTS {col} {defn}')
            conn.commit()
        except Exception as e:
            conn.rollback()
            print(f"Schema Migration Error: Failed to add column '{col}' to '{tbl}': {e}")

def init_db():
    conn = get_db()
    with conn.cursor() as cur:
        cur.execute('''CREATE TABLE IF NOT EXISTS sessions (
            id TEXT PRIMARY KEY, country TEXT, region TEXT, device TEXT,
            duration_sec INTEGER DEFAULT 0, date TEXT, hour INTEGER, timestamp TIMESTAMPTZ,
            ip TEXT, path TEXT, last_event TEXT, updated_at TIMESTAMPTZ)''')
        cur.execute('''CREATE TABLE IF NOT EXISTS inquiries (
            id SERIAL PRIMARY KEY, name TEXT, email TEXT, message TEXT,
            company TEXT, phone TEXT, inquiry_type TEXT,
            country TEXT, device TEXT, timestamp TIMESTAMPTZ)''')
    for col in ['path','last_event','updated_at','ip']: ensure_col(conn,'sessions',col,'TEXT')
    for col in ['company','phone','inquiry_type']: ensure_col(conn,'inquiries',col,'TEXT')
    conn.commit()
    conn.close()
init_db()

def no_store(resp):
    resp.headers['Cache-Control'] = 'no-store'
    return resp

@app.before_request
def handle_session():
    # Enforce permanent session to respect the TTL
    session.permanent = True
    is_new_session = False
    sid = session.get("session_id")
    
    if not sid:
        sid = str(uuid.uuid4())
        session["session_id"] = sid
        is_new_session = True
        
    g.session_id = sid
    
    # Only perform expensive IP and Geo lookups for new sessions
    if is_new_session:
        ip, source, trusted = get_real_ip(request)
        g.geo_data = get_geo_info(ip, source, trusted)
        # Log to debug for verification
        print(f"New Session Created: {sid} | Source: {source} | Trusted: {trusted}")
    
    # Refresh TTL in Redis on every request to track active presence
    if redis_cache:
        try:
            redis_cache.setex(f"session:active:{sid}", 3600, "1")
        except Exception as e:
            print(f"Redis Session Refresh Error: {e}")

def get_payload():
    d = {}
    if request.is_json:
        try:
            d.update(request.get_json(silent=True) or {})
        except Exception:
            pass
    d.update(request.form.to_dict())
    d.update(request.args.to_dict())
    return d

def get_geo():
    country, city = "Unknown", "Unknown"
    
    # If geo_data was precomputed in handle_session, use it
    if hasattr(g, 'geo_data') and g.geo_data:
        country = g.geo_data.get('country', 'Unknown')
        city = g.geo_data.get('city', 'Unknown')
    else:
        try:
            ip, source, trusted = get_real_ip(request)
            geo = get_geo_info(ip, source, trusted)
            country = geo.get('country', 'Unknown')
            city = geo.get('city', 'Unknown')
        except Exception as e:
            print(f"Fallback GeoIP Resolution failed: {e}")
            
    # Standard Cloudflare header check as secondary fallback
    if country == "Unknown":
        cc = request.headers.get('CF-IPCountry')
        if cc and cc not in ['XX', 'T1']: 
            country = cc
            
    if city == "Unknown":
        city = request.headers.get('CF-IPRegion', 'Unknown')
        
    return country if country != "Unknown" else "US", city

def get_device():
    ua = request.headers.get('User-Agent','').lower()
    if 'ipad' in ua or 'tablet' in ua: return 'Tablet'
    if 'mobile' in ua or 'android' in ua or 'iphone' in ua: return 'Mobile'
    return 'Desktop'

def auth_required(f):
    def wrap(*a, **kw):
        if 'user' not in session: return redirect(url_for('login'))
        return f(*a, **kw)
    wrap.__name__ = f.__name__
    return wrap

# --- AUTH ROUTES ---
@app.route('/login')
def login():
    return google.authorize_redirect(url_for('callback', _external=True))

@app.route('/auth/callback')
def callback():
    try:
        token = google.authorize_access_token()
        resp = google.get('https://openidconnect.googleapis.com/v1/userinfo')
        user = resp.json()
        if not user or not user.get('email'):
            return render_template('403.html'), 403
            
        user_email = user.get('email').lower()
        if ALLOWED_EMAILS and user_email not in ALLOWED_EMAILS:
            print(f"Access Denied: {user_email} is not in ALLOWED_EMAILS")
            return render_template('403.html'), 403
            
        session['user'] = {'email': user['email'], 'name': user.get('name', 'Authorized User')}
        return redirect('/analytics')
    except Exception as e:
        # If the OAuth flow fails (invalid state, token error, access denied)
        print("OAuth Exception:", e)
        return render_template('403.html'), 403

@app.route('/logout')
def logout():
    sid = session.pop("session_id", None)
    if sid and redis_cache:
        try:
            redis_cache.delete(f"session:active:{sid}")
        except Exception as e:
            print(f"Redis Session Cleanup Error: {e}")
    session.clear()
    return redirect('/')

# --- PUBLIC ENDPOINTS ---
@app.route('/')
def home():
    # Redirect root domain access directly to the protected dashboard
    return redirect('/analytics')

@app.route('/logo.svg')
def serve_logo():
    # Serve the exact white logo used in the frontend hero section
    from flask import send_file
    import os
    logo_path = os.path.join(os.path.dirname(__file__), '../src/imports/1.svg')
    if os.path.exists(logo_path):
        return send_file(logo_path, mimetype='image/svg+xml')
    return "Not found", 404

@app.route('/logo.gif', methods=['GET','POST'])
@app.route('/_o/p.gif', methods=['GET','POST'])
def beacon():
    try:
        d = get_payload()
        sid = (d.get('sid') or '').strip()

        # Debug: track incoming beacons
        print(f"Beacon Received | SID: {sid} | IP: {request.remote_addr}")

        dur = d.get('duration')
        path = d.get('path', '/')
        event = d.get('event', 'ping')
        country, region = get_geo()
        device = get_device()
        now = datetime.now(timezone.utc)
        iso = now.isoformat()
        ip, _, _ = get_real_ip(request)

        # Tighten session de-duplication:
        if not sid:
            cutoff = (now - timedelta(minutes=30)).isoformat()
            conn = get_db()
            try:
                with conn.cursor() as cur:
                    cur.execute('SELECT id FROM sessions WHERE ip=%s AND timestamp > %s ORDER BY timestamp DESC LIMIT 1', (ip, cutoff))
                    row = cur.fetchone()
                    if row:
                        sid = row[0]
            except Exception as e:
                print(f"Error querying active session: {e}")
            finally:
                conn.close()

        if not sid:
            sid = str(uuid.uuid4())

        conn = get_db()
        try:
            with conn.cursor() as cur:
                try:
                    cur.execute('''INSERT INTO sessions
                        (id,country,region,device,duration_sec,date,hour,timestamp,ip,path,last_event,updated_at)
                        VALUES (%s,%s,%s,%s,0,%s,%s,%s,%s,%s,%s,%s)''',
                        (sid, country, region, device, now.strftime('%Y-%m-%d'), now.hour, iso, ip, path, event, iso))
                    print(f"NEW SESSION CREATED: {sid}")
                except psycopg2.errors.UniqueViolation:
                    conn.rollback()
                    cur.execute('''UPDATE sessions SET
                        ip=%s, path=%s, last_event=%s, updated_at=%s
                        WHERE id=%s''',
                        (ip, path, event, iso, sid))
                    print(f"EXISTING SESSION UPDATED: {sid}")

                if dur:
                    try: cur.execute('UPDATE sessions SET duration_sec=GREATEST(COALESCE(duration_sec,0),%s) WHERE id=%s', (int(float(dur)), sid))
                    except: pass
                conn.commit()
        except Exception as e:
            print(f"Database Error in beacon: {e}")
        finally:
            conn.close()

    except Exception as e:
        print(f"Critical Error in beacon endpoint: {e}")

    resp = Response(PIXEL_GIF, mimetype='image/gif')
    resp.headers['X-Session-ID'] = sid if 'sid' in locals() else ''
    return no_store(resp)

@app.route('/api/inquiry', methods=['POST'])
@app.route('/_o/inquiry', methods=['POST'])
def inquiry():
    d = get_payload()
    country, _ = get_geo()
    conn = get_db()
    with conn.cursor() as cur:
        cur.execute('INSERT INTO inquiries (name,email,message,company,phone,inquiry_type,country,device,timestamp) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)',
            (d.get('name'), d.get('email'), d.get('message'), d.get('company'), d.get('phone'), d.get('inquiry_type'), country, get_device(), datetime.now(timezone.utc).isoformat()))
        conn.commit()
    conn.close()

    # Trigger EmailJS via Backend HTTP Request
    try:
        service_id = os.getenv("EMAILJS_SERVICE_ID") or os.getenv("VITE_EMAILJS_SERVICE_ID")
        template_id = os.getenv("EMAILJS_TEMPLATE_ID") or os.getenv("VITE_EMAILJS_TEMPLATE_ID")
        public_key = os.getenv("EMAILJS_PUBLIC_KEY") or os.getenv("VITE_EMAILJS_PUBLIC_KEY")
        private_key = os.getenv("EMAILJS_PRIVATE_KEY")
        
        if service_id and template_id and public_key:
            email_payload = {
                "service_id": service_id,
                "template_id": template_id,
                "user_id": public_key,
                "accessToken": private_key,
                "template_params": {
                    "name": d.get('name', 'Unknown'),
                    "email": d.get('email', 'No Email'),
                    "inquiry_type": d.get('inquiry_type', 'General'),
                    "message": d.get('message', ''),
                    "company": d.get('company', 'None'),
                    "phone": d.get('phone', 'None'),
                    "country": country
                }
            }
            r = requests.post("https://api.emailjs.com/api/v1.0/email/send", json=email_payload, timeout=5)
            if not r.ok:
                print(f"EmailJS Error {r.status_code}: {r.text}")
            else:
                print("EmailJS Success: Email queued.")
    except Exception as e:
        print("EmailJS Exception:", e)

    return jsonify({"ok": True})

# --- PROTECTED ENDPOINTS ---
@app.route('/api/analytics-data')
@auth_required
def api_data():
    conn = get_db()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # Get total count of sessions
            cur.execute('SELECT COUNT(*) as total FROM sessions')
            total_sessions = cur.fetchone()['total']
            print(f"Analytics Request | Total Sessions in DB: {total_sessions}")

            cur.execute('SELECT * FROM sessions ORDER BY timestamp DESC LIMIT 2000')
            s = []
            for r in cur.fetchall():
                row = dict(r)
                for k in ['timestamp', 'updated_at']:
                    if row.get(k) and hasattr(row[k], 'isoformat'):
                        row[k] = row[k].isoformat()
                s.append(row)

            cur.execute('SELECT * FROM inquiries ORDER BY timestamp DESC')
            i = []
            for r in cur.fetchall():
                row = dict(r)
                if row.get('timestamp') and hasattr(row['timestamp'], 'isoformat'):
                    row['timestamp'] = row['timestamp'].isoformat()
                i.append(row)
        return no_store(jsonify({"sessions": s, "inquiries": i, "total_sessions": total_sessions}))
    except Exception as e:
        print(f"Error in api_data: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

@app.route('/analytics')
@app.route('/analytics/')
@auth_required
def dashboard():
    user = session.get('user', {})
    html = f'''<!DOCTYPE html>
<html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Occulo Instrument</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script src="https://unpkg.com/leaflet.heat@0.2.0/dist/leaflet-heat.js"></script>
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<style>
:root{{--p:#3b82f6;--bg:#0f172a;--card:rgba(30,41,59,0.7);--txt:#f8fafc;--dim:#94a3b8;--bdr:rgba(255,255,255,0.08);--r:16px;--glass:rgba(15,23,42,0.6);--neon:#0ea5e9}}
*{{box-sizing:border-box;margin:0;padding:0}}
body{{background:var(--bg);color:var(--txt);font-family:'Inter',sans-serif;display:flex;min-height:100vh;background-image:radial-gradient(circle at 15% 50%, rgba(59,130,246,0.12), transparent 25%), radial-gradient(circle at 85% 30%, rgba(168,85,247,0.12), transparent 25%)}}
aside{{width:260px;background:var(--card);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border-right:1px solid var(--bdr);padding:32px 24px;display:flex;flex-direction:column;position:fixed;top:0;bottom:0;box-shadow:4px 0 24px rgba(0,0,0,0.2), inset -1px 0 0 rgba(255,255,255,0.05)}}
.brand{{font-weight:800;font-size:1.3rem;background:linear-gradient(90deg, #3b82f6, #8b5cf6);-webkit-background-clip:text;-webkit-text-fill-color:transparent;letter-spacing:-.02em;margin-bottom:8px}}
.brand-sub{{font-size:.65rem;color:var(--dim);text-transform:uppercase;letter-spacing:.15em;margin-bottom:40px;font-weight:600}}
.s-nav{{flex:1}}
.s-link{{display:block;padding:12px 16px;border-radius:10px;color:var(--dim);font-weight:600;font-size:.88rem;cursor:pointer;transition:all .2s ease;margin-bottom:4px;border:1px solid transparent}}
.s-link:hover{{background:rgba(255,255,255,0.03);color:var(--txt)}}
.s-link.on{{background:linear-gradient(90deg, rgba(59,130,246,0.15), transparent);color:var(--p);border-left:2px solid var(--p)}}
.s-foot{{border-top:1px solid var(--bdr);padding-top:20px;margin-top:auto}}
.s-foot .email{{font-size:.75rem;color:var(--dim);word-break:break-all;margin-bottom:8px}}
.s-foot a{{color:#ef4444;font-size:.78rem;font-weight:700;text-decoration:none;transition:.2s}}
.s-foot a:hover{{color:#f87171;text-shadow:0 0 8px rgba(239,68,68,0.4)}}
main{{margin-left:260px;flex:1;padding:40px 48px;overflow-y:auto}}
.top{{display:flex;justify-content:space-between;align-items:center;margin-bottom:32px}}
h1{{font-size:1.6rem;font-weight:800;letter-spacing:-.02em;color:#fff}}
.live{{display:flex;align-items:center;gap:8px;background:rgba(16,185,129,0.1);color:#34d399;padding:6px 16px;border-radius:99px;font-size:.72rem;font-weight:700;border:1px solid rgba(16,185,129,0.2);box-shadow:0 0 12px rgba(16,185,129,0.1)}}
.dot{{width:8px;height:8px;background:#34d399;border-radius:50%;box-shadow:0 0 8px #34d399;animation:p 2s infinite}}
@keyframes p{{50%{{opacity:.4;box-shadow:none}}}}
.kpis{{display:grid;grid-template-columns:repeat(4,1fr);gap:24px;margin-bottom:32px}}
.kpi{{background:var(--card);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border:1px solid var(--bdr);padding:24px;border-radius:var(--r);transition:all .3s ease;box-shadow:0 4px 16px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.05)}}
.kpi:hover{{transform:translateY(-3px);border-color:rgba(59,130,246,0.3);box-shadow:0 8px 24px rgba(0,0,0,0.2), inset 0 0 20px rgba(59,130,246,0.05)}}
.kpi small{{display:block;font-size:.7rem;font-weight:600;text-transform:uppercase;letter-spacing:.1em;color:var(--dim);margin-bottom:8px}}
.kpi .v{{font-size:1.8rem;font-weight:800;color:#fff}}
.row{{display:grid;grid-template-columns:1.7fr 1fr;gap:24px;margin-bottom:24px}}
.c{{background:var(--card);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border:1px solid var(--bdr);border-radius:var(--r);padding:24px;box-shadow:0 4px 16px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.05)}}
.c h3{{font-size:.85rem;font-weight:700;color:var(--dim);text-transform:uppercase;letter-spacing:.05em;margin-bottom:20px}}
#map{{height:420px;border-radius:12px;border:1px solid var(--bdr);background:#0f172a}}
.ch{{height:320px}}
table{{width:100%;border-collapse:collapse}}
th{{text-align:left;padding:12px;border-bottom:1px solid var(--bdr);color:var(--dim);font-size:.72rem;text-transform:uppercase;font-weight:700;letter-spacing:.05em}}
td{{padding:16px 12px;border-bottom:1px solid rgba(255,255,255,0.03);font-size:.85rem;font-weight:500;color:#e2e8f0}}
tr:hover td{{background:rgba(255,255,255,0.02)}}
.tg{{background:rgba(59,130,246,0.15);color:#60a5fa;border:1px solid rgba(59,130,246,0.2);padding:4px 10px;border-radius:6px;font-weight:600;font-size:.72rem}}
.bar{{display:flex;align-items:center;gap:10px}}.bar i{{height:6px;background:linear-gradient(90deg, #3b82f6, #8b5cf6);border-radius:3px;display:block;box-shadow:0 0 8px rgba(59,130,246,0.4)}}
.empty{{text-align:center;padding:60px;color:var(--dim);font-size:.9rem;font-weight:500}}
.tab{{display:none;animation:fade .3s ease}}.tab.on{{display:block}}
@keyframes fade{{from{{opacity:0;transform:translateY(10px)}}to{{opacity:1;transform:translateY(0)}}}}
.sub-tab-btn{{background:transparent;border:1px solid transparent;padding:8px 14px;font-size:.82rem;font-weight:600;color:var(--dim);cursor:pointer;border-radius:8px;transition:all .2s;display:flex;align-items:center;gap:8px}}
.sub-tab-btn:hover{{background:rgba(255,255,255,0.05);color:var(--txt)}}
.sub-tab-btn.on{{background:rgba(59,130,246,0.15);color:#60a5fa;border-color:rgba(59,130,246,0.2)}}
.live-indicator-dot{{width:8px;height:8px;background:#34d399;border-radius:50%;display:inline-block;box-shadow:0 0 10px #34d399;animation:live-pulse 1.5s infinite}}
@keyframes live-pulse{{0%{{transform:scale(.9);opacity:.7}}50%{{transform:scale(1.3);opacity:1;box-shadow:0 0 14px #34d399}}100%{{transform:scale(.9);opacity:.7}}}}
</style></head>
<body>
<aside>
 <div class="brand">OCCULO</div>
 <div class="brand-sub">Instrument Panel v4</div>
 <div class="s-nav">
  <div class="s-link on" onclick="tab('overview',this)">Overview</div>
  <div class="s-link" onclick="tab('stream',this)">Session Stream</div>
  <div class="s-link" onclick="tab('leads',this)">Leads</div>
  <div class="s-link" onclick="window.location.href='/deployments'">Deployments</div>
 </div>
 <div class="s-foot">
  <div class="email">{user.get("email","")}</div>
  <a href="/logout">Sign out</a>
 </div>
</aside>
<main>
 <div id="error-banner" style="display:none;background:#fef2f2;border:1px solid #fee2e2;color:#b91c1c;padding:12px 20px;border-radius:8px;margin-bottom:20px;font-size:.85rem;font-weight:600;align-items:center;gap:10px">⚠️ <span id="error-msg"></span></div>
 <div class="top"><h1 id="page-title">Overview</h1><div class="live"><div class="dot"></div>LIVE</div></div>
 <div class="kpis">
  <div class="kpi"><small>Total Sessions</small><div class="v" id="k0">—</div></div>
  <div class="kpi"><small>Avg. Duration</small><div class="v" id="k1">—</div></div>
  <div class="kpi"><small>Inquiries</small><div class="v" id="k2">—</div></div>
  <div class="kpi"><small>Conversion</small><div class="v" id="k3">—</div></div>
 </div>

 <div id="t-overview" class="tab on">
  <div class="row">
   <div class="c"><h3>Geographic Distribution</h3><div id="map"></div></div>
   <div class="c"><h3>Hourly Activity</h3><div class="ch"><canvas id="tc"></canvas></div></div>
  </div>
  <div class="row">
   <div class="c"><h3>Top Origins</h3><div id="geo"></div></div>
   <div class="c"><h3>Device Mix</h3><div class="ch"><canvas id="dc"></canvas></div></div>
  </div>
 </div>

  <div id="t-stream" class="tab">
   <div class="c">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;border-bottom:1px solid #f1f5f9;padding-bottom:12px">
     <h3 style="margin:0">Recent Sessions</h3>
     <div style="display:flex;gap:8px">
      <button id="btn-all-sessions" class="sub-tab-btn on" onclick="setSessionView('all')">All Sessions</button>
      <button id="btn-live-sessions" class="sub-tab-btn" onclick="setSessionView('live')">
        Live Sessions <span class="live-indicator-dot"></span>
      </button>
     </div>
    </div>
    <div id="st"></div>
   </div>
  </div>

 <div id="t-leads" class="tab">
  <div class="c"><h3>Captured Leads</h3><div id="lt"></div></div>
 </div>
</main>
<script>
window.onerror=function(msg,url,line){{
 const b=document.getElementById('error-banner');
 if(b){{b.style.display='flex';document.getElementById('error-msg').textContent=msg+' at line '+line}}
}};
let S=[],I=[],mp,tc,dc,heat;
const CN={{"US":"United States","GB":"United Kingdom","IN":"India","DE":"Germany","FR":"France","CA":"Canada","AU":"Australia","JP":"Japan","BR":"Brazil","SG":"Singapore","AE":"United Arab Emirates","NL":"Netherlands","HK":"Hong Kong","SE":"Sweden","KR":"South Korea","IT":"Italy","ES":"Spain","RU":"Russia","CN":"China","ZA":"South Africa","MX":"Mexico","ID":"Indonesia","MY":"Malaysia","TH":"Thailand","PK":"Pakistan","TR":"Turkey","PL":"Poland","SA":"Saudi Arabia","NZ":"New Zealand","FI":"Finland","NO":"Norway","CH":"Switzerland","IE":"Ireland","TW":"Taiwan","PH":"Philippines","AR":"Argentina","CL":"Chile","CO":"Colombia","EG":"Egypt","NG":"Nigeria","KE":"Kenya","VN":"Vietnam","BD":"Bangladesh","UA":"Ukraine","RO":"Romania","BE":"Belgium","AT":"Austria","PT":"Portugal","GR":"Greece","CZ":"Czechia","HU":"Hungary","DK":"Denmark","IL":"Israel"}};
const CC={{US:[37,-95],GB:[55,-2],IN:[20,78],DE:[51,9],FR:[46,2],CA:[56,-106],AU:[-25,133],JP:[36,138],BR:[-14,-51],SG:[1,103],AE:[24,54],NL:[52,5],HK:[22,114],SE:[62,15],KR:[36,128],IT:[42,12],ES:[40,-4],RU:[61,105],CN:[35,105],ZA:[-30,25],MX:[23,-102],ID:[-5,120],MY:[4,101],TH:[15,100],PK:[30,69],TR:[39,35],PL:[52,20],SA:[24,45],NZ:[-41,174],FI:[64,26],NO:[62,10],CH:[47,8],IE:[53,-8],TW:[24,121],PH:[12,121],AR:[-38,-63],CL:[-35,-71],CO:[4,-74],EG:[26,30],NG:[9,8],KE:[0,37],VN:[14,108],BD:[23,90],UA:[48,31],RO:[45,24],BE:[50,4],AT:[47,14],PT:[39,-8],GR:[39,22],CZ:[49,15],HU:[47,19],DK:[56,9],IL:[31,34]}};
function fl(c){{try{{return c.replace(/./g,x=>String.fromCodePoint(127397+x.charCodeAt()))}}catch{{return c}}}}
function fd(s){{return s<60?s+'s':Math.floor(s/60)+'m '+(s%60)+'s'}}

async function load(){{
 try{{
  const r=await fetch('/api/analytics-data');
  if(r.redirected){{window.location=r.url;return}}
  const d=await r.json();S=d.sessions||[];I=d.inquiries||[];
  const total=d.total_sessions||S.length;
  render(total);
 }}catch(e){{console.error("Analytics Load/Render Error:",e)}}
}}

function render(totalCount){{
 document.getElementById('k0').textContent=totalCount||'0';
 const avg=S.length?Math.round(S.reduce((a,s)=>a+(s.duration_sec||0),0)/S.length):0;
 document.getElementById('k1').textContent=fd(avg);
 document.getElementById('k2').textContent=I.length||'0';
 document.getElementById('k3').textContent=S.length?(I.length/S.length*100).toFixed(1)+'%':'0%';

 // Map
 if(heat) mp.removeLayer(heat);
 const cc={{}};S.forEach(s=>cc[s.country]=(cc[s.country]||0)+1);
 const heatPoints = [];
 Object.entries(cc).forEach(([c,n])=>{{
  const co=CC[c];if(!co)return;
  heatPoints.push([co[0], co[1], n]);
 }});
 const maxSessions = Math.max(...Object.values(cc), 1);
 heat = L.heatLayer(heatPoints, {{radius: 24, blur: 20, maxZoom: 4, max: Math.min(maxSessions, 15), gradient: {{0.2: '#0ea5e9', 0.5: '#3b82f6', 0.8: '#8b5cf6', 1: '#ec4899'}}}}).addTo(mp);

 // Time chart
 const h=Array(24).fill(0);S.forEach(s=>h[s.hour]++);
 tc.data.labels=h.map((_,i)=>String(i).padStart(2,'0')+':00');
 tc.data.datasets[0].data=h;tc.update();

 // Device chart
 const dv={{}};S.forEach(s=>dv[s.device||'Unknown']=(dv[s.device||'Unknown']||0)+1);
 dc.data.labels=Object.keys(dv);dc.data.datasets[0].data=Object.values(dv);dc.update();

 // Geo table
 const sorted=Object.entries(cc).sort((a,b)=>b[1]-a[1]).slice(0,8);
 const mx=sorted[0]?sorted[0][1]:1;
 let gt='<table><tr><th>Country</th><th>Sessions</th><th>Share</th></tr>';
 sorted.forEach(([c,n])=>{{
  const cName = CN[c] || c;
  gt+=`<tr><td>${{fl(c)}} ${{cName}}</td><td><div class="bar"><i style="width:${{n/mx*80}}px"></i>${{n}}</div></td><td>${{(n/S.length*100).toFixed(1)}}%</td></tr>`;
 }});
 document.getElementById('geo').innerHTML=sorted.length?gt+'</table>':'<div class="empty">No geographic data yet</div>';

 // Sessions table
 renderSessionsTable();

 // Leads table
 let lt='<table><tr><th>Name</th><th>Email</th><th>Type</th><th>Message</th></tr>';
 I.forEach(i=>{{lt+=`<tr><td>${{i.name||'—'}}</td><td>${{i.email||'—'}}</td><td><span class="tg">${{i.inquiry_type||'general'}}</span></td><td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${{i.message||''}}</td></tr>`}});
 document.getElementById('lt').innerHTML=I.length?lt+'</table>':'<div class="empty">No leads captured yet</div>';
}}

function tab(t,el){{
 document.querySelectorAll('.tab').forEach(p=>p.classList.remove('on'));
 document.getElementById('t-'+t).classList.add('on');
 document.querySelectorAll('.s-link').forEach(b=>b.classList.remove('on'));
 el.classList.add('on');
 const titles={{overview:'Overview',stream:'Session Stream',leads:'Leads & Inquiries'}};
 document.getElementById('page-title').textContent=titles[t]||'Overview';
}}

mp=L.map('map',{{zoomControl:false}}).setView([20,0],2);
L.tileLayer('https://{{s}}.basemaps.cartocdn.com/dark_all/{{z}}/{{x}}/{{y}}{{r}}.png', {{attribution: '&copy; CartoDB'}}).addTo(mp);

tc=new Chart(document.getElementById('tc'),{{
 type:'line',data:{{labels:[],datasets:[{{data:[],borderColor:'#3b82f6',backgroundColor:'rgba(59,130,246,0.15)',fill:true,tension:.4,borderWidth:3,pointRadius:3,pointBackgroundColor:'#0f172a',pointBorderColor:'#3b82f6',pointBorderWidth:2}}]}},
 options:{{responsive:true,maintainAspectRatio:false,plugins:{{legend:{{display:false}}}},scales:{{x:{{grid:{{display:false}},ticks:{{color:'#64748b',font:{{family:'Inter',size:10}}}}}},y:{{grid:{{color:'rgba(255,255,255,0.05)'}},ticks:{{color:'#64748b'}}}}}}}}
}});

dc=new Chart(document.getElementById('dc'),{{
 type:'doughnut',data:{{labels:[],datasets:[{{data:[],backgroundColor:['#3b82f6','#8b5cf6','#ec4899','#0ea5e9'],borderWidth:0,spacing:4,hoverOffset:4}}]}},
 options:{{responsive:true,maintainAspectRatio:false,cutout:'75%',plugins:{{legend:{{position:'bottom',labels:{{color:'#94a3b8',font:{{family:'Inter',weight:'600'}},padding:20}}}}}}}}
}});

let currentSessionView='all';
function setSessionView(v){{
 currentSessionView=v;
 document.getElementById('btn-all-sessions').classList.toggle('on',v==='all');
 document.getElementById('btn-live-sessions').classList.toggle('on',v==='live');
 renderSessionsTable();
}}

function renderSessionsTable(){{
 const now=new Date();
 const filtered=S.filter(s=>{{
  if(currentSessionView==='all')return true;
  const ts=(s.updated_at||s.timestamp||'').replace(' ','T');
  if(!ts)return false;
  return (now - new Date(ts)) < 60000;
 }});
 let st='<table><tr><th>Time</th><th>IP Address</th><th>Country</th><th>Region</th><th>Device</th><th>Last Event</th><th>Duration</th></tr>';
 filtered.slice(0,20).forEach(s=>{{
  const ts=(s.updated_at||s.timestamp||'').replace(' ','T');
  const timeStr=ts?ts.substring(11,19):'—';
  const isLive=ts && (now - new Date(ts)) < 60000;
  const dot=isLive?'<span class="live-indicator-dot" style="margin-right:6px"></span>':'';
  const cName = CN[s.country] || s.country;
  st+=`<tr><td>${{timeStr}}</td><td><code style="font-family:'JetBrains Mono',monospace;font-size:.78rem;background:#eff6ff;color:#2c6bde;padding:3px 6px;border-radius:4px;font-weight:700">${{s.ip||'—'}}</code></td><td><span class="tg">${{fl(s.country)}} ${{cName}}</span></td><td>${{s.region||'—'}}</td><td>${{s.device}}</td><td><div style="display:flex;align-items:center">${{dot}}<span class="tg">${{s.last_event||'pageview'}}</span></div></td><td>${{fd(s.duration_sec||0)}}</td></tr>`
 }});
 const emptyMsg=currentSessionView==='live'?'No active visitors online right now':'Awaiting first visitor on occulo.co';
 document.getElementById('st').innerHTML=filtered.length?st+'</table>':`<div class="empty">${{emptyMsg}}</div>`;
}}

load();setInterval(load,10000);
</script>
</body></html>'''
    return no_store(Response(html, mimetype='text/html'))

@app.route('/deployments')
@auth_required
def deployments_page():
    user = session.get('user', {})
    return render_template('deployments.html', user=user)

@app.route('/api/deployments')
@auth_required
def api_deployments():
    supabase_url = os.getenv("SUPABASE_URL", "https://xioqjopumlnpudxvtnic.supabase.co")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    if not supabase_key:
        print("Error: SUPABASE_SERVICE_ROLE_KEY is missing. Cannot fetch deployments.")
        return jsonify([])

    headers = {
        "apikey": supabase_key,
        "Authorization": f"Bearer {supabase_key}"
    }

    try:
        # Fetch deployments via REST API bypassing RLS
        dep_res = requests.get(f"{supabase_url}/rest/v1/deployments?select=*&order=deployed_at.desc", headers=headers, timeout=10)
        if not dep_res.ok:
            print("Failed to fetch deployments:", dep_res.text)
            return jsonify([])
        deployments = dep_res.json()

        # Fetch users from Auth Admin API to map technician profiles
        users_res = requests.get(f"{supabase_url}/auth/v1/admin/users", headers=headers, timeout=10)
        users_data = users_res.json() if users_res.ok else {}
        
        # Parse the users array (newer Supabase returns dict with "users" key)
        users_list = users_data.get("users", []) if isinstance(users_data, dict) else (users_data if isinstance(users_data, list) else [])

        # Build technician mapping dictionary
        tech_map = {}
        for u in users_list:
            meta = u.get("raw_user_meta_data") or {}
            tech_map[u["id"]] = {
                "email": u.get("email", "Unknown"),
                "name": meta.get("full_name", "Unknown Technician")
            }

        # Enrich deployments with technician details
        for d in deployments:
            tech_id = d.get("technician_id")
            info = tech_map.get(tech_id, {"email": "Unknown", "name": "Unknown Technician"})
            d["technician_email"] = info["email"]
            d["technician_name"] = info["name"]

        return jsonify(deployments)
    except Exception as e:
        print("Backend Supabase API error:", e)
        return jsonify([])

@app.route('/api/technician/<uuid>')
@auth_required
def api_technician(uuid):
    supabase_url = os.getenv("SUPABASE_URL", "https://xioqjopumlnpudxvtnic.supabase.co")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    if not supabase_key:
        return jsonify({"email": "Unknown", "name": "Unknown Technician"})
        
    headers = {
        "apikey": supabase_key,
        "Authorization": f"Bearer {supabase_key}"
    }
    
    try:
        r = requests.get(f"{supabase_url}/auth/v1/admin/users/{uuid}", headers=headers, timeout=5)
        if r.ok:
            u = r.json()
            meta = u.get("raw_user_meta_data") or {}
            return jsonify({
                "email": u.get("email", "Unknown"),
                "name": meta.get("full_name", "Unknown Technician")
            })
    except Exception as e:
        print("Error fetching technician metadata:", e)
        
    return jsonify({"email": "Unknown", "name": "Unknown Technician"})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.getenv("PORT", 5000)))
