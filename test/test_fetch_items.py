import contextlib
import io
import json
import lzma
import sys
import unittest
from unittest import mock
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
            {"uniqueName": "/F/Orion", "name": "Orion", "productCategory": "SpecialItems", "masteryReq": 0},
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

    def test_archwings_and_necramechs_share_the_vehicles_list(self):
        warframes = [
            {"uniqueName": "/F/Excal", "name": "Excalibur", "productCategory": "Suits", "masteryReq": 0},
            {"uniqueName": "/A/Odonata", "name": "Odonata", "productCategory": "SpaceSuits", "masteryReq": 5},
            {"uniqueName": "/M/Voidrig", "name": "Voidrig", "productCategory": "MechSuits", "masteryReq": 8},
            {"uniqueName": "/X/Orion", "name": "Orion & Sirius", "productCategory": "SpecialItems", "masteryReq": 0, "excludeFromCodex": True},
        ]
        items, stats = F.build_items(warframes, [])
        got = {i["uniqueName"]: (i["list"], i["type"], i["masteryReq"]) for i in items}
        self.assertEqual(got, {
            "/F/Excal": ("warframes", "warframe", 0),
            "/A/Odonata": ("vehicles", "archwing", 5),
            "/M/Voidrig": ("vehicles", "necramech", 8),
        })
        self.assertEqual(stats["vehicles: kept as archwing"], 1)
        self.assertEqual(stats["vehicles: kept as necramech"], 1)
        self.assertEqual(stats["warframes: dropped, category 'SpecialItems'"], 1)

    def test_duplicates_collapse_by_unique_name(self):
        w = {"uniqueName": "/W/A", "name": "A", "productCategory": "Melee", "masteryReq": 0}
        items, _ = F.build_items([], [w, dict(w, name="A2")])
        self.assertEqual(len(items), 1)

    def test_companions_are_included_with_friendly_and_fallback_types(self):
        companions = [
            {"uniqueName": "/S/Carrier", "name": "Carrier", "productCategory": "Sentinels", "masteryReq": 0},
            {"uniqueName": "/K/Kavat", "name": "Kavat", "productCategory": "KubrowPets", "masteryReq": 0},
            {"uniqueName": "/H/Hound", "name": "Hound", "productCategory": "Hounds", "masteryReq": 0},
            {"uniqueName": "/S/Hidden", "name": "Hidden", "productCategory": "Sentinels", "masteryReq": 0, "excludeFromCodex": True},
            {"uniqueName": "/S/NoCat", "name": "NoCat", "masteryReq": 0},
            {"uniqueName": "/S/NoReq", "name": "NoReq", "productCategory": "Sentinels"},
        ]
        items, stats = F.build_items([], [], companions)
        self.assertEqual({i["uniqueName"]: i["type"] for i in items},
                         {"/S/Carrier": "sentinel", "/K/Kavat": "beast", "/H/Hound": "hounds", "/S/NoReq": "sentinel"})
        # Companions have no mastery gate, so the field is simply left out.
        self.assertNotIn("masteryReq", next(i for i in items if i["uniqueName"] == "/S/NoReq"))
        self.assertTrue(all(i["list"] == "companions" for i in items))
        self.assertEqual(stats["companions: kept as hounds"], 1)

    def test_sanity_check_flags_small_results(self):
        self.assertTrue(F.check_sane([]))
        enough = ([{"list": "warframes"}] * F.MIN_WARFRAMES + [{"list": "weapons"}] * F.MIN_WEAPONS
                  + [{"list": "companions"}] * F.MIN_COMPANIONS
                  + [{"list": "vehicles", "type": "archwing"}] * F.MIN_ARCHWINGS
                  + [{"list": "vehicles", "type": "necramech"}] * F.MIN_NECRAMECHS)
        self.assertEqual(F.check_sane(enough), [])
        self.assertTrue(any("necramechs" in p for p in F.check_sane(enough[:-1])))
        self.assertTrue(any("archwings" in p for p in F.check_sane([i for i in enough if i.get("type") != "archwing"])))


class FailureReportingTests(unittest.TestCase):
    def test_annotation_escapes_newlines_and_percent(self):
        buf = io.StringIO()
        with contextlib.redirect_stdout(buf):
            F.annotate("error", "a\nb 100%", "T")
        self.assertEqual(buf.getvalue().strip(), "::error title=T::a%0Ab 100%25")

    def test_failure_is_reported_and_returns_nonzero(self):
        out, err = io.StringIO(), io.StringIO()
        with mock.patch.object(F, "fetch", side_effect=RuntimeError("boom")), \
                contextlib.redirect_stdout(out), contextlib.redirect_stderr(err):
            code = F.main()
        self.assertEqual(code, 1)
        self.assertIn("::error title=Fetch item data failed::RuntimeError:", out.getvalue())
        self.assertIn("boom", out.getvalue())


class IndexFallbackTests(unittest.TestCase):
    def test_falls_through_to_first_working_address(self):
        def fake(url, retries=3, timeout=60):
            if url.startswith("http://content"):
                return b"index-bytes"
            raise RuntimeError(f"Could not fetch {url} (HTTP Error 403: Forbidden)")
        with mock.patch.object(F, "fetch", side_effect=fake), contextlib.redirect_stdout(io.StringIO()):
            self.assertEqual(F.fetch_index(), b"index-bytes")

    def test_reports_every_failure_when_none_work(self):
        def fake(url, retries=3, timeout=60):
            raise RuntimeError(f"Could not fetch {url} (HTTP Error 403: Forbidden)")
        with mock.patch.object(F, "fetch", side_effect=fake), contextlib.redirect_stdout(io.StringIO()):
            with self.assertRaises(RuntimeError) as ctx:
                F.fetch_index()
        for url in F.INDEX_URLS:
            self.assertIn(url, str(ctx.exception))


class ExtendedRankTests(unittest.TestCase):
    def test_kuva_tenet_coda_and_paracesis_go_to_rank_40(self):
        def raw(name):
            return {"uniqueName": "/L/" + name, "name": name, "productCategory": "LongGuns", "masteryReq": 5}
        items, _ = F.build_items([], [raw("Kuva Hek"), raw("Tenet Envoy"), raw("Coda Hema"), raw("Paracesis"), raw("Hek"), raw("Kuvarian")])
        by = {i["name"]: i for i in items}
        for name in ("Kuva Hek", "Tenet Envoy", "Coda Hema", "Paracesis"):
            self.assertEqual((by[name]["maxRank"], by[name]["masteryRanks"]), (40, 40), name)
        for name in ("Hek", "Kuvarian"):
            self.assertNotIn("maxRank", by[name], name)


class RenderTests(unittest.TestCase):
    def test_output_is_valid_json_the_page_can_read(self):
        items = [{"uniqueName": "/A", "name": "Å", "type": "melee", "list": "weapons", "masteryReq": 0}]
        data = json.loads(F.render(items, "2026-10-31T00:00:00Z"))
        self.assertEqual(data["items"], items)
        self.assertEqual(data["generatedAt"], "2026-10-31T00:00:00Z")


if __name__ == "__main__":
    unittest.main()
