const test = require("node:test");
const assert = require("node:assert/strict");
const M = require("../js/mastery.js");

test("rank thresholds", () => {
  assert.equal(M.xpForRank(0), 0);
  assert.equal(M.xpForRank(1), 2500);
  assert.equal(M.xpForRank(30), 2250000);
  assert.equal(M.xpForRank(31), 2397500);
});

test("rankFromXp is the inverse of xpForRank at boundaries", () => {
  for (const r of [0, 1, 2, 10, 29, 30, 31, 35]) {
    assert.equal(M.rankFromXp(M.xpForRank(r)), r);
    if (r > 0) assert.equal(M.rankFromXp(M.xpForRank(r) - 1), r - 1);
  }
  assert.equal(M.rankFromXp(-5), 0);
  assert.equal(M.rankFromXp(NaN), 0);
});

test("rankProgress reports distance to the next rank", () => {
  const p = M.rankProgress(2500 + 1000);
  assert.equal(p.rank, 1);
  assert.equal(p.into, 1000);
  assert.equal(p.remaining, M.xpForRank(2) - 3500);
  assert.ok(p.pct > 0 && p.pct < 100);
});

test("weapon and frame rules differ", () => {
  const w = M.evaluateItem({ uniqueName: "w", name: "W", type: "primary" }, 450000);
  assert.equal(w.rank, 30);
  assert.equal(w.masteryXp, 3000);
  assert.ok(w.mastered);

  const f = M.evaluateItem({ uniqueName: "f", name: "F", type: "warframe" }, 900000);
  assert.equal(f.rank, 30);
  assert.equal(f.masteryXp, 6000);
  assert.ok(f.mastered);

  // A weapon's XP is not enough to max a warframe.
  const half = M.evaluateItem({ uniqueName: "f", name: "F", type: "warframe" }, 450000);
  assert.ok(!half.mastered);
});

test("rank-40 items only give mastery for 30 ranks", () => {
  const item = { uniqueName: "k", name: "K", type: "secondary", maxRank: 40 };
  const e = M.evaluateItem(item, 500 * 40 * 40);
  assert.equal(e.rank, 40);
  assert.equal(e.masteryXp, 3000);
  assert.ok(e.mastered);
});

test("companions use the Warframe rules whatever their type string", () => {
  for (const type of ["sentinel", "beast", "moa", "something-new"]) {
    const item = { uniqueName: "/c", name: "C", type, list: "companions" };
    const e = M.evaluateItem(item, 900000);
    assert.equal(e.rank, 30);
    assert.equal(e.masteryXp, 6000);
    assert.ok(e.mastered);
  }
  // Same type string outside the companions list is still treated as a weapon.
  assert.equal(M.evaluateItem({ uniqueName: "/w", name: "W", type: "sentinel" }, 450000).masteryXp, 3000);
});

test("archwings and necramechs use the Warframe rules", () => {
  for (const type of ["archwing", "necramech"]) {
    const e = M.evaluateItem({ uniqueName: "/v", name: "V", type, list: "vehicles" }, 900000);
    assert.equal(e.masteryXp, 6000);
    assert.ok(e.mastered);
  }
});

test("lists come out in order with friendly labels", () => {
  const mk = (list, type) => ({ uniqueName: "/" + list + type, name: list + type, type, list });
  const rows = M.summarize([mk("vehicles", "necramech"), mk("companions", "sentinel"), mk("weapons", "melee"), mk("warframes", "warframe")], {}, [], 0).rows;
  assert.deepEqual(M.groupRows(rows).map((g) => g.label), ["Warframes", "Weapons", "Companions", "Vehicles"]);
});

