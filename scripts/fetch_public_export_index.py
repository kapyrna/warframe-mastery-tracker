import json, lzma, pathlib, sys, urllib.request, urllib.error
from datetime import datetime, timezone

INDEX_URL = "https://content.warframe.com/PublicExport/index_en.txt.lzma"
OUT = pathlib.Path("data")

req = urllib.request.Request(INDEX_URL, headers={
	"User-Agent": "warframe-mastery-tracker (+https://github.com/kapyrna/warframe-mastery-tracker)",
    "Accept": "*/*",
})

try:
    with urllib.request.urlopen(req, timeout=60) as r:
        raw = lzma.decompress(r.read())
except urllib.error.HTTPError as e:
    print("HTTP", e.code, e.reason)
    print(dict(e.headers))
    print(e.read()[:500])
    sys.exit(1)

OUT.mkdir(exist_ok=True)
index_path = OUT / "index_en.txt"
status_path = OUT / "status.json"
now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

old = index_path.read_bytes() if index_path.exists() else None
status = json.loads(status_path.read_text()) if status_path.exists() else {}
files = status.get("files", {})

changed = raw != old
if changed:
    index_path.write_bytes(raw)

entry = files.get("index_en.txt", {"last_changed": now})
entry["last_checked"] = now
if changed:
    entry["last_changed"] = now
files["index_en.txt"] = entry

status_path.write_text(json.dumps({"files": files}, indent=2) + "\n")
print("index_en.txt", "updated" if changed else "unchanged")
