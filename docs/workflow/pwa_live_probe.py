#!/usr/bin/env python3
"""Read-only PWA HTTP and asset checks. No service-worker or site-data mutation."""
import json
import sys
from urllib.request import Request, urlopen
from urllib.parse import urljoin, urlparse
from struct import unpack

BASE = "https://mckaren8089-stack.github.io/karen-rooznama/"
def get(path):
    url = urljoin(BASE, path)
    assert url.startswith(BASE), "URL escaped app base"
    with urlopen(Request(url, headers={"User-Agent":"Karen-Rooznama-PWA-Diagnostics/1.0"}), timeout=20) as r:
        data = r.read()
        print(f"HTTP {r.status} {r.headers.get('Content-Type')} {url} bytes={len(data)}")
        assert r.status == 200 and data
        return data, r.headers.get("Content-Type","").split(";")[0].strip().lower()
def main():
    html, mime = get("")
    assert mime == "text/html", mime
    assert b"manifest.webmanifest" in html
    raw, mime = get("manifest.webmanifest")
    assert mime in ("application/manifest+json", "application/json"), mime
    manifest=json.loads(raw)
    for key in ("id","start_url","scope"):
        assert urljoin(BASE,manifest[key]) == BASE, (key,manifest[key])
    assert manifest["display"] == "standalone"
    icons=manifest["icons"]
    assert any(i["sizes"] == "192x192" and "any" in i.get("purpose","any").split() for i in icons)
    assert any(i["sizes"] == "512x512" and "any" in i.get("purpose","any").split() for i in icons)
    assert any(i["sizes"] == "512x512" and "maskable" in i.get("purpose","").split() for i in icons)
    for icon in icons:
        path=icon["src"]
        assert urljoin(BASE,path).startswith(BASE)
        data,mime=get(path)
        assert mime == "image/png", (path,mime)
        assert data[:8] == b"\x89PNG\r\n\x1a\n", path
        width,height=unpack(">II",data[16:24])
        dim=int(icon["sizes"].split("x")[0])
        assert (width,height)==(dim,dim), (path,width,height)
    sw,mime=get("sw.js")
    assert "javascript" in mime or mime in ("text/plain","application/octet-stream"), mime
    assert b'addEventListener("install"' in sw
    app,_=get("app.js")
    assert b'navigator.serviceWorker.register("./sw.js")' in app
    # Verify that the published sibling PWA no longer deletes every origin cache.
    fuse_url = "https://mckaren8089-stack.github.io/karen-fuse/sw.js"
    with urlopen(Request(fuse_url, headers={"User-Agent":"Karen-Rooznama-PWA-Diagnostics/1.0"}), timeout=20) as response:
        fuse_sw = response.read().decode("utf-8")
        print(f"FUSE LIVE HTTP {response.status} {fuse_url} bytes={len(fuse_sw)}")
        assert response.status == 200
        assert "key.startsWith('karen-fuse-')" in fuse_sw, "Fuse live SW still lacks scoped cache cleanup"
        assert "keys.filter(key=>key!==CACHE)" not in fuse_sw, "Fuse live SW still has origin-wide cache deletion"
    print("PASS: published Fuse worker cache cleanup is app-scoped")
    print("PASS: live HTTP, manifest resolution, icons, SW and entrypoint checks")
if __name__=="__main__":
    try: main()
    except Exception as e:
        print(f"FAIL: {type(e).__name__}: {e}",file=sys.stderr)
        sys.exit(1)
