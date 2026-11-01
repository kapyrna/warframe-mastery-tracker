/*
 * Light / system / dark theme choice. Loaded in <head> so the saved choice is
 * applied before the first paint. "system" simply leaves the page to follow the
 * browser's own setting, so it needs no JavaScript beyond removing the override.
 *
 * Runs in the browser (window.Theme) and in Node (module.exports) for tests.
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else {
    root.Theme = factory();
    root.Theme.init({
      document: root.document,
      navigator: root.navigator,
      storage: (function () {
        try { return root.localStorage; } catch (e) { return null; }
      })(),
    });
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  const STORAGE_KEY = "wf-mastery-theme-v1";
  const CHOICES = ["light", "system", "dark"];

  // U+2609 SUN, U+263D FIRST QUARTER MOON.
  const SUN = "☉";
  const MOON = "☽";

  // The "system" position shows a glyph for the detected operating system.
  // Apple has no standard Unicode logo: U+F8FF is the Apple logo on Apple devices,
  // which is the only place it is shown. Other systems use the nearest stand-in.
  const OS_GLYPHS = {
    apple: "",
    windows: "⊞", // SQUARED PLUS
    android: "🤖", // ROBOT FACE
    linux: "🐧", // PENGUIN
    chromeos: "💻", // LAPTOP
    other: "🖥", // DESKTOP COMPUTER
  };

  function detectOs(nav) {
    nav = nav || {};
    const hinted = nav.userAgentData && nav.userAgentData.platform;
    const platform = String(hinted || nav.platform || "").toLowerCase();
    const ua = String(nav.userAgent || "").toLowerCase();
    const probe = platform + " " + ua;
    if (/iphone|ipad|ipod|\bios\b/.test(probe)) return "apple";
    if (/android/.test(probe)) return "android"; // before linux: Android reports Linux too
    if (/cros|chrome ?os/.test(probe)) return "chromeos"; // before linux for the same reason
    if (/\bwin(32|64|dows)?\b/.test(probe)) return "windows";
    if (/mac|darwin/.test(probe)) return "apple"; // includes iPadOS posing as a Mac
    if (/linux|x11/.test(probe)) return "linux";
    return "other";
  }

  function glyphFor(choice, os) {
    if (choice === "light") return SUN;
    if (choice === "dark") return MOON;
    return OS_GLYPHS[os] || OS_GLYPHS.other;
  }

  function normalize(choice) {
    return CHOICES.indexOf(choice) >= 0 ? choice : "system";
  }

  function readStored(storage) {
    try { return normalize(storage && storage.getItem(STORAGE_KEY)); } catch (e) { return "system"; }
  }

  function writeStored(storage, choice) {
    try { if (storage) storage.setItem(STORAGE_KEY, choice); } catch (e) { /* storage can be blocked */ }
  }

  // "system" removes the override so the stylesheet follows the browser setting.
  function apply(choice, rootEl) {
    if (!rootEl) return;
    if (choice === "light" || choice === "dark") rootEl.setAttribute("data-theme", choice);
    else rootEl.removeAttribute("data-theme");
  }

  function init(env) {
    const doc = env.document;
    if (!doc) return null;
    let choice = readStored(env.storage);
    apply(choice, doc.documentElement);

    function bind() {
      const radios = Array.prototype.slice.call(doc.querySelectorAll('input[name="theme"]'));
      if (!radios.length) return;
      const systemGlyph = doc.getElementById("theme-system-glyph");
      if (systemGlyph) systemGlyph.textContent = glyphFor("system", detectOs(env.navigator));
      radios.forEach(function (radio) {
        radio.checked = radio.value === choice;
        radio.addEventListener("change", function () {
          if (!radio.checked) return;
          choice = normalize(radio.value);
          writeStored(env.storage, choice);
          apply(choice, doc.documentElement);
        });
      });
    }

    if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", bind);
    else bind();

    return { get choice() { return choice; } };
  }

  return { STORAGE_KEY, CHOICES, detectOs, glyphFor, normalize, readStored, writeStored, apply, init };
});
