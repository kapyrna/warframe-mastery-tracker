import json, pathlib, sys, urllib.request, urllib.error
from concurrent.futures import ThreadPoolExecutor, as_completed
from urllib.parse import quote

BASE = "http://content.warframe.com/PublicExport"
USER_AGENT = "..."  # same User-Agent as the other scripts
DATA = pathlib.Path("data")
IMAGES = pathlib.Path("images")
STATE = IMAGES / "index.json"

FILTER = True          # only images for items listed in the manifests below
FILTER_MANIFESTS = ["ExportFlavour_en.json"]
WORKERS = 6
MAX_NEW = 0            # 0 = no limit; set e.g. 200 for a first test run

def walk(obj, test, out):
    if isinstance(obj, dict):
        if test(obj):
            out.append(obj)
        for v in obj.values():
            walk(v, test, out)
    elif isinstance(obj, list):
        for v in obj:
            walk(v, test, out)

def load(name):
    return json.loads((DATA / name).read_text(encoding="utf-8"))

def get(url):
    last = None
    for _ in range(3):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
            with urllib.request.urlopen(req, timeout=60) as r:
                return r.read()
        except urllib.error.HTTPError as e:
            if e.code == 404:
                raise
            last = e
        except Exception as e:
            last = e
    raise last

# 1. entries from ExportManifest.json
entries = []
walk(load("ExportManifest.json"), lambda d: "uniqueName" in d and "textureLocation" in d, entries)
print("manifest entries:", len(entries))

# 2. optional filter to the items the tracker actually uses
wanted = None
if FILTER:
    wanted = set()
    for name in FILTER_MANIFESTS:
        if not (DATA / name).exists():
            print("filter manifest missing:", name)
            continue
        found = []
        walk(load(name), lambda d: "uniqueName" in d, found)
        wanted.update(d["uniqueName"] for d in found)
    print("wanted items:", len(wanted))

# 3. work out what to download
state = json.loads(STATE.read_text()) if STATE.exists() else {}
files = state.get("files", {})        # relative path -> hash
items = state.get("items", {})       # uniqueName -> relative path
missing = state.get("missing", {})     # relative path -> hash that returned 404

todo = {}                        # relative path -> (hash, url)
for e in entries:
    if wanted is not None and e["uniqueName"] not in wanted:
        continue
    loc = e["textureLocation"].replace("\\", "/")
    path, _, h = loc.partition("!")
    rel = path.lstrip("/")
    parts = pathlib.PurePosixPath(rel).parts
    if not rel or ".." in parts or not h:
        print("skipping odd entry:", loc)
        continue
    items[e["uniqueName"]] = rel
    if files.get(rel) == h and (IMAGES / rel).exists():
        continue
    if missing.get(rel) == h:
        continue
    todo[rel] = (h, BASE + "/" + quote(rel, safe="/") + "!" + h)

todo = dict(list(todo.items())[: MAX_NEW or None])
print("to download:", len(todo))

# 4. download
def fetch(rel, h, url):
    data = get(url)
    if not data.startswith(b"\x89PNG"):
        raise ValueError("not a PNG")
    dest = IMAGES / rel
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_bytes(data)
    return rel, h

failed = []
with ThreadPoolExecutor(max_workers=WORKERS) as ex:
    futures = {ex.submit(fetch, rel, h, url): rel for rel, (h, url) in todo.items()}
    for fut in as_completed(futures):
        rel = futures[fut]
        try:
            _, h = fut.result()
            files[rel] = h
        except urllib.error.HTTPError as e:
            if e.code == 404:
                print("MISSING (404)", rel)
                missing[rel] = todo[rel][0]
            else:
                print("FAILED", rel, e)
                failed.append(rel)
		except Exception as e:
            print("FAILED", rel, e)
            failed.append(rel)

IMAGES.mkdir(exist_ok=True)
STATE.write_text(json.dumps({"files": files, "items": items, "missing": missing}, indent=1) + "\n")
print("done; failed:", len(failed))
if failed:
    sys.exit(1)
