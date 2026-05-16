import os, json, sqlite3, requests, uuid, time
from datetime import datetime, timezone
from flask import Flask, request, Response, jsonify, session, redirect, url_for, render_template
from flask_cors import CORS
from authlib.integrations.flask_client import OAuth
from dotenv import load_dotenv

load_dotenv()

# Allow OAuth over HTTP for local development
os.environ['AUTHLIB_INSECURE_TRANSPORT'] = '1'

app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY", "occulo_fallback_secret_dev_only")
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
CORS(app)

ADMIN_EMAIL = "levakupreetham@gmail.com"

oauth = OAuth(app)
google = oauth.register(
    name='google',
    client_id=os.getenv("GOOGLE_CLIENT_ID"),
    client_secret=os.getenv("GOOGLE_CLIENT_SECRET"),
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    client_kwargs={'scope': 'openid email profile'}
)

DATABASE_PATH = os.getenv("DATABASE_PATH", "data/tracker.db")
db_dir = os.path.dirname(DATABASE_PATH)
if db_dir: os.makedirs(db_dir, exist_ok=True)

PIXEL_GIF = b'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
START_TIME = time.time()

def get_db():
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def ensure_col(conn, tbl, col, defn):
    cols = {r[1] for r in conn.execute(f'PRAGMA table_info({tbl})').fetchall()}
    if col not in cols: conn.execute(f'ALTER TABLE {tbl} ADD COLUMN {col} {defn}')

def init_db():
    with get_db() as c:
        c.execute('''CREATE TABLE IF NOT EXISTS sessions (
            id TEXT PRIMARY KEY, country TEXT, region TEXT, device TEXT,
            duration_sec INTEGER DEFAULT 0, date TEXT, hour INTEGER, timestamp DATETIME,
            path TEXT, last_event TEXT, updated_at DATETIME)''')
        c.execute('''CREATE TABLE IF NOT EXISTS inquiries (
            id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, email TEXT, message TEXT,
            company TEXT, phone TEXT, inquiry_type TEXT,
            country TEXT, device TEXT, timestamp DATETIME)''')
        for col in ['path','last_event','updated_at']: ensure_col(c,'sessions',col,'TEXT')
        for col in ['company','phone','inquiry_type']: ensure_col(c,'inquiries',col,'TEXT')
        c.commit()
init_db()

def no_store(resp):
    resp.headers['Cache-Control'] = 'no-store'
    return resp

def get_payload():
    d = {}
    if request.is_json: d.update(request.get_json(silent=True) or {})
    d.update(request.form.to_dict())
    d.update(request.args.to_dict())
    return d

def get_geo():
    cc = request.headers.get('CF-IPCountry')
    rg = request.headers.get('CF-IPRegion', 'Unknown')
    if cc and cc != 'XX': return cc, rg
    ip = request.headers.get('CF-Connecting-IP') or request.headers.get('X-Forwarded-For','').split(',')[0].strip() or request.remote_addr
    try:
        r = requests.get(f"http://ip-api.com/json/{ip}?fields=status,countryCode,regionName", timeout=2)
        if r.ok:
            j = r.json()
            if j.get('status')=='success': return j.get('countryCode'), j.get('regionName')
    except: pass
    return "US", "Unknown"

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
    token = google.authorize_access_token()
    resp = google.get('https://openidconnect.googleapis.com/v1/userinfo')
    user = resp.json()
    if user.get('email') != ADMIN_EMAIL:
        return render_template('403.html'), 403
    session['user'] = {'email': user['email'], 'name': user.get('name','Admin')}
    return redirect('/analytics')

