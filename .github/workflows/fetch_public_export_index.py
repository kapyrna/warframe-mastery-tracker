import lzma, pathlib, urllib.request

INDEX_URL = "https://origin.warframe.com/PublicExport/index_en.txt.lzma"
OUT = pathlib.Path("data")

req = urllib.request.Request(INDEX_URL, headers={"User-Agent": "warframe-mastery-tracker"})
with urllib.request.urlopen(req, timeout=60) as r:
    index = lzma.decompress(r.read()).decode("utf-8")

OUT.mkdir(exist_ok=True)
(OUT / "index_en.txt").write_text(index, encoding="utf-8")
print("saved data/index_en.txt")
