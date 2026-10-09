#!/usr/bin/env python3
"""Namecheap domain list proxy — Python 3.6+ (WPTangToc / CentOS)."""
from __future__ import print_function

import json
import os
import re
import sys
import traceback
import urllib

try:
    import urllib.error
    import urllib.parse
    import urllib.request
    from http.server import BaseHTTPRequestHandler, HTTPServer
    from socketserver import ThreadingMixIn
except ImportError:
    sys.stderr.write("Need Python 3\n")
    sys.exit(1)

NC_URL = "https://api.namecheap.com/xml.response"
API_USER = os.environ.get("NAMECHEAP_API_USER", "").strip()
API_KEY = os.environ.get("NAMECHEAP_API_KEY", "").strip()
USERNAME = os.environ.get("NAMECHEAP_USERNAME", API_USER).strip()
CLIENT_IP = os.environ.get("NAMECHEAP_CLIENT_IP", "").strip()
TOKEN = os.environ.get("NAMECHEAP_PROXY_TOKEN", "").strip()
PORT = int(os.environ.get("PORT", "8080"))


class ThreadingHTTPServer(ThreadingMixIn, HTTPServer):
    daemon_threads = True
    allow_reuse_address = True


def attr(chunk, key):
    m = re.search(key + r'="([^"]*)"', chunk)
    return m.group(1) if m else ""


def parse_domains(xml):
    out = []
    for m in re.finditer(r"<Domain\b([^>]*)/?>", xml):
        a = m.group(1)
        name = attr(a, "Name").lower()
        if not name:
            continue
        out.append(
            {
                "name": name,
                "expires": attr(a, "Expires"),
                "isExpired": attr(a, "IsExpired").lower() == "true",
                "autoRenew": attr(a, "AutoRenew").lower() == "true",
            }
        )
    return out


def api_error(xml):
    ip = re.search(r"Invalid request IP:\s*([0-9.]+)", xml, re.I)
    if ip:
        return "Invalid request IP: " + ip.group(1)
    if re.search(r'Status="OK"', xml, re.I):
        return None
    m = re.search(r"<Error[^>]*>([\s\S]*?)</Error>", xml, re.I)
    if m:
        return re.sub(r"<[^>]+>", "", m.group(1)).strip()
    return None


def total_items(xml):
    m = re.search(r"<TotalItems>(\d+)</TotalItems>", xml, re.I)
    return int(m.group(1)) if m else 0


def fetch_page(page):
    qs = urllib.parse.urlencode(
        {
            "ApiUser": API_USER,
            "ApiKey": API_KEY,
            "UserName": USERNAME,
            "ClientIp": CLIENT_IP,
            "Command": "namecheap.domains.getList",
            "Page": str(page),
            "PageSize": "100",
            "SortBy": "EXPIREDATE",
        }
    )
    req = urllib.request.Request(NC_URL + "?" + qs, headers={"Accept": "application/xml"})
    try:
        res = urllib.request.urlopen(req, timeout=45)
        data = res.read().decode("utf-8", "replace")
        res.close()
        return data
    except urllib.error.HTTPError as exc:
        return exc.read().decode("utf-8", "replace")


def list_domains():
    collected = []
    page = 1
    while True:
        xml = fetch_page(page)
        err = api_error(xml)
        if err:
            raise RuntimeError(err)
        collected.extend(parse_domains(xml))
        total = total_items(xml) or len(collected)
        if len(collected) >= total or page >= 50:
            break
        page += 1
    return collected


def authorized(handler):
    if not TOKEN:
        return False
    if handler.headers.get("Authorization", "") == "Bearer " + TOKEN:
        return True
    q = urllib.parse.urlparse(handler.path).query
    qs = urllib.parse.parse_qs(q)
    return (qs.get("token") or [""])[0] == TOKEN


class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):
        sys.stderr.write("[%s] %s\n" % (self.log_date_time_string(), fmt % args))

    def _send(self, code, payload):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        path = urllib.parse.urlparse(self.path).path
        if path in ("/health", "/"):
            self._send(200, {"ok": True, "ip": CLIENT_IP})
            return
        if path != "/domains":
            self._send(404, {"error": "not found"})
            return
        if not authorized(self):
            self._send(401, {"error": "unauthorized"})
            return
        try:
            domains = list_domains()
            mapping = {}
            for d in domains:
                mapping[d["name"]] = d
            self._send(200, {"domains": domains, "map": mapping, "cached": False})
        except Exception as exc:
            traceback.print_exc()
            self._send(502, {"error": str(exc)})


def main():
    missing = []
    if not API_USER:
        missing.append("NAMECHEAP_API_USER")
    if not API_KEY:
        missing.append("NAMECHEAP_API_KEY")
    if not CLIENT_IP:
        missing.append("NAMECHEAP_CLIENT_IP")
    if not TOKEN:
        missing.append("NAMECHEAP_PROXY_TOKEN")
    if missing:
        sys.stderr.write("Missing env: %s\n" % ", ".join(missing))
        sys.exit(1)
    httpd = ThreadingHTTPServer(("0.0.0.0", PORT), Handler)
    sys.stderr.write("namecheap-proxy listening 0.0.0.0:%s python=%s\n" % (PORT, sys.version.split()[0]))
    sys.stderr.flush()
    httpd.serve_forever()


if __name__ == "__main__":
    main()