@app.route('/logout')
def logout():
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
    d = get_payload()
    sid = (d.get('sid') or '').strip() or str(uuid.uuid4())
    dur = d.get('duration')
    country, region = get_geo()
    device = get_device()
    now = datetime.now(timezone.utc)
    iso = now.isoformat()

    with get_db() as c:
        c.execute('INSERT OR IGNORE INTO sessions (id,country,region,device,duration_sec,date,hour,timestamp) VALUES (?,?,?,?,0,?,?,?)',
            (sid, country, region, device, now.strftime('%Y-%m-%d'), now.hour, iso))
        if dur:
            try: c.execute('UPDATE sessions SET duration_sec=MAX(COALESCE(duration_sec,0),?) WHERE id=?', (int(float(dur)), sid))
            except: pass
        c.commit()

    resp = Response(PIXEL_GIF, mimetype='image/gif')
    resp.headers['X-Session-ID'] = sid
    return no_store(resp)

@app.route('/api/inquiry', methods=['POST'])
@app.route('/_o/inquiry', methods=['POST'])
def inquiry():
    d = get_payload()
    country, _ = get_geo()
    with get_db() as c:
        c.execute('INSERT INTO inquiries (name,email,message,company,phone,inquiry_type,country,device,timestamp) VALUES (?,?,?,?,?,?,?,?,?)',
            (d.get('name'), d.get('email'), d.get('message'), d.get('company'), d.get('phone'), d.get('inquiry_type'), country, get_device(), datetime.now(timezone.utc).isoformat()))
        c.commit()
    return jsonify({"ok": True})