test("groupRows splits each list into ordered type sub-groups", () => {
  const mk = (list, type, n) => ({ uniqueName: "/" + type + n, name: type + n, type, list });
  const items = [
    mk("weapons", "melee", 1), mk("weapons", "sentinel-weapon", 1), mk("weapons", "primary", 1), mk("weapons", "primary", 2), mk("weapons", "secondary", 1), mk("weapons", "zaw", 1),
    mk("companions", "beast", 1), mk("companions", "sentinel", 1),
    mk("vehicles", "necramech", 1), mk("vehicles", "archwing", 1), mk("vehicles", "archwing", 2),
    mk("warframes", "warframe", 1),
  ];
  const groups = M.groupRows(M.summarize(items, {}, [], 0).rows);
  const byId = Object.fromEntries(groups.map((g) => [g.id, g]));
  assert.deepEqual(byId.weapons.types.map((t) => t.label), ["Primary", "Secondary", "Melee", "Companion weapons", "Zaw"]);
  assert.deepEqual(byId.weapons.types.map((t) => t.rows.length), [2, 1, 1, 1, 1]);
  assert.deepEqual(byId.companions.types.map((t) => t.label), ["Sentinels", "Beasts"]);
  assert.deepEqual(byId.vehicles.types.map((t) => t.label), ["Archwings", "Necramechs"]);
  assert.equal(byId.warframes.types.length, 1);
  // every row appears exactly once in its list's sub-groups
  for (const g of groups) assert.equal(g.types.reduce((n, t) => n + t.rows.length, 0), g.rows.length);
});

test("typeLabel falls back to a readable name", () => {
  assert.equal(M.typeLabel("sentinel-weapon"), "Companion weapons");
  assert.equal(M.typeLabel("brand-new-thing"), "Brand new thing");
});

test("manual tick marks an item mastered without profile data", () => {
  const e = M.evaluateItem({ uniqueName: "m", name: "M", type: "melee" }, undefined, true);
  assert.ok(e.mastered);
  assert.equal(e.masteryXp, 3000);
});

test("parseProfile accepts Results[0] and bare objects", () => {
  const body = { DisplayName: "Tenno", PlayerLevel: 12, XPInfo: [{ ItemType: "/A", XP: 10 }, { ItemType: "/A", XP: 30 }, { ItemType: "/B", XP: 5 }] };
  for (const input of [{ Results: [body] }, body]) {
    const p = M.parseProfile(input);
    assert.equal(p.displayName, "Tenno");
    assert.equal(p.reportedRank, 12);
    assert.deepEqual(p.xpByItem, { "/A": 30, "/B": 5 });
  }
});

test("parseProfile rejects unusable input", () => {
  assert.throws(() => M.parseProfile(null));
  assert.throws(() => M.parseProfile({ foo: 1 }), /XPInfo/);
});

test("summarize totals and projections", () => {
  const items = [
    { uniqueName: "/w", name: "W", type: "primary" },
    { uniqueName: "/f", name: "F", type: "warframe" },
  ];
  const s = M.summarize(items, { "/w": 450000 }, [], 1000);
  assert.equal(s.itemXp, 3000);
  assert.equal(s.itemMaxXp, 9000);
  assert.equal(s.masteredCount, 1);
  assert.equal(s.current.xp, 4000);
  assert.equal(s.potential.xp, 10000);
});

test("groupRows splits into ordered lists and falls back on type", () => {
  const items = [
    { uniqueName: "/w1", name: "W1", type: "melee" },
    { uniqueName: "/f1", name: "F1", type: "warframe" },
    { uniqueName: "/w2", name: "W2", type: "primary", list: "weapons" },
    { uniqueName: "/x1", name: "X1", type: "other", list: "extras" },
  ];
  const groups = M.groupRows(M.summarize(items, {}, [], 0).rows);
  assert.deepEqual(groups.map((g) => g.id), ["warframes", "weapons", "extras"]);
  assert.deepEqual(groups.map((g) => g.label), ["Warframes", "Weapons", "Extras"]);
  const withCompanions = M.groupRows(M.summarize([...items, { uniqueName: "/c1", name: "C1", type: "sentinel", list: "companions" }], {}, [], 0).rows);
  assert.deepEqual(withCompanions.map((g) => g.id), ["warframes", "weapons", "companions", "extras"]);
  assert.equal(withCompanions[2].label, "Companions");
  assert.deepEqual(groups[1].rows.map((r) => r.item.uniqueName), ["/w1", "/w2"]);
  assert.deepEqual(M.groupRows([]), []);
});

test("other sources nest as Star Chart (Normal, Steel Path) and Intrinsics (Drifter, Railjack)", () => {
  const o = M.summarizeOther(null);
  assert.equal(o.total, 0);
  assert.deepEqual(o.groups.map((g) => g.label), ["Star Chart", "Intrinsics"]);
  assert.deepEqual(o.groups.map((g) => g.sources.map((s) => s.label)), [["Normal", "Steel Path"], ["Drifter", "Railjack"]]);
  assert.deepEqual(o.groups.map((g) => g.kind), ["xp", "ranks"]);
  assert.deepEqual(o.sources.map((s) => s.fullLabel), ["Star Chart", "Steel Path Star Chart", "Drifter Intrinsics", "Railjack Intrinsics"]);
  // every source belongs to exactly one group
  const grouped = o.groups.flatMap((g) => g.sources.map((s) => s.id)).sort();
  assert.deepEqual(grouped, o.sources.map((s) => s.id).sort());
});

