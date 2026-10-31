#!/usr/bin/env python3
"""Build data/items.json (Warframes and weapons) from Warframe's Public Export.

Public Export is undocumented and may change. The script prints what it kept and
dropped, and refuses to overwrite the data file if the result looks wrong.
"""
import collections
import json
import lzma
import re
import sys
import time
import traceback
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

LANG = "en"
INDEX_URLS = [
    f"https://origin.warframe.com/PublicExport/index_{LANG}.txt.lzma",
    f"http://origin.warframe.com/PublicExport/index_{LANG}.txt.lzma",
    f"https://content.warframe.com/PublicExport/index_{LANG}.txt.lzma",
    f"http://content.warframe.com/PublicExport/index_{LANG}.txt.lzma",
]
MANIFEST_BASE = "https://content.warframe.com/PublicExport/Manifest/"
OUT = Path(__file__).resolve().parent.parent / "data" / "items.json"
USER_AGENT = "warframe-mastery-tracker (+https://github.com/kapyrna/warframe-mastery-tracker)"

# productCategory -> our item type
WARFRAME_CATEGORIES = {"Suits": "warframe"}
WEAPON_CATEGORIES = {
    "LongGuns": "primary",
    "Pistols": "secondary",
    "Melee": "melee",
    "SpaceGuns": "archgun",
    "SpaceMelee": "archmelee",
    "SentinelWeapons": "sentinel-weapon",
}

# Sanity floors: a result smaller than this means the format probably changed.
MIN_WARFRAMES = 30
MIN_WEAPONS = 200


# None means "leave urllib's default User-Agent in place".
UA_VARIANTS = (USER_AGENT, None)


def fetch_once(url, user_agent, timeout):
    headers = {"User-Agent": user_agent} if user_agent else {}
    with urllib.request.urlopen(urllib.request.Request(url, headers=headers), timeout=timeout) as resp:
        return resp.read()


def fetch(url, retries=3, timeout=60):
    errors = []
    for attempt in range(retries):
        for ua in UA_VARIANTS:
            try:
                return fetch_once(url, ua, timeout)
            except Exception as exc:  # noqa: BLE001 - report whatever went wrong
                errors.append(f"{'default UA' if ua is None else 'custom UA'}: {exc}")
        if attempt < retries - 1:
            time.sleep(2 * (attempt + 1))
    raise RuntimeError(f"Could not fetch {url} ({'; '.join(dict.fromkeys(errors))})")


def fetch_index():
    """Download the compressed index, trying each known address until one answers."""
    failures = []
    for url in INDEX_URLS:
        try:
            data = fetch(url, retries=1)
            annotate("notice", f"Index downloaded from {url}", "Index source")
            return data
        except RuntimeError as exc:
            failures.append(str(exc))
            annotate("warning", str(exc), "Index attempt failed")
    raise RuntimeError("Every index address failed:\n" + "\n".join(failures))


def lzma_decompress(data):
    # Decompress with the streaming API so a missing end-of-stream marker (seen
    # on these index files) returns what was decoded instead of raising.
    return lzma.LZMADecompressor(format=lzma.FORMAT_AUTO).decompress(data)


def parse_index(text, lang=LANG):
    """Map 'ExportWeapons' -> 'ExportWeapons_en.json!00_hash' from the index."""
    pattern = re.compile(rf"^(Export[A-Za-z]+)_{re.escape(lang)}\.json!\S+$")
    index = {}
    for line in text.splitlines():
        line = line.strip()
        m = pattern.match(line)
        if m:
            index[m.group(1)] = line
    return index


def parse_export(raw_bytes, key):
    # The export files contain raw control characters inside strings, which
    # strict JSON parsing rejects.
    payload = json.loads(raw_bytes.decode("utf-8-sig"), strict=False)
    if isinstance(payload, dict):
        if isinstance(payload.get(key), list):
            return payload[key]
        for value in payload.values():
            if isinstance(value, list):
                return value
    if isinstance(payload, list):
        return payload
    raise ValueError(f"No item list found in {key}")


def load_export(index, key):
    if key not in index:
        raise RuntimeError(f"{key} not found in the export index (found: {sorted(index)})")
    raw = fetch(MANIFEST_BASE + urllib.parse.quote(index[key], safe="!+_.-"))
    return parse_export(raw, key)


