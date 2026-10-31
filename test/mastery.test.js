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
  assert.deepEqual(groups[1].rows.map((r) => r.item.uniqueName), ["/w1", "/w2"]);
  assert.deepEqual(M.groupRows([]), []);
});

test("estimateOtherXp never goes negative", () => {
  assert.equal(M.estimateOtherXp(1, 999999), 0);
  assert.equal(M.estimateOtherXp(2, 1000), 10000 - 1000);
  assert.equal(M.estimateOtherXp(null, 1000), 0);
});
