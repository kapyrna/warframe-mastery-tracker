import json
import lzma
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "scripts"))
import fetch_items as F  # noqa: E402


class IndexTests(unittest.TestCase):
    def test_lzma_roundtrip_tolerates_missing_end_marker(self):
        text = "ExportWeapons_en.json!00_abc\n"
        packed = lzma.compress(text.encode(), format=lzma.FORMAT_ALONE)
        self.assertEqual(F.lzma_decompress(packed).decode(), text)
        # Drop the tail of the stream: should still return data, not raise.
        F.lzma_decompress(packed[:-2])

    def test_parse_index_picks_language_exports(self):
        text = "\n".join([
            "ExportWeapons_en.json!00_AAAAAAAAAAAAAAAAAAAAAAAAAA",
            "ExportWarframes_en.json!00_BBBBBBBBBBBBBBBBBBBBBBBBBB",
            "ExportWeapons_de.json!00_CCCCCCCCCCCCCCCCCCCCCCCCCC",
            "/Lotus/Interface/Icons/Foo.png!00_DDDD",
        ])
        idx = F.parse_index(text, "en")
        self.assertEqual(set(idx), {"ExportWeapons", "ExportWarframes"})
        self.assertTrue(idx["ExportWeapons"].startswith("ExportWeapons_en.json!"))


class ParseTests(unittest.TestCase):
    def test_control_characters_in_strings_are_accepted(self):
        raw = b'{"ExportWeapons":[{"uniqueName":"/A","name":"Line\none"}]}'
        out = F.parse_export(raw, "ExportWeapons")
        self.assertEqual(out[0]["name"], "Line\none")

    def test_bom_and_fallback_key(self):
        raw = b'\xef\xbb\xbf{"Other":[{"uniqueName":"/A"}]}'
        self.assertEqual(F.parse_export(raw, "ExportWeapons"), [{"uniqueName": "/A"}])


class BuildTests(unittest.TestCase):
    def test_filters_and_normalises(self):
        warframes = [
            {"uniqueName": "/F/Excal", "name": "Excalibur", "productCategory": "Suits", "masteryReq": 0},
            {"uniqueName": "/F/Odonata", "name": "Odonata", "productCategory": "SpaceSuits", "masteryReq": 0},
        ]
        weapons = [
            {"uniqueName": "/W/Lato", "name": "Lato", "productCategory": "Pistols", "masteryReq": 0},
            {"uniqueName": "/W/Braton", "name": "<ARCHWING> Braton", "productCategory": "LongGuns", "masteryReq": 2},
            {"uniqueName": "/W/Amp", "name": "Amp", "productCategory": "OperatorAmps", "masteryReq": 0},
            {"uniqueName": "/W/Hidden", "name": "Hidden", "productCategory": "Melee", "masteryReq": 0, "excludeFromCodex": True},
            {"uniqueName": "/W/NoReq", "name": "NoReq", "productCategory": "Melee"},
            {"uniqueName": "/W/Nameless", "name": " ", "productCategory": "Melee", "masteryReq": 0},
        ]
        items, stats = F.build_items(warframes, weapons)
        self.assertEqual([i["uniqueName"] for i in items], ["/F/Excal", "/W/Braton", "/W/Lato"])
        braton = next(i for i in items if i["uniqueName"] == "/W/Braton")
        self.assertEqual(braton["name"], "Braton")  # markup tag stripped
        self.assertEqual(braton["list"], "weapons")
        self.assertEqual(braton["type"], "primary")
        self.assertEqual(next(i for i in items if i["list"] == "warframes")["type"], "warframe")
        self.assertEqual(stats["weapons: kept"], 2)
        self.assertEqual(stats["weapons: dropped, no masteryReq"], 1)

    def test_duplicates_collapse_by_unique_name(self):
        w = {"uniqueName": "/W/A", "name": "A", "productCategory": "Melee", "masteryReq": 0}
        items, _ = F.build_items([], [w, dict(w, name="A2")])
        self.assertEqual(len(items), 1)

    def test_sanity_check_flags_small_results(self):
        self.assertTrue(F.check_sane([]))
        enough = [{"list": "warframes"}] * F.MIN_WARFRAMES + [{"list": "weapons"}] * F.MIN_WEAPONS
        self.assertEqual(F.check_sane(enough), [])


class RenderTests(unittest.TestCase):
    def test_output_is_valid_json_the_page_can_read(self):
        items = [{"uniqueName": "/A", "name": "Å", "type": "melee", "list": "weapons", "masteryReq": 0}]
        data = json.loads(F.render(items, "2026-10-31T00:00:00Z"))
        self.assertEqual(data["items"], items)
        self.assertEqual(data["generatedAt"], "2026-10-31T00:00:00Z")


if __name__ == "__main__":
    unittest.main()