def clean_name(name):
    return re.sub(r"<[^>]*>", "", str(name)).strip()


def build_items(warframes_raw, weapons_raw):
    """Filter and normalise raw export entries. Returns (items, stats)."""
    items = {}
    stats = collections.Counter()

    def add(raw, categories, list_id):
        stats[f"{list_id}: raw"] += 1
        category = raw.get("productCategory")
        if category not in categories:
            stats[f"{list_id}: dropped, category {category!r}"] += 1
            return
        if raw.get("excludeFromCodex"):
            stats[f"{list_id}: dropped, excluded from codex"] += 1
            return
        unique, name = raw.get("uniqueName"), clean_name(raw.get("name", ""))
        if not unique or not name:
            stats[f"{list_id}: dropped, missing name"] += 1
            return
        if not isinstance(raw.get("masteryReq"), int):
            stats[f"{list_id}: dropped, no masteryReq"] += 1
            return
        items[unique] = {
            "uniqueName": unique,
            "name": name,
            "type": categories[category],
            "list": list_id,
            "masteryReq": raw["masteryReq"],
        }
        stats[f"{list_id}: kept"] += 1

    for raw in warframes_raw:
        add(raw, WARFRAME_CATEGORIES, "warframes")
    for raw in weapons_raw:
        add(raw, WEAPON_CATEGORIES, "weapons")

    ordered = sorted(items.values(), key=lambda i: (i["list"], i["name"].lower(), i["uniqueName"]))
    return ordered, stats


def check_sane(items):
    counts = collections.Counter(i["list"] for i in items)
    problems = []
    if counts["warframes"] < MIN_WARFRAMES:
        problems.append(f"only {counts['warframes']} warframes (expected at least {MIN_WARFRAMES})")
    if counts["weapons"] < MIN_WEAPONS:
        problems.append(f"only {counts['weapons']} weapons (expected at least {MIN_WEAPONS})")
    return problems


def render(items, generated_at):
    lines = ",\n".join("    " + json.dumps(i, ensure_ascii=False, separators=(",", ":")) for i in items)
    return (
        "{\n"
        f'  "generatedAt": {json.dumps(generated_at)},\n'
        '  "source": "Warframe Public Export",\n'
        '  "items": [\n' + lines + "\n  ]\n}\n"
    )


def annotate(level, message, title=""):
    """Emit a GitHub Actions workflow command so the message shows on the run page."""
    escaped = message.replace("%", "%25").replace("\r", "%0D").replace("\n", "%0A")
    head = f"::{level} title={title}::" if title else f"::{level}::"
    print(head + escaped, flush=True)


def run():
    index_bytes = fetch_index()
    index_text = lzma_decompress(index_bytes).decode("utf-8", "replace")
    index = parse_index(index_text)
    annotate(
        "notice",
        f"Index {len(index_bytes)} bytes compressed, {len(index_text.splitlines())} lines; "
        f"export files found: {', '.join(sorted(index)) or 'none'}",
        "Step 2",
    )
    warframes = load_export(index, "ExportWarframes")
    weapons = load_export(index, "ExportWeapons")
    annotate("notice", f"Raw entries: {len(warframes)} warframes, {len(weapons)} weapons", "Step 3")

    items, stats = build_items(warframes, weapons)
    summary = "\n".join(f"{line}: {stats[line]}" for line in sorted(stats))
    print(summary)
    annotate("notice", summary, "Filter results")

    problems = check_sane(items)
    if problems:
        message = "Refusing to write data file: " + "; ".join(problems)
        print(message, file=sys.stderr)
        annotate("error", message, "Sanity check")
        return 1

    if OUT.exists():
        try:
            if json.loads(OUT.read_text(encoding="utf-8")).get("items") == items:
                print("Item list unchanged; leaving data file as is.")
                return 0
        except (ValueError, OSError):
            pass

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(render(items, datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")), encoding="utf-8")
    print(f"Wrote {len(items)} items to {OUT}")
    return 0


def main():
    try:
        return run()
    except Exception as exc:  # noqa: BLE001 - surface any failure on the run page
        traceback.print_exc()
        annotate("error", f"{type(exc).__name__}: {exc}", "Fetch item data failed")
        return 1


if __name__ == "__main__":
    sys.exit(main())
