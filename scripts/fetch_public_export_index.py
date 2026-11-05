import lzma, pathlib, urllib.request, sys

INDEX_URL = "https://content.warframe.com/PublicExport/index_en.txt.lzma"
OUT = pathlib.Path("data")

req = urllib.request.Request(INDEX_URL, headers={
	"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36",
    "Accept": "*/*",
})

try:
    with urllib.request.urlopen(req, timeout=60) as r:
        index = lzma.decompress(r.read()).decode("utf-8")
except urllib.error.HTTPError as e:
    print("HTTP", e.code, e.reason)
    print(dict(e.headers))
    print(e.read()[:500])
    sys.exit(1)

OUT.mkdir(exist_ok=True)
(OUT / "index_en.txt").write_text(index, encoding="utf-8")
print("saved data/index_en.txt")
