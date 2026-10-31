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
  let state = { version: 1, profile: null, manual: [], otherXp: null };

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
          otherXp: Number.isFinite(s.otherXp) ? s.otherXp : null,
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
    const base = M.summarize(items, xpByItem, manual, 0);
    const estimated = state.profile ? M.estimateOtherXp(state.profile.reportedRank, base.itemXp) : 0;
    const otherXp = state.otherXp == null ? estimated : state.otherXp;
    const summary = M.summarize(items, xpByItem, manual, otherXp);
    return { summary, manual, estimated, usingEstimate: state.otherXp == null };
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

    const input = $("other-xp");
    if (document.activeElement !== input) input.value = c.usingEstimate ? "" : String(state.otherXp);
    input.placeholder = c.usingEstimate ? fmt(c.estimated) + " (estimate)" : "auto";
    $("other-xp-note").textContent = c.usingEstimate
      ? state.profile && state.profile.reportedRank != null
        ? "Estimated from your reported rank (a lower bound). Enter your real figure for exact projections."
        : "Import a profile for an estimate, or enter your own figure."
      : "Using your figure. Clear the box or press the button to go back to the estimate.";
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

  function renderTable(c) {
    const rows = visibleRows(c.summary.rows);
    $("count").textContent = items.length ? "Showing " + rows.length + " of " + items.length + " items" : "";
    $("rows").innerHTML = rows
      .map((r) => {
        const id = esc(r.item.uniqueName);
        const byHand = c.manual.has(r.item.uniqueName);
        const locked = r.mastered && !byHand;
        return (
          '<tr class="' + (r.mastered ? "done" : "") + '">' +
          '<td><input type="checkbox" data-id="' + id + '"' + (r.mastered ? " checked" : "") + (locked ? " disabled" : "") +
          ' aria-label="Mark ' + esc(r.item.name) + ' as mastered"></td>' +
          "<td>" + esc(r.item.name) + "</td>" +
          "<td>" + esc(r.item.type) + "</td>" +
          '<td class="num">' + (r.item.masteryReq != null ? esc(r.item.masteryReq) : "–") + "</td>" +
          '<td class="num">' + r.rank + " / " + r.maxRank + "</td>" +
          '<td class="num">' + fmt(r.masteryXp) + " / " + fmt(r.maxMasteryXp) + "</td>" +
          "</tr>"
        );
      })
      .join("");
  }

  function renderAll() {
    const c = compute();
    renderSummary(c);
    renderTable(c);
  }

  function fillTypeFilter() {
    const types = Array.from(new Set(items.map((i) => i.type))).sort();
    $("filter-type").innerHTML =
      '<option value="">All types</option>' + types.map((t) => '<option value="' + esc(t) + '">' + esc(t) + "</option>").join("");
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
        otherXp: Number.isFinite(json.otherXp) ? json.otherXp : null,
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

    $("btn-clear").addEventListener("click", () => {
      if (!confirm("Remove your imported profile and ticked items from this browser?")) return;
      state = { version: 1, profile: null, manual: [], otherXp: null };
      try { localStorage.removeItem(STORAGE_KEY); } catch (e) { /* ignore */ }
      $("paste").value = "";
      renderAll();
      setMsg($("import-msg"), "Saved data cleared.", "ok");
    });

    $("other-xp").addEventListener("input", (e) => {
      const v = e.target.value.trim();
      state.otherXp = v === "" ? null : Math.max(0, Math.floor(Number(v)) || 0);
      saveState();
      renderSummary(compute());
    });

    $("other-xp-auto").addEventListener("click", () => {
      state.otherXp = null;
      $("other-xp").value = "";
      saveState();
      renderSummary(compute());
    });

    ["search", "filter-type", "filter-status", "sort"].forEach((id) =>
      $(id).addEventListener(id === "search" ? "input" : "change", () => renderTable(compute()))
    );

    $("rows").addEventListener("change", (e) => {
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