test("group totals add up their sources", () => {
  const o = M.summarizeOther({
    xp: { "star-chart": 1000, "steel-path": 500 },
    ranks: { "railjack-intrinsics/piloting": 10, "drifter-intrinsics/riding": 4, "drifter-intrinsics/combat": 1 },
  });
  const [chart, intr] = o.groups;
  assert.equal(chart.xp, 1500);
  assert.equal(chart.rank, null);
  assert.equal(intr.rank, 15);
  assert.equal(intr.maxRank, 90);
  assert.equal(intr.xp, 15 * 1500);
  assert.equal(o.total, 1500 + 15 * 1500);
});

test("saved entries from before the regrouping still load", () => {
  // keys written by the previous layout
  const o = M.summarizeOther({ xp: { "star-chart": 12345, "steel-path": 678 }, ranks: { "railjack-intrinsics/gunnery": 3 } });
  assert.equal(o.sources.find((s) => s.id === "star-chart").xp, 12345);
  assert.equal(o.sources.find((s) => s.id === "steel-path").xp, 678);
  assert.equal(o.sources.find((s) => s.id === "railjack-intrinsics").rank, 3);
});

test("intrinsic ranks give 1,500 mastery XP each and add up", () => {
  const o = M.summarizeOther({ ranks: { "railjack-intrinsics/piloting": 10, "railjack-intrinsics/gunnery": 3, "drifter-intrinsics/riding": 2 } });
  const rj = o.sources.find((s) => s.id === "railjack-intrinsics");
  const dr = o.sources.find((s) => s.id === "drifter-intrinsics");
  assert.equal(rj.rank, 13);
  assert.equal(rj.xp, 13 * 1500);
  assert.equal(rj.maxRank, 50);
  assert.equal(rj.maxXp, 50 * 1500);
  assert.equal(dr.xp, 3000);
  assert.equal(dr.maxRank, 40);
  assert.equal(o.total, 13 * 1500 + 3000);
});

test("entered XP is added per source", () => {
  const o = M.summarizeOther({ xp: { "star-chart": 12345, "steel-path": 678 } });
  assert.equal(o.sources[0].xp, 12345);
  assert.equal(o.sources[1].xp, 678);
  assert.equal(o.total, 13023);
});

test("sanitizeOther clamps, floors and drops anything unknown", () => {
  const o = M.sanitizeOther({
    xp: { "star-chart": -5, "steel-path": "1e3", bogus: 99, "drifter-intrinsics": 5 },
    ranks: { "railjack-intrinsics/piloting": 99, "railjack-intrinsics/gunnery": 2.9, "railjack-intrinsics/nope": 4, "drifter-intrinsics/riding": "abc" },
  });
  assert.deepEqual(o, { xp: { "steel-path": 1000 }, ranks: { "railjack-intrinsics/piloting": 10, "railjack-intrinsics/gunnery": 2 } });
  assert.equal(M.sanitizeOther({ xp: { "star-chart": 1e15 } }).xp["star-chart"], 10000000);
  for (const junk of [null, undefined, 5, "x", [], { xp: 7, ranks: "y" }]) assert.deepEqual(M.sanitizeOther(junk), { xp: {}, ranks: {} });
});

test("other-sources XP feeds the rank total", () => {
  const items = [{ uniqueName: "/w", name: "W", type: "primary" }];
  const other = M.summarizeOther({ xp: { "star-chart": 2500 } });
  assert.equal(M.summarize(items, {}, [], other.total).current.rank, 1);
});

test("parseProfile finds XPInfo nested inside the profile", () => {
  const p = M.parseProfile({ Results: [{ DisplayName: "T", PlayerLevel: 3, LoadOutInventory: { XPInfo: [{ ItemType: "/A", XP: 7 }] } }] });
  assert.deepEqual(p.xpByItem, { "/A": 7 });
  assert.throws(() => M.parseProfile({ Results: [{ DisplayName: "T", Other: 1 }] }), /Top-level fields: DisplayName, Other/);
});
