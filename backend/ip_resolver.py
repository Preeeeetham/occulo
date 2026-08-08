#ip_resolver.py
import ipaddress
import requests
import time
from typing import List, Tuple, Optional
from flask import Request

CF_IPS_URL = "https://api.cloudflare.com/client/v4/ips"
_cf_cache = {"ips": [], "expires": 0}

def get_cf_ips() -> List[str]:
    """Fetch and cache Cloudflare IP ranges (24h TTL)."""
    global _cf_cache
    if time.time() < _cf_cache["expires"] and _cf_cache["ips"]:
        return _cf_cache["ips"]
    
    try:
        r = requests.get(CF_IPS_URL, timeout=5)
        if r.ok:
            data = r.json().get("result", {})
            ips = data.get("ipv4_cidrs", []) + data.get("ipv6_cidrs", [])
            _cf_cache = {"ips": ips, "expires": time.time() + 86400}
            return ips
    except Exception as e:
        print(f"CRITICAL: Error fetching Cloudflare IPs: {e}")
    
    return _cf_cache["ips"]

def is_cloudflare_ip(ip: str) -> bool:
    """Check if an IP belongs to Cloudflare edge network."""
    if not ip: return False
    try:
        ip_obj = ipaddress.ip_address(ip)
        for cidr in get_cf_ips():
            if ip_obj in ipaddress.ip_network(cidr):
                return True
    except ValueError:
        pass
    return False

def get_real_ip(request: Request) -> Tuple[str, str, bool]:
    """
    Production-grade IP resolution.
    Returns: (resolved_ip, source_header, is_trusted)
    """
    # 1. Direct Cloudflare connecting IP header (authoritative on CF proxy)
    cf_connecting = request.headers.get("CF-Connecting-IP")
    if cf_connecting and cf_connecting.strip():
        return cf_connecting.strip(), "CF-Connecting-IP", True
    
    # 2. X-Forwarded-For leftmost non-private, non-Cloudflare IP
    x_forwarded = request.headers.get("X-Forwarded-For")
    if x_forwarded:
        ips = [i.strip() for i in x_forwarded.split(",") if i.strip()]
        for ip in ips:
            try:
                ip_obj = ipaddress.ip_address(ip)
                if not ip_obj.is_private and not is_cloudflare_ip(ip):
                    return ip, "X-Forwarded-For", True
            except ValueError:
                continue
    
    # 3. Fallback to first non-private IP in X-Forwarded-For if available
    if x_forwarded:
        ips = [i.strip() for i in x_forwarded.split(",") if i.strip()]
        for ip in ips:
            try:
                ip_obj = ipaddress.ip_address(ip)
                if not ip_obj.is_private:
                    return ip, "X-Forwarded-For", False
            except ValueError:
                continue

    # 4. remote_addr as last resort
    return request.remote_addr or "0.0.0.0", "remote_addr", False
