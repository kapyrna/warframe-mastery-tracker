(function () {
  "use strict";

  const STORAGE_KEY = "wf-mastery-tracker-v1";
  const DATA_URL = "data/items.json";
  const M = window.Mastery;

  const $ = (id) => document.getElementById(id);
  const fmt = (n) => Math.round(n).toLocaleString();
  const esc = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  let items = [];
  const openLists = new Set();
  let state = { version: 1, profile: null, manual: [], other: M.sanitizeOther(null), hintDismissed: false };

  // ---- persistence (localStorage can be blocked or empty; never rely on it) ----
  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const s = JSON.parse(raw);
      if (s && s.version === 1) {
        state = {
          version: 1,
          profile: s.profile || null,
          manual: Array.isArray(s.manual) ? s.manual : [],
          other: M.sanitizeOther(s.other),
          hintDismissed: s.hintDismissed === true,
        };
      }
    } catch (e) { /* ignore */ }
  }

  function saveState() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
  }

  // ---- messages ----
  function setMsg(el, text, kind) {
    el.textContent = text || "";
    el.className = "msg" + (kind ? " " + kind : "");
  }

  // ---- computation ----
  function compute() {
    const xpByItem = state.profile ? state.profile.xpByItem : {};
    const manual = new Set(state.manual);
    const other = M.summarizeOther(state.other);
    const summary = M.summarize(items, xpByItem, manual, other.total);
    return { summary, manual, other };
  }

  // ---- rendering ----
  function renderSummary(c) {
    const s = c.summary;
    $("player-name").textContent = state.profile && state.profile.displayName ? "· " + state.profile.displayName : "";
    $("stat-rank").textContent = "MR " + s.current.rank;
    $("stat-items").textContent = s.masteredCount + " / " + items.length;
    $("stat-xp").textContent = fmt(s.itemXp);
    $("stat-potential").textContent = "MR " + s.potential.rank;

    const pct = Math.round(s.current.pct);
    $("rank-bar").setAttribute("aria-valuenow", String(pct));
    $("rank-bar-fill").style.width = s.current.pct + "%";
    $("rank-caption").textContent =
      fmt(s.current.remaining) + " XP to MR " + (s.current.rank + 1) + " (" + pct + "% of this rank)";

    $("start-hint").hidden = !!state.profile || state.hintDismissed;
    $("stat-other").textContent = fmt(c.other.total);
    $("rank-note").textContent = rankNote(c);
  }

  // Compare against the rank Warframe itself reports, so people can tell whether
  // anything is still missing from their entries.
  function rankNote(c) {
    const reported = state.profile ? state.profile.reportedRank : null;
    if (reported == null) return "";
    const mine = c.summary.current.rank;
    if (mine === reported) return "This matches the rank your profile reports (MR " + reported + ").";
    if (mine < reported) {
      return "Your profile reports MR " + reported + ", so some mastery XP is missing here. It may be in Star Chart or Intrinsics, or in items this tracker does not list yet (Zaws, Kitguns, K-Drives, Moas, Hounds).";
    }
    return "Your profile reports MR " + reported + ", which is lower than this total. Check your Star Chart and Intrinsics entries and ticked items.";
  }

  function visibleRows(rows) {
    const q = $("search").value.trim().toLowerCase();
    const type = $("filter-type").value;
    const status = $("filter-status").value;
    let out = rows.filter((r) => {
      if (type && r.item.type !== type) return false;
      if (status === "done" && !r.mastered) return false;
      if (status === "todo" && r.mastered) return false;
      if (q && !r.item.name.toLowerCase().includes(q)) return false;
      return true;
    });
    const sort = $("sort").value;
    if (sort === "req") out.sort((a, b) => (a.item.masteryReq || 0) - (b.item.masteryReq || 0) || a.item.name.localeCompare(b.item.name));
    else if (sort === "remaining")
      out.sort((a, b) => b.maxMasteryXp - b.masteryXp - (a.maxMasteryXp - a.masteryXp) || a.item.name.localeCompare(b.item.name));
    else out.sort((a, b) => a.item.name.localeCompare(b.item.name));
    return out;
  }

  function rowHtml(r, manual) {
    const id = esc(r.item.uniqueName);
    const byHand = manual.has(r.item.uniqueName);
    const locked = r.mastered && !byHand;
    return (
      '<tr class="' + (r.mastered ? "done" : "") + '" data-type="' + esc(r.item.type) + '">' +
      '<td><input type="checkbox" data-id="' + id + '"' + (r.mastered ? " checked" : "") + (locked ? " disabled" : "") +
      ' aria-label="Mark ' + esc(r.item.name) + ' as mastered"></td>' +
      "<td>" + esc(r.item.name) + "</td>" +
      '<td class="num">' + (r.item.masteryReq != null ? esc(r.item.masteryReq) : "\u2013") + "</td>" +
      '<td class="num">' + r.rank + " / " + r.maxRank + "</td>" +
      '<td class="num">' + fmt(r.masteryXp) + " / " + fmt(r.maxMasteryXp) + "</td>" +
      "</tr>"
    );
  }

  const TABLE_HEAD =
    "<thead><tr>" +
    '<th scope="col"><span class="sr-only">Mastered</span></th>' +
    '<th scope="col">Item</th>' +
    '<th scope="col" class="num">MR req</th><th scope="col" class="num">Rank</th>' +
    '<th scope="col" class="num">Mastery XP</th></tr></thead>';

  function tableHtml(rows, manual) {
    return '<div class="table-wrap"><table>' + TABLE_HEAD + "<tbody>" + rows.map((r) => rowHtml(r, manual)).join("") + "</tbody></table></div>";
  }

  function detailsHtml(key, label, countText, pct, open, forced, inner, cls, slug) {
    return (
      '<details class="list' + (cls ? " " + cls : "") + '" data-key="' + esc(key) + '" data-forced="' + (forced ? "1" : "0") + '"' + (open ? " open" : "") + ">" +
      "<summary>" +
      '<span class="list-name">' + esc(label) + "</span>" +
      '<span class="list-count" id="cnt-' + esc(slug || key.replace(/\W+/g, "-")) + '">' + esc(countText) + "</span>" +
      (pct == null
        ? ""
        : '<span class="mini-bar" role="img" aria-label="' + pct + '% complete"><span id="bar-' + esc(slug || key.replace(/\W+/g, "-")) + '" style="width:' + pct + '%"></span></span>') +
      "</summary>" + inner + "</details>"
    );
  }

  function sectionHtml(key, label, allRows, visible, forced, inner, cls) {
    const done = allRows.filter((r) => r.mastered).length;
    const pct = allRows.length ? Math.round((done / allRows.length) * 100) : 0;
    return detailsHtml(key, label, done + " / " + allRows.length, pct, forced || openLists.has(key), forced, inner, cls);
  }

  // ---- other sources: Star Chart (Normal, Steel Path) and Intrinsics (Drifter, Railjack) ----
  const slugOf = (key) => key.replace(/\W+/g, "-");
  const pctOf = (n, max) => (max ? Math.round((n / max) * 100) : 0);

  // Works for a single source and for a group of them.
  function otherCount(x) {
    return x.kind === "ranks" ? x.rank + " / " + x.maxRank + " ranks \u00b7 " + fmt(x.xp) + " XP" : fmt(x.xp) + " XP";
  }
  const otherPct = (x) => (x.kind === "ranks" ? pctOf(x.rank, x.maxRank) : null);

  function otherSourceHtml(src, groupId) {
    const key = "other/" + groupId + "/" + src.id;
    let inner;
    if (src.kind === "xp") {
      inner =
        '<div class="other-row"><label for="xp-' + esc(src.id) + '">Mastery XP earned</label>' +
        '<input type="number" class="xp-input" id="xp-' + esc(src.id) + '" data-other-xp="' + esc(src.id) + '" min="0" step="1" inputmode="numeric" placeholder="0"' +
        (src.xp ? ' value="' + src.xp + '"' : "") + "></div>";
    } else {
      inner =
        '<div class="table-wrap"><table><thead><tr><th scope="col">Skill</th><th scope="col">Rank</th><th scope="col" class="num">Mastery XP</th></tr></thead><tbody>' +
        src.skills
          .map((k) => {
            const opts = [];
            for (let r = 0; r <= k.maxRank; r++) opts.push('<option value="' + r + '"' + (r === k.rank ? " selected" : "") + ">" + r + "</option>");
            return (
              "<tr><td>" + esc(k.label) + "</td>" +
              '<td><select data-other-rank="' + esc(k.key) + '" aria-label="' + esc(src.fullLabel + " " + k.label + " rank") + '">' + opts.join("") + "</select></td>" +
              '<td class="num" id="xp-' + esc(slugOf(k.key)) + '">' + fmt(k.xp) + "</td></tr>"
            );
          })
          .join("") +
        "</tbody></table></div>";
    }
    return detailsHtml(key, src.label, otherCount(src), otherPct(src), openLists.has(key), false, inner, "sub", slugOf(key));
  }

  function otherGroupHtml(g) {
    const key = "other/" + g.id;
    const inner = '<div class="sublists">' + g.sources.map((src) => otherSourceHtml(src, g.id)).join("") + "</div>";
    return detailsHtml(key, g.label, otherCount(g), otherPct(g), openLists.has(key), false, inner, "", slugOf(key));
  }

  // Star Chart and Intrinsics are top-level categories beside the item lists;
  // the Overview still adds them up as "Other sources XP".
  function renderOther(o) {
    $("other-sources").innerHTML = o.groups.map(otherGroupHtml).join("");
  }

  // Update numbers in place while someone is typing, so inputs keep their focus.
  function updateOtherView() {
    const o = M.summarizeOther(state.other);
    for (const g of o.groups) {
      const gslug = slugOf("other/" + g.id);
      $("cnt-" + gslug).textContent = otherCount(g);
      if (g.kind === "ranks") $("bar-" + gslug).style.width = pctOf(g.rank, g.maxRank) + "%";
      for (const src of g.sources) {
        const slug = slugOf("other/" + g.id + "/" + src.id);
        $("cnt-" + slug).textContent = otherCount(src);
        if (src.kind === "ranks") {
          $("bar-" + slug).style.width = pctOf(src.rank, src.maxRank) + "%";
          for (const k of src.skills) $("xp-" + slugOf(k.key)).textContent = fmt(k.xp);
        }
      }
    }
    renderSummary(compute());
  }

  // One expandable section per list. A list with more than one type (weapons,
  // companions, vehicles) holds an expandable sub-section per type. Counts in the
  // headers always cover everything; the tables respect the search and filters.
  // While searching, sections with matches open so results are not hidden.
  function renderLists(c) {
    const searching = $("search").value.trim() !== "";
    let shown = 0;
    $("lists").innerHTML = M.groupRows(c.summary.rows)
      .map((g) => {
        const visible = visibleRows(g.rows);
        shown += visible.length;
        const forced = searching && visible.length > 0;
        let inner;
        if (!visible.length) {
          inner = '<p class="muted small empty">No items match the current filters.</p>';
        } else if (g.types.length > 1) {
          inner =
            '<div class="sublists">' +
            g.types
              .map((t) => {
                const vis = visibleRows(t.rows);
                if (!vis.length) return "";
                return sectionHtml(g.id + "/" + t.id, t.label, t.rows, vis, searching, tableHtml(vis, c.manual), "sub");
              })
              .join("") +
            "</div>";
        } else {
          inner = tableHtml(visible, c.manual);
        }
        return sectionHtml(g.id, g.label, g.rows, visible, forced, inner, "");
      })
      .join("");
    $("count").textContent = items.length ? "Showing " + shown + " of " + items.length + " items" : "";
    // Search and filters are about items, so Star Chart and Intrinsics step aside while they are in use.
    $("other-sources").hidden = searching || $("filter-type").value !== "" || $("filter-status").value !== "";
  }

  function renderAll() {
    const c = compute();
    renderSummary(c);
    renderLists(c);
    renderOther(c.other);
  }

  function fillTypeFilter() {
    const rows = M.summarize(items, {}, [], 0).rows;
    const seen = new Set();
    const options = [];
    for (const g of M.groupRows(rows)) {
      for (const t of g.types) {
        if (seen.has(t.id)) continue;
        seen.add(t.id);
        options.push('<option value="' + esc(t.id) + '">' + esc(t.label) + "</option>");
      }
    }
    $("filter-type").innerHTML = '<option value="">All types</option>' + options.join("");
  }

  // ---- importing ----
  function importText(text) {
    let json;
    try { json = JSON.parse(text); } catch (e) { return setMsg($("import-msg"), "That is not valid JSON.", "error"); }

    // A file previously downloaded from this page restores everything.
    if (json && json.version === 1 && Array.isArray(json.manual)) {
      state = {
        version: 1,
        profile: json.profile || null,
        manual: json.manual,
        other: M.sanitizeOther(json.other),
        hintDismissed: state.hintDismissed || json.hintDismissed === true,
      };
      saveState();
      renderAll();
      return setMsg($("import-msg"), "Restored your saved progress.", "ok");
    }

    try {
      const profile = M.parseProfile(json);
      state.profile = profile;
      saveState();
      renderAll();
      const n = Object.keys(profile.xpByItem).length;
      setMsg($("import-msg"), "Imported " + n + " items with XP" + (profile.displayName ? " for " + profile.displayName : "") + ".", "ok");
    } catch (e) {
      setMsg($("import-msg"), e.message, "error");
    }
  }

  function download() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "warframe-mastery-progress.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  // ---- events ----
  function bind() {
    // Warframe's server does not allow other sites to read the profile, so the
    // page cannot fetch it. Opening it in a new tab lets the person copy it.
    $("btn-fetch").addEventListener("click", () => {
      const id = $("player-id").value.trim();
      if (!/^[0-9a-f]{24}$/i.test(id)) return setMsg($("import-msg"), "An account ID is 24 letters and digits, like 505875fb1a4d80894a000000.", "error");
      const url = "https://" + $("platform").value + ".warframe.com/cdn/getProfileViewingData.php?playerId=" + encodeURIComponent(id);
      window.open(url, "_blank", "noopener");
      setMsg($("import-msg"), "Opened your profile data in a new tab. Copy everything on that page, then paste it below.", "ok");
    });
    $("btn-parse").addEventListener("click", () => {
      const text = $("paste").value.trim();
      if (!text) return setMsg($("import-msg"), "Paste some JSON first.", "error");
      importText(text);
    });

    $("file").addEventListener("change", (e) => {
      const f = e.target.files[0];
      if (!f) return;
      const reader = new FileReader();
      reader.onload = () => importText(String(reader.result));
      reader.onerror = () => setMsg($("import-msg"), "Could not read that file.", "error");
      reader.readAsText(f);
      e.target.value = "";
    });

    $("btn-export").addEventListener("click", download);

    $("hint-dismiss").addEventListener("click", () => {
      state.hintDismissed = true;
      saveState();
      renderSummary(compute());
    });

    $("btn-clear").addEventListener("click", () => {
      if (!confirm("Remove your imported profile and ticked items from this browser?")) return;
      state = { version: 1, profile: null, manual: [], other: M.sanitizeOther(null), hintDismissed: false };
      try { localStorage.removeItem(STORAGE_KEY); } catch (e) { /* ignore */ }
      $("paste").value = "";
      renderAll();
      setMsg($("import-msg"), "Saved data cleared.", "ok");
    });

    ["search", "filter-type", "filter-status", "sort"].forEach((id) =>
      $(id).addEventListener(id === "search" ? "input" : "change", () => renderLists(compute()))
    );

    // toggle does not bubble, so listen in the capture phase.
    const onToggle = (e) => {
      const d = e.target;
      if (!(d instanceof HTMLDetailsElement) || d.dataset.forced === "1") return;
      if (d.open) openLists.add(d.dataset.key);
      else openLists.delete(d.dataset.key);
    };
    $("lists").addEventListener("toggle", onToggle, true);
    $("other-sources").addEventListener("toggle", onToggle, true);

    const onOtherEdit = (e) => {
      const d = e.target && e.target.dataset;
      if (!d) return;
      const next = M.sanitizeOther(state.other);
      if (d.otherXp) {
        const v = String(e.target.value).trim();
        if (v === "") delete next.xp[d.otherXp];
        else next.xp[d.otherXp] = Number(v);
      } else if (d.otherRank) {
        next.ranks[d.otherRank] = Number(e.target.value);
      } else {
        return;
      }
      state.other = M.sanitizeOther(next);
      saveState();
      updateOtherView();
    };
    $("other-sources").addEventListener("input", onOtherEdit);
    $("other-sources").addEventListener("change", onOtherEdit);

    $("lists").addEventListener("change", (e) => {
      const box = e.target;
      if (!(box instanceof HTMLInputElement) || !box.dataset.id) return;
      const set = new Set(state.manual);
      if (box.checked) set.add(box.dataset.id);
      else set.delete(box.dataset.id);
      state.manual = Array.from(set);
      saveState();
      renderAll();
    });
  }

  // ---- data ----
  async function loadItems() {
    try {
      const res = await fetch(DATA_URL, { cache: "no-cache" });
      if (!res.ok) throw new Error("HTTP " + res.status);
      const json = await res.json();
      const list = Array.isArray(json) ? json : json.items;
      if (!Array.isArray(list)) throw new Error("unexpected format");
      items = list.filter((i) => i && typeof i.uniqueName === "string" && typeof i.name === "string").map((i) => ({ ...i, type: i.type || "other" }));
      if (!Array.isArray(json) && json.generatedAt) $("generated").textContent = "Item data generated " + json.generatedAt + ".";
      if (!items.length) setMsg($("data-msg"), "The item list is empty.", "error");
    } catch (e) {
      items = [];
      setMsg($("data-msg"), "Item data is not available yet (" + e.message + "). Run the data updater to generate " + DATA_URL + ".", "error");
    }
  }

  async function init() {
    loadState();
    bind();
    await loadItems();
    fillTypeFilter();
    renderAll();
  }

  init();
})();
