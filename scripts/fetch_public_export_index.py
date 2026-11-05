import lzma, pathlib, urllib.request, sys
from datetime import datetime, timezone

INDEX_URL = "https://content.warframe.com/PublicExport/index_en.txt.lzma"
OUT = pathlib.Path("data")

req = urllib.request.Request(INDEX_URL, headers={
	"User-Agent": "warframe-mastery-tracker (+https://github.com/kapyrna/warframe-mastery-tracker)",
    "Accept": "*/*",
})

try:
    with urllib.request.urlopen(req, timeout=60) as r:
        raw = lzma.decompress(r.read()).decode("utf-8")
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

if raw != old:
    index_path.write_bytes(raw)
    status["last_changed"] = now
    print("index changed")
else:
    print("index unchanged")

status["last_checked"] = now
status.setdefault("last_changed", now)
status_path.write_text(json.dumps(status, indent=2) + "\n")
