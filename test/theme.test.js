const test = require("node:test");
const assert = require("node:assert/strict");
const T = require("../js/theme.js");

const UA = {
  windows: { userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36", platform: "Win32" },
  mac: { userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15", platform: "MacIntel", maxTouchPoints: 0 },
  ipadAsMac: { userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/17.0 Safari/605.1.15", platform: "MacIntel", maxTouchPoints: 5 },
  iphone: { userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1", platform: "iPhone" },
  android: { userAgent: "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/130.0 Mobile Safari/537.36", platform: "Linux armv81" },
  linux: { userAgent: "Mozilla/5.0 (X11; Linux x86_64; rv:130.0) Gecko/20100101 Firefox/130.0", platform: "Linux x86_64" },
  chromeos: { userAgent: "Mozilla/5.0 (X11; CrOS x86_64 14541.0.0) AppleWebKit/537.36 Chrome/130.0 Safari/537.36", platform: "Linux x86_64" },
};

test("detects the operating system from the user agent", () => {
  assert.equal(T.detectOs(UA.windows), "windows");
  assert.equal(T.detectOs(UA.mac), "apple");
  assert.equal(T.detectOs(UA.ipadAsMac), "apple");
  assert.equal(T.detectOs(UA.iphone), "apple");
  assert.equal(T.detectOs(UA.android), "android"); // not mistaken for Linux
  assert.equal(T.detectOs(UA.linux), "linux");
  assert.equal(T.detectOs(UA.chromeos), "chromeos"); // not mistaken for Linux
});

test("prefers the client-hints platform when present", () => {
  for (const [platform, expected] of [["Windows", "windows"], ["macOS", "apple"], ["Android", "android"], ["Chrome OS", "chromeos"], ["Linux", "linux"], ["iOS", "apple"]]) {
    assert.equal(T.detectOs({ userAgentData: { platform }, userAgent: "", platform: "" }), expected, platform);
  }
});

test("unknown or missing navigator falls back to a generic computer", () => {
  assert.equal(T.detectOs({}), "other");
  assert.equal(T.detectOs(null), "other");
  assert.equal(T.detectOs({ userAgent: "SomethingNew/1.0", platform: "Plan9" }), "other");
  assert.equal(T.glyphFor("system", "other"), "🖥");
  assert.equal(T.glyphFor("system", "never-heard-of-it"), "🖥");
});

test("glyphs: sun for light, moon for dark, an OS icon for system", () => {
  assert.equal(T.glyphFor("light", "windows"), "☉");
  assert.equal(T.glyphFor("dark", "windows"), "☽");
  const os = ["apple", "windows", "android", "linux", "chromeos", "other"].map((o) => T.glyphFor("system", o));
  assert.equal(new Set(os).size, os.length, "every system gets its own glyph");
  assert.equal(T.glyphFor("system", "apple"), "");
});

test("normalize only accepts the three positions", () => {
  assert.deepEqual(T.CHOICES, ["light", "system", "dark"]);
  for (const c of T.CHOICES) assert.equal(T.normalize(c), c);
  for (const junk of [undefined, null, "", "blue", "DARK", 3, {}]) assert.equal(T.normalize(junk), "system");
});

test("stored choice survives, and blocked or broken storage is harmless", () => {
  const mem = new Map();
  const storage = { getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => mem.set(k, v) };
  assert.equal(T.readStored(storage), "system");
  T.writeStored(storage, "dark");
  assert.equal(T.readStored(storage), "dark");
  mem.set(T.STORAGE_KEY, "garbage");
  assert.equal(T.readStored(storage), "system");
  const throwing = { getItem() { throw new Error("blocked"); }, setItem() { throw new Error("blocked"); } };
  assert.equal(T.readStored(throwing), "system");
  assert.doesNotThrow(() => T.writeStored(throwing, "dark"));
  assert.equal(T.readStored(null), "system");
  assert.doesNotThrow(() => T.writeStored(null, "dark"));
});

test("apply sets or removes the override", () => {
  const attrs = new Map();
  const el = { setAttribute: (k, v) => attrs.set(k, v), removeAttribute: (k) => attrs.delete(k) };
  T.apply("dark", el); assert.equal(attrs.get("data-theme"), "dark");
  T.apply("light", el); assert.equal(attrs.get("data-theme"), "light");
  T.apply("system", el); assert.equal(attrs.has("data-theme"), false);
  assert.doesNotThrow(() => T.apply("dark", null));
});

function fakeDoc(readyState) {
  const attrs = new Map();
  const make = (value) => ({ value, checked: false, listeners: {}, addEventListener(t, f) { this.listeners[t] = f; } });
  const radios = [make("light"), make("system"), make("dark")];
  const glyph = { textContent: "" };
  const doc = {
    readyState,
    radios, glyph, attrs,
    documentElement: { setAttribute: (k, v) => attrs.set(k, v), removeAttribute: (k) => attrs.delete(k) },
    querySelectorAll: () => radios,
    getElementById: (id) => (id === "theme-system-glyph" ? glyph : null),
    addEventListener(type, f) { if (type === "DOMContentLoaded") this.ready = f; },
  };
  return doc;
}

test("init applies the saved theme immediately and wires the toggle once the page is ready", () => {
  const mem = new Map([[T.STORAGE_KEY, "dark"]]);
  const storage = { getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => mem.set(k, v) };
  const doc = fakeDoc("loading");
  const handle = T.init({ document: doc, navigator: UA.windows, storage });
  assert.equal(doc.attrs.get("data-theme"), "dark", "applied before the body exists");
  assert.equal(handle.choice, "dark");
  assert.equal(doc.glyph.textContent, "", "toggle not touched until the page is ready");
  doc.ready();
  assert.deepEqual(doc.radios.map((r) => r.checked), [false, false, true]);
  assert.equal(doc.glyph.textContent, "⊞");

  doc.radios[0].checked = true; doc.radios[0].listeners.change();
  assert.equal(doc.attrs.get("data-theme"), "light");
  assert.equal(mem.get(T.STORAGE_KEY), "light");
  doc.radios[1].checked = true; doc.radios[1].listeners.change();
  assert.equal(doc.attrs.has("data-theme"), false, "system removes the override");
  assert.equal(mem.get(T.STORAGE_KEY), "system");
  assert.equal(handle.choice, "system");
  // a change event for an unchecked radio is ignored
  doc.radios[2].checked = false; doc.radios[2].listeners.change();
  assert.equal(mem.get(T.STORAGE_KEY), "system");
});

test("init works when the page is already loaded, and without storage", () => {
  const doc = fakeDoc("complete");
  const handle = T.init({ document: doc, navigator: UA.iphone, storage: null });
  assert.equal(handle.choice, "system");
  assert.deepEqual(doc.radios.map((r) => r.checked), [false, true, false]);
  assert.equal(doc.glyph.textContent, "");
  assert.equal(T.init({ document: null }), null);
});
