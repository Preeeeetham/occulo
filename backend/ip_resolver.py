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
    cf_connecting = request.headers.get("CF-Connecting-IP")
    x_forwarded = request.headers.get("X-Forwarded-For")
    
    # In a Cloudflare -> Railway -> Flask setup:
    # request.access_route will look like [UserIP, CloudflareIP] 
    # if ProxyFix is correctly configured.
    # The immediate sender to Railway is the last element in access_route.
    proxies = request.access_route
    sender_ip = proxies[-1] if proxies else request.remote_addr
    
    is_trusted = is_cloudflare_ip(sender_ip)

    # 1. CF-Connecting-IP (only if sender is verified CF node)
    if cf_connecting and is_trusted:
        return cf_connecting, "CF-Connecting-IP", True
    
    # 2. X-Forwarded-For leftmost non-private IP
    if x_forwarded:
        ips = [i.strip() for i in x_forwarded.split(",")]
        for ip in ips:
            try:
                ip_obj = ipaddress.ip_address(ip)
                if not ip_obj.is_private:
                    return ip, "X-Forwarded-For", is_trusted
            except ValueError:
                continue
    
    # 3. remote_addr as last resort
    return request.remote_addr or "0.0.0.0", "remote_addr", is_trusted
