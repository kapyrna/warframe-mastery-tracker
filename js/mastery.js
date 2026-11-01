/*
 * Mastery maths and profile parsing. No DOM access, so it runs in the browser
 * (exposed as window.Mastery) and in Node (module.exports) for tests.
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.Mastery = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  // Total mastery XP needed to hold rank N: 2500 * N^2 up to rank 30, then a
  // flat step per Legendary rank.
  const RANK_30_XP = 2500 * 30 * 30; // 2,250,000
  const LEGENDARY_STEP = 147500;

  // Item types that behave like Warframes (200 mastery XP per rank, steeper
  // affinity curve). Everything else is treated as a weapon (100 per rank).
  const FRAME_LIKE = new Set(["warframe", "companion", "archwing", "necramech", "vehicle"]);
  const DEFAULT_MAX_RANK = 30;

  function xpForRank(rank) {
    if (rank <= 0) return 0;
    if (rank <= 30) return 2500 * rank * rank;
    return RANK_30_XP + (rank - 30) * LEGENDARY_STEP;
  }

  function rankFromXp(xp) {
    if (!(xp > 0)) return 0;
    if (xp >= RANK_30_XP) return 30 + Math.floor((xp - RANK_30_XP) / LEGENDARY_STEP);
    return Math.floor(Math.sqrt(xp / 2500));
  }

  function rankProgress(totalXp) {
    const xp = Math.max(0, Math.floor(totalXp) || 0);
    const rank = rankFromXp(xp);
    const floor = xpForRank(rank);
    const next = xpForRank(rank + 1);
    return {
      rank,
      xp,
      floor,
      next,
      into: xp - floor,
      span: next - floor,
      remaining: next - xp,
      pct: Math.min(100, ((xp - floor) / (next - floor)) * 100),
    };
  }

  function rulesFor(item) {
    // Companions follow the Warframe rules whatever their exact type string is.
    const frameLike = FRAME_LIKE.has(item.type) || item.list === "companions";
    return {
      xpPerRank: item.xpPerRank ?? (frameLike ? 200 : 100),
      affinityFactor: item.affinityFactor ?? (frameLike ? 1000 : 500),
      maxRank: item.maxRank ?? DEFAULT_MAX_RANK,
      // Mastery is only awarded for the first 30 ranks, even on rank-40 items.
      masteryRanks: item.masteryRanks ?? DEFAULT_MAX_RANK,
    };
  }

  // Evaluate a single item. `xp` is raw affinity from the profile (or null).
  // `forceMastered` marks it done when the user ticks it by hand.
  function evaluateItem(item, xp, forceMastered) {
    const r = rulesFor(item);
    const maxMasteryXp = r.masteryRanks * r.xpPerRank;
    let rank = 0;
    if (forceMastered) rank = r.maxRank;
    else if (xp > 0) rank = Math.min(r.maxRank, Math.floor(Math.sqrt(xp / r.affinityFactor)));
    const masteryXp = Math.min(rank, r.masteryRanks) * r.xpPerRank;
    return {
      item,
      rank,
      maxRank: r.maxRank,
      masteryXp,
      maxMasteryXp,
      mastered: masteryXp >= maxMasteryXp,
      owned: forceMastered || xp > 0,
    };
  }

  function parseProfile(json) {
    const root = json && Array.isArray(json.Results) ? json.Results[0] : json;
    if (!root || typeof root !== "object") throw new Error("Not a profile JSON object.");
    if (!Array.isArray(root.XPInfo)) throw new Error("No XPInfo list found in this JSON.");
    const xpByItem = {};
    for (const e of root.XPInfo) {
      if (e && typeof e.ItemType === "string" && Number.isFinite(e.XP)) {
        xpByItem[e.ItemType] = Math.max(xpByItem[e.ItemType] || 0, e.XP);
      }
    }
    return {
      displayName: typeof root.DisplayName === "string" ? root.DisplayName : null,
      reportedRank: Number.isFinite(root.PlayerLevel) ? root.PlayerLevel : null,
      xpByItem,
    };
  }

  /*
   * items:      [{ uniqueName, name, type, masteryReq?, maxRank?, ... }]
   * xpByItem:   { uniqueName: affinityXp } from a parsed profile
   * manual:     Set/array of uniqueNames the user ticked as mastered
   * otherXp:    mastery XP from non-item sources (star chart, intrinsics, ...)
   */
  function summarize(items, xpByItem, manual, otherXp) {
    const forced = manual instanceof Set ? manual : new Set(manual || []);
    const rows = items.map((it) => evaluateItem(it, (xpByItem || {})[it.uniqueName], forced.has(it.uniqueName)));
    const itemXp = rows.reduce((s, r) => s + r.masteryXp, 0);
    const itemMaxXp = rows.reduce((s, r) => s + r.maxMasteryXp, 0);
    const other = Math.max(0, Math.floor(otherXp) || 0);
    return {
      rows,
      itemXp,
      itemMaxXp,
      otherXp: other,
      masteredCount: rows.filter((r) => r.mastered).length,
      current: rankProgress(itemXp + other),
      potential: rankProgress(itemMaxXp + other),
    };
  }

  // ---- other sources of mastery XP (things that are not items) ----
  // Intrinsics give 1,500 mastery XP per rank. The max rank per skill is 10. These
  // figures come from community sources and are kept here so they are easy to fix.
  const INTRINSIC_XP_PER_RANK = 1500;
  const INTRINSIC_MAX_RANK = 10;
  const MAX_ENTERED_XP = 10000000;

  const OTHER_SOURCES = [
    { id: "star-chart", label: "Star Chart", kind: "xp" },
    { id: "steel-path", label: "Steel Path Star Chart", kind: "xp" },
    {
      id: "drifter-intrinsics",
      label: "Drifter Intrinsics",
      kind: "ranks",
      xpPerRank: INTRINSIC_XP_PER_RANK,
      maxRank: INTRINSIC_MAX_RANK,
      skills: [
        { id: "riding", label: "Riding" },
        { id: "combat", label: "Combat" },
        { id: "opportunity", label: "Opportunity" },
        { id: "endurance", label: "Endurance" },
      ],
    },
    {
      id: "railjack-intrinsics",
      label: "Railjack Intrinsics",
      kind: "ranks",
      xpPerRank: INTRINSIC_XP_PER_RANK,
      maxRank: INTRINSIC_MAX_RANK,
      skills: [
        { id: "tactical", label: "Tactical" },
        { id: "piloting", label: "Piloting" },
        { id: "gunnery", label: "Gunnery" },
        { id: "engineering", label: "Engineering" },
        { id: "command", label: "Command" },
      ],
    },
  ];

  function wholeNumber(v, max) {
    const n = Math.floor(Number(v));
    return Number.isFinite(n) && n > 0 ? Math.min(n, max) : 0;
  }

  // Shape: { xp: { "star-chart": n, ... }, ranks: { "railjack-intrinsics/piloting": n, ... } }.
  // Anything unknown or out of range is dropped or clamped, whatever came in.
  function sanitizeOther(raw) {
    const out = { xp: {}, ranks: {} };
    const src = raw && typeof raw === "object" ? raw : {};
    for (const s of OTHER_SOURCES) {
      if (s.kind === "xp") {
        const n = wholeNumber(src.xp && src.xp[s.id], MAX_ENTERED_XP);
        if (n) out.xp[s.id] = n;
      } else {
        for (const sk of s.skills) {
          const key = s.id + "/" + sk.id;
          const n = wholeNumber(src.ranks && src.ranks[key], s.maxRank);
          if (n) out.ranks[key] = n;
        }
      }
    }
    return out;
  }

  function summarizeOther(raw) {
    const o = sanitizeOther(raw);
    const sources = OTHER_SOURCES.map((s) => {
      if (s.kind === "xp") {
        const xp = o.xp[s.id] || 0;
        return { id: s.id, label: s.label, kind: "xp", xp, maxXp: null };
      }
      const skills = s.skills.map((sk) => {
        const key = s.id + "/" + sk.id;
        const rank = o.ranks[key] || 0;
        return { id: sk.id, key, label: sk.label, rank, maxRank: s.maxRank, xp: rank * s.xpPerRank };
      });
      return {
        id: s.id,
        label: s.label,
        kind: "ranks",
        skills,
        rank: skills.reduce((n, k) => n + k.rank, 0),
        maxRank: skills.length * s.maxRank,
        xp: skills.reduce((n, k) => n + k.xp, 0),
        maxXp: skills.length * s.maxRank * s.xpPerRank,
      };
    });
    return { sources, total: sources.reduce((n, s) => n + s.xp, 0) };
  }

  // ---- grouping into the lists shown on the page ----
  const LIST_ORDER = ["warframes", "weapons", "companions", "vehicles"];
  const LIST_LABELS = { warframes: "Warframes", weapons: "Weapons", companions: "Companions", vehicles: "Vehicles" };

  // Order and names for the type sub-sections inside a list. Unknown types still
  // show up, after the known ones, under a capitalised version of their name.
  const TYPE_ORDER = {
    weapons: ["primary", "secondary", "melee", "archgun", "archmelee", "sentinel-weapon"],
    companions: ["sentinel", "beast", "moa", "hound"],
    vehicles: ["archwing", "necramech"],
  };
  const TYPE_LABELS = {
    warframe: "Warframes",
    primary: "Primary",
    secondary: "Secondary",
    melee: "Melee",
    archgun: "Archgun",
    archmelee: "Archmelee",
    "sentinel-weapon": "Companion weapons",
    sentinel: "Sentinels",
    beast: "Beasts",
    moa: "Moas",
    hound: "Hounds",
    archwing: "Archwings",
    necramech: "Necramechs",
  };

  function listOf(item) {
    if (item.list) return item.list;
    return item.type === "warframe" ? "warframes" : "weapons";
  }

  function capitalise(id) {
    return id.charAt(0).toUpperCase() + id.slice(1);
  }

  function listLabel(id) {
    return LIST_LABELS[id] || capitalise(id);
  }

  function typeLabel(type) {
    return TYPE_LABELS[type] || capitalise(String(type).replace(/-/g, " "));
  }

  // Split a list's rows into [{ id, label, rows }] by item type, known types first.
  function groupByType(listId, rows) {
    const byType = new Map();
    for (const r of rows) {
      const t = r.item.type || "other";
      if (!byType.has(t)) byType.set(t, []);
      byType.get(t).push(r);
    }
    const order = TYPE_ORDER[listId] || [];
    const ids = Array.from(byType.keys()).sort((a, b) => {
      const ia = order.indexOf(a);
      const ib = order.indexOf(b);
      return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || a.localeCompare(b);
    });
    return ids.map((id) => ({ id, label: typeLabel(id), rows: byType.get(id) }));
  }

  // Split evaluated rows into [{ id, label, rows, types }], known lists first, empty
  // lists omitted. `types` holds the type sub-groups (one entry means no sub-sections
  // are worth showing).
  function groupRows(rows) {
    const byId = new Map();
    for (const r of rows) {
      const id = listOf(r.item);
      if (!byId.has(id)) byId.set(id, []);
      byId.get(id).push(r);
    }
    const ids = Array.from(byId.keys()).sort((a, b) => {
      const ia = LIST_ORDER.indexOf(a);
      const ib = LIST_ORDER.indexOf(b);
      return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || a.localeCompare(b);
    });
    return ids.map((id) => ({ id, label: listLabel(id), rows: byId.get(id), types: groupByType(id, byId.get(id)) }));
  }

  return { xpForRank, rankFromXp, rankProgress, rulesFor, evaluateItem, parseProfile, summarize, OTHER_SOURCES, sanitizeOther, summarizeOther, listOf, listLabel, typeLabel, groupByType, groupRows };
});
