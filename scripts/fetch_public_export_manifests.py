import json, pathlib, sys, urllib.request
from datetime import datetime, timezone

MANIFEST_URL = "http://content.warframe.com/PublicExport/Manifest/"
USER_AGENT = "warframe-mastery-tracker (+https://github.com/kapyrna/warframe-mastery-tracker)"
DATA = pathlib.Path("data")
INDEX = DATA / "index_en.txt"
STATUS = DATA / "status.json"

def get(url):
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept": "*/*"})
    with urllib.request.urlopen(req, timeout=120) as r:
        return r.read()

now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
status = json.loads(STATUS.read_text()) if STATUS.exists() else {}
files = status.get("files", {})

# parse "name!hash" lines from the saved index
entries = {}
for line in INDEX.read_text(encoding="utf-8").splitlines():
    line = line.strip()
    if "!" in line:
        name, h = line.split("!", 1)
        entries[name] = h

failed = []
for name, h in entries.items():
    path = DATA / name
    entry = files.get(name)

    if entry and entry.get("hash") == h and path.exists():
        entry["last_checked"] = now
        print(name, "unchanged")
        continue

    try:
        text = get(MANIFEST_URL + name + "!" + h).decode("utf-8")
        data = json.loads(text, strict=False)  # tolerate raw control characters
    except Exception as e:
        print("FAILED", name, e)
        failed.append(name)
        continue

    path.write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    files[name] = {"hash": h, "last_checked": now, "last_changed": now}
    print(name, "updated")

STATUS.write_text(json.dumps({"files": files}, indent=2) + "\n")

if failed:
    print("failed:", ", ".join(failed))
    sys.exit(1)
