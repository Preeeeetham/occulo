# geo_service.py
import os
import json
import redis
import geoip2.database
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List

REDIS_URL = os.getenv("REDIS_URL")

# Resolve DB paths absolute to avoid CWD/running-directory mismatch
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CITY_DB_PATH = os.path.join(BASE_DIR, "geoip", "GeoLite2-City.mmdb")
ASN_DB_PATH = os.path.join(BASE_DIR, "geoip", "GeoLite2-ASN.mmdb")

# Global Redis client instance
cache = None
if REDIS_URL:
    try:
        # We use decode_responses=True to get strings instead of bytes
        cache = redis.from_url(REDIS_URL, decode_responses=True, socket_timeout=2)
    except Exception as e:
        print(f"CRITICAL: Redis connection failed: {e}")

def get_geo_info(ip: str, ip_source: str, trusted: bool) -> Dict[str, Any]:
    """
    Lookup GeoIP info with Redis caching.
    Fallback to local MaxMind .mmdb files on cache miss or Redis failure.
    
    Returns a structured dictionary matching the session log schema.
    """
    # 1. Try to fetch from Redis (separating location and ASN for different TTLs)
    loc_data = None
    asn_data = None
    
    if cache:
        try:
            loc_json = cache.get(f"loc:{ip}")
            asn_json = cache.get(f"asn:{ip}")
            if loc_json: loc_data = json.loads(loc_json)
            if asn_json: asn_data = json.loads(asn_json)
        except Exception as e:
            print(f"WARN: Redis read failure: {e}")

    # 2. Location Resolution (Country/City) - 24h Cache
    if not loc_data:
        loc_data = {"country": "Unknown", "city": "Unknown"}
        try:
            if os.path.exists(CITY_DB_PATH):
                with geoip2.database.Reader(CITY_DB_PATH) as reader:
                    response = reader.city(ip)
                    loc_data["country"] = response.country.iso_code or "Unknown"
                    loc_data["city"] = response.city.name or "Unknown"
                
                # Cache successful lookup for 24h
                if cache:
                    try: cache.setex(f"loc:{ip}", 86400, json.dumps(loc_data))
                    except: pass
        except Exception as e:
            print(f"GeoIP City Lookup Error for {ip}: {e}")

    # 3. ASN Resolution (ISP/Organization) - 7d Cache
    if not asn_data:
        asn_data = {"asn": None, "is_vpn": False}
        try:
            if os.path.exists(ASN_DB_PATH):
                with geoip2.database.Reader(ASN_DB_PATH) as reader:
                    response = reader.asn(ip)
                    asn_num = response.autonomous_system_number
                    asn_org = (response.autonomous_system_organization or "").lower()
                    asn_data = {
                        "asn": asn_num,
                        "is_vpn": is_datacenter_asn(asn_num, asn_org)
                    }
                
                # Cache successful lookup for 7 days
                if cache:
                    try: cache.setex(f"asn:{ip}", 604800, json.dumps(asn_data))
                    except: pass
        except Exception as e:
            print(f"GeoIP ASN Lookup Error for {ip}: {e}")

    # 4. Construct Final Structured Output
    return {
        "ip": ip,
        "ip_source": ip_source,
        "country": loc_data["country"],
        "city": loc_data["city"],
        "asn": asn_data["asn"],
        "is_vpn": asn_data["is_vpn"],  # flag for anomaly.py consumption
        "proxy_chain": ["cloudflare", "railway"],
        "trusted": trusted,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

def is_datacenter_asn(asn: Optional[int], org: str) -> bool:
    """
    Helper to detect if an ASN belongs to a known hosting/cloud/VPN provider.
    This informs the 'is_vpn' flag in the logging schema.
    """
    if not asn: return False
    
    # Common datacenter and infrastructure provider keywords
    dc_keywords = [
        "amazon", "aws", "google", "microsoft", "azure", "digitalocean", 
        "linode", "vultr", "ovh", "hetzner", "m247", "packethost", 
        "fastly", "cloudflare", "akamai", "leaseweb", "choopa", "hosting", 
        "datacenter", "vpn", "proxy", "server"
    ]
    
    return any(kw in org for kw in dc_keywords)
