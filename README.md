# Warframe Mastery Tracker

Track your Warframe mastery rank progress: see which items you've mastered, how much mastery XP you have, and what rank you'd reach once everything is maxed.

**Use it here: https://kapyrna.github.io/warframe-mastery-tracker/**

Nothing to install and no account needed. It works in any modern browser, on desktop or phone.

## How to use it

### 1. Find your account ID

The tracker reads your own public profile data from Warframe. You only need your account ID (24 letters and digits, like `505875fb1a4d80894a000000`):

1. Log in at [warframe.com](https://www.warframe.com).
2. Install the open-source **Warframe Account ID Grabber** extension for [Chrome](https://chromewebstore.google.com/detail/warframe-account-id-grabb/kjjjjdcjnanbbghoebnjnbjlkmmfaiga) or [Firefox](https://addons.mozilla.org/en-GB/firefox/addon/warframe-account-id-grabber/) ([source code](https://github.com/Sainan/warframe-account-id-grabber)) and open it. It shows your ID.

PC players can also find it in the `EE.log` file: search for `Logged in`, and the ID is in the brackets on that line.

### 2. Import it

Open the tracker and expand **Import and Export** (below Progress, closed until you open it). Type your account ID, choose your platform and press **Open profile data**. Your profile opens in a new tab as a page of text. Copy everything on it, come back, paste it into the box and press **Import pasted JSON**. You can also save that page as a `.json` file and press **Choose file**.

Warframe doesn't allow other websites to read profile data directly, which is why the copy-and-paste step is needed. Your ID and profile stay in your browser.

Until you've imported a profile, a hint at the top of the page points you here. It goes away once you import, or you can press **Wake up...** to dismiss it.

You'll see a confirmation with the number of items found. If you see an error instead, check that the ID is right and that you copied the whole page.

### 3. Read your progress

- **Mastery rank** and a bar showing how close you are to the next rank.
- **Items mastered** out of everything that counts toward mastery.
- **Item XP**: the mastery XP you've earned from items.
- **If everything is maxed**: the rank you'd reach by maxing every item on the list.

### 4. Fill in Star Chart and Intrinsics

Your profile data only covers items. Mastery XP also comes from things that aren't items, so **Star Chart** and **Intrinsics** at the bottom of Progress let you add it. The tracker doesn't read these from your profile, so you enter them yourself:

- **Star Chart**, split into **Normal** and **Steel Path**: type in the mastery XP you've earned from each.
- **Intrinsics**, split into **Drifter** (Riding, Combat, Opportunity, Endurance) and **Railjack** (Tactical, Piloting, Gunnery, Engineering, Command): pick your rank, from 0 to 10, for each skill. Each rank counts as 1,500 mastery XP.

When you import a profile, your intrinsic ranks are filled in for you from it (you can still change them). Whatever you enter counts toward your rank at the top, and the **Other sources XP** figure at the top shows the combined total.

If you've imported a profile, a note under the progress bar compares your total with the rank Warframe itself reports. If yours is lower, some XP is missing: either in Star Chart or Intrinsics, or in items the tracker doesn't list yet (Zaws, Kitguns, K-Drives, Moas and Hounds).

You can also tick any item by hand to mark it as mastered, for example if you'd rather not import a profile. Items mastered through your profile data are ticked automatically and can't be unticked.

### 5. Work through your Progress

The **Progress** section has one expandable list each for **Warframes**, **Weapons**, **Companions** and **Vehicles**. Click a list's heading to open or close it. Weapons, Companions and Vehicles are split further into expandable sections by type: Primary, Secondary, Melee, Archgun, Archmelee and Companion weapons; Sentinels and Beasts (Kubrows, Kavats, Vulpaphylas and Predasites); and Archwings and Necramechs. Every heading shows how many items you've mastered out of the total, with a small bar.

Inside each list you'll see every item with the mastery rank needed to use it, your current rank, and your mastery XP for it. Tick the box beside an item to mark it as mastered.

Use the search box and filters above the lists to narrow things down by name, type or status (mastered or not). Searching opens any list that has a match, and Star Chart and Intrinsics step aside while you search or filter. Sorting by **Most XP remaining** shows where the biggest gains are.

The item lists are refreshed automatically every day from Warframe's game data, so new Warframes, weapons and companions show up without you doing anything.

## Light and dark mode

Under the title there's a three-position switch. The sun is light mode, the moon is dark mode, and the middle position (shown as an icon for your operating system) follows your device or browser setting, which is the default. Your choice is saved in this browser.

## Your data and privacy

- Everything stays in your browser. Your profile data is never sent to a server.
- It's saved on this device so it's still there next time you visit. Clearing your browser's site data removes it, and it won't appear on your other devices.
- To keep a backup or move to another device, press **Download my progress** (it includes your Other sources entries), then import that file on the other device.
- **Clear saved data** removes everything the tracker has stored in this browser.

## Good to know

- Mastery XP counts the first 30 ranks of each item, even for items that go higher, and each item counts once however many copies you own.
- Ranks above 30 are the Legendary ranks.
- The tracker is only as accurate as the data it's given. Warframe's data sources are unofficial and could change, which may temporarily break importing or the item list.

---

This is an unofficial fan project and is not affiliated with Digital Extremes.
Warframe is a trademark of Digital Extremes.