# --- PROTECTED ENDPOINTS ---
@app.route('/api/analytics-data')
@auth_required
def api_data():
    with get_db() as c:
        s = [dict(r) for r in c.execute('SELECT * FROM sessions ORDER BY timestamp DESC LIMIT 2000').fetchall()]
        i = [dict(r) for r in c.execute('SELECT * FROM inquiries ORDER BY timestamp DESC').fetchall()]
    return no_store(jsonify({"sessions": s, "inquiries": i}))

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
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<style>
:root{{--p:#2c6bde;--bg:#f5f6f8;--card:#fff;--txt:#0f172a;--dim:#64748b;--bdr:#e2e8f0;--r:14px}}
*{{box-sizing:border-box;margin:0;padding:0}}
body{{background:var(--bg);color:var(--txt);font-family:'Inter',sans-serif;display:flex;min-height:100vh}}
aside{{width:260px;background:var(--card);border-right:1px solid var(--bdr);padding:28px 20px;display:flex;flex-direction:column;position:fixed;top:0;bottom:0}}
.brand{{font-weight:800;font-size:1.1rem;color:var(--p);letter-spacing:-.02em;margin-bottom:10px}}
.brand-sub{{font-size:.65rem;color:var(--dim);text-transform:uppercase;letter-spacing:.1em;margin-bottom:32px}}
.s-nav{{flex:1}}
.s-link{{display:block;padding:11px 14px;border-radius:8px;color:var(--dim);font-weight:600;font-size:.88rem;cursor:pointer;transition:.15s;margin-bottom:2px}}
.s-link:hover,.s-link.on{{background:#eff6ff;color:var(--p)}}
.s-foot{{border-top:1px solid var(--bdr);padding-top:16px;margin-top:auto}}
.s-foot .email{{font-size:.72rem;color:var(--dim);word-break:break-all;margin-bottom:6px}}
.s-foot a{{color:#ef4444;font-size:.75rem;font-weight:700;text-decoration:none}}
main{{margin-left:260px;flex:1;padding:36px 40px;overflow-y:auto}}
.top{{display:flex;justify-content:space-between;align-items:center;margin-bottom:28px}}
h1{{font-size:1.4rem;font-weight:800;letter-spacing:-.02em}}
.live{{display:flex;align-items:center;gap:8px;background:#f0fdf4;color:#16a34a;padding:5px 14px;border-radius:99px;font-size:.72rem;font-weight:700}}
.dot{{width:7px;height:7px;background:#16a34a;border-radius:50%;animation:p 2s infinite}}
@keyframes p{{50%{{opacity:.3}}}}
.kpis{{display:grid;grid-template-columns:repeat(4,1fr);gap:20px;margin-bottom:28px}}
.kpi{{background:var(--p);color:#fff;padding:22px 24px;border-radius:var(--r);transition:.2s}}
.kpi:hover{{transform:translateY(-2px);box-shadow:0 8px 24px rgba(44,107,222,.2)}}
.kpi small{{display:block;font-size:.68rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em;opacity:.8;margin-bottom:6px}}
.kpi .v{{font-size:1.7rem;font-weight:800}}
.row{{display:grid;grid-template-columns:1.7fr 1fr;gap:20px;margin-bottom:20px}}
.c{{background:var(--card);border:1px solid var(--bdr);border-radius:var(--r);padding:22px}}
.c h3{{font-size:.82rem;font-weight:700;color:var(--dim);text-transform:uppercase;letter-spacing:.04em;margin-bottom:16px}}
#map{{height:400px;border-radius:10px;border:1px solid var(--bdr)}}
.ch{{height:300px}}
table{{width:100%;border-collapse:collapse}}
th{{text-align:left;padding:10px;border-bottom:2px solid var(--bdr);color:var(--dim);font-size:.72rem;text-transform:uppercase;font-weight:700;letter-spacing:.03em}}
td{{padding:14px 10px;border-bottom:1px solid #f1f5f9;font-size:.84rem;font-weight:500}}
tr:hover td{{background:#fafbff}}
.tg{{background:#eff6ff;color:var(--p);padding:3px 9px;border-radius:5px;font-weight:700;font-size:.7rem}}
.bar{{display:flex;align-items:center;gap:8px}}.bar i{{height:5px;background:var(--p);border-radius:3px;display:block}}
.empty{{text-align:center;padding:60px;color:var(--dim);font-size:.9rem}}
.tab{{display:none}}.tab.on{{display:block}}
</style></head>
<body>
<aside>
 <div class="brand">OCCULO</div>
 <div class="brand-sub">Instrument Panel v4</div>
 <div class="s-nav">
  <div class="s-link on" onclick="tab('overview',this)">Overview</div>
  <div class="s-link" onclick="tab('stream',this)">Session Stream</div>
  <div class="s-link" onclick="tab('leads',this)">Leads</div>
 </div>
 <div class="s-foot">
  <div class="email">{user.get("email","")}</div>
  <a href="/logout">Sign out</a>
 </div>
</aside>
<main>
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
  <div class="c"><h3>Recent Sessions</h3><div id="st"></div></div>
 </div>

 <div id="t-leads" class="tab">
  <div class="c"><h3>Captured Leads</h3><div id="lt"></div></div>
 </div>
</main>
<script>
let S=[],I=[],mp,tc,dc,mk=[];
const CC={{US:[37,-95],GB:[55,-2],IN:[20,78],DE:[51,9],FR:[46,2],CA:[56,-106],AU:[-25,133],JP:[36,138],BR:[-14,-51],SG:[1,103],AE:[24,54],NL:[52,5],HK:[22,114],SE:[62,15],KR:[36,128],IT:[42,12],ES:[40,-4],RU:[61,105],CN:[35,105],ZA:[-30,25],MX:[23,-102],ID:[-5,120],MY:[4,101],TH:[15,100],PK:[30,69],TR:[39,35],PL:[52,20],SA:[24,45],NZ:[-41,174],FI:[64,26],NO:[62,10],CH:[47,8],IE:[53,-8],TW:[24,121],PH:[12,121]}};
function fl(c){{try{{return c.replace(/./g,x=>String.fromCodePoint(127397+x.charCodeAt()))}}catch{{return c}}}}
function fd(s){{return s<60?s+'s':Math.floor(s/60)+'m '+(s%60)+'s'}}

async function load(){{
 try{{
  const r=await fetch('/api/analytics-data');
  if(r.redirected){{window.location=r.url;return}}
  const d=await r.json();S=d.sessions||[];I=d.inquiries||[];render();
 }}catch(e){{}}
}}

function render(){{
 document.getElementById('k0').textContent=S.length||'0';
 const avg=S.length?Math.round(S.reduce((a,s)=>a+(s.duration_sec||0),0)/S.length):0;
 document.getElementById('k1').textContent=fd(avg);
 document.getElementById('k2').textContent=I.length||'0';
 document.getElementById('k3').textContent=S.length?(I.length/S.length*100).toFixed(1)+'%':'0%';

 // Map
 mk.forEach(m=>mp.removeLayer(m));mk=[];
 const cc={{}};S.forEach(s=>cc[s.country]=(cc[s.country]||0)+1);
 Object.entries(cc).forEach(([c,n])=>{{
  const co=CC[c];if(!co)return;
  const m=L.circleMarker(co,{{radius:7+Math.sqrt(n)*4,color:'#2c6bde',fillColor:'#2c6bde',fillOpacity:.5,weight:2}}).addTo(mp);
  m.bindTooltip(`${{fl(c)}} ${{c}}: ${{n}} sessions`);mk.push(m);
 }});

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
 sorted.forEach(([c,n])=>{{gt+=`<tr><td>${{fl(c)}} ${{c}}</td><td><div class="bar"><i style="width:${{n/mx*80}}px"></i>${{n}}</div></td><td>${{(n/S.length*100).toFixed(1)}}%</td></tr>`}});
 document.getElementById('geo').innerHTML=sorted.length?gt+'</table>':'<div class="empty">No geographic data yet</div>';

 // Sessions table
 let st='<table><tr><th>Time</th><th>Country</th><th>Region</th><th>Device</th><th>Duration</th></tr>';
 S.slice(0,20).forEach(s=>{{st+=`<tr><td>${{(s.timestamp||'').substring(11,19)}}</td><td><span class="tg">${{fl(s.country)}} ${{s.country}}</span></td><td>${{s.region||'—'}}</td><td>${{s.device}}</td><td>${{fd(s.duration_sec||0)}}</td></tr>`}});
 document.getElementById('st').innerHTML=S.length?st+'</table>':'<div class="empty">Awaiting first visitor on occulo.co</div>';

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
L.tileLayer('https://{{s}}.basemaps.cartocdn.com/rastertiles/voyager/{{z}}/{{x}}/{{y}}{{r}}.png').addTo(mp);

tc=new Chart(document.getElementById('tc'),{{
 type:'line',data:{{labels:[],datasets:[{{data:[],borderColor:'#2c6bde',backgroundColor:'rgba(44,107,222,.08)',fill:true,tension:.4,borderWidth:2,pointRadius:2,pointBackgroundColor:'#fff',pointBorderColor:'#2c6bde'}}]}},
 options:{{responsive:true,maintainAspectRatio:false,plugins:{{legend:{{display:false}}}},scales:{{x:{{grid:{{display:false}},ticks:{{color:'#94a3b8',font:{{family:'Inter',size:10}}}}}},y:{{grid:{{color:'#f1f5f9'}},ticks:{{color:'#94a3b8'}}}}}}}}
}});

dc=new Chart(document.getElementById('dc'),{{
 type:'doughnut',data:{{labels:[],datasets:[{{data:[],backgroundColor:['#2c6bde','#60a5fa','#93c5fd','#bfdbfe'],borderWidth:0,spacing:3}}]}},
 options:{{responsive:true,maintainAspectRatio:false,cutout:'72%',plugins:{{legend:{{position:'bottom',labels:{{color:'#64748b',font:{{family:'Inter',weight:'600'}},padding:14}}}}}}}}
}});

load();setInterval(load,10000);
</script>
</body></html>'''
    return no_store(Response(html, mimetype='text/html'))

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.getenv("PORT", 5000)))
