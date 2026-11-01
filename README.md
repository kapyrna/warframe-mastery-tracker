# Warframe Mastery Tracker

Track your Warframe mastery rank progress: see which items you've mastered, how much mastery XP you have, and what rank you'd reach once everything is maxed.

**Use it here: https://kapyrna.github.io/warframe-mastery-tracker/**

Nothing to install and no account needed. It works in any modern browser, on desktop or phone.

## How to use it

### 1. Get your profile data

The tracker reads your own public profile data from Warframe. It can't log in for you, so you grab it yourself:

1. Log in at [warframe.com](https://www.warframe.com) and find your account ID on your account page.
2. Open your profile data address in a new tab. For PC it looks like this, with your ID in place of `YOUR_ACCOUNT_ID`:
   `https://api.warframe.com/cdn/getProfileViewingData.php?playerId=YOUR_ACCOUNT_ID`
   Console players use the equivalent address for their platform.
3. Copy everything on the page, or save it as a `.json` file.

### 2. Import it

Open the tracker and expand **Import and Export** (below Progress, closed until you open it), then either paste the data into the box and press **Import pasted JSON**, or press **Choose file** and pick the file you saved.

Until you've imported a profile, a hint at the top of the page points you here. It goes away once you import, or you can press **Wake up...** to dismiss it.

You'll see a confirmation with the number of items found. If you see an error instead, check that you copied the whole page.

### 3. Read your progress

- **Mastery rank** and a bar showing how close you are to the next rank.
- **Items mastered** out of everything that counts toward mastery.
- **Item XP**: the mastery XP you've earned from items.
- **If everything is maxed**: the rank you'd reach by maxing every item on the list.

### 4. Fill in Other sources

Your profile data only covers items. Mastery XP also comes from things that aren't items, so the **Other sources** section at the bottom of Progress lets you add it. The tracker doesn't read these from your profile, so you enter them yourself:

- **Star Chart** and **Steel Path Star Chart**: type in the mastery XP you've earned from each.
- **Drifter Intrinsics** (Riding, Combat, Opportunity, Endurance) and **Railjack Intrinsics** (Tactical, Piloting, Gunnery, Engineering, Command): pick your rank, from 0 to 10, for each skill. Each rank counts as 1,500 mastery XP.

Whatever you enter counts toward your rank at the top, and the **Other sources XP** figure shows the total.

If you've imported a profile, a note under the progress bar compares your total with the rank Warframe itself reports. If yours is lower, some XP is missing: either in Other sources, or in items the tracker doesn't list yet (Zaws, Kitguns, K-Drives, Moas and Hounds).

You can also tick any item by hand to mark it as mastered, for example if you'd rather not import a profile. Items mastered through your profile data are ticked automatically and can't be unticked.

### 5. Work through your Progress

The **Progress** section has one expandable list each for **Warframes**, **Weapons**, **Companions** and **Vehicles**. Click a list's heading to open or close it. Weapons, Companions and Vehicles are split further into expandable sections by type: Primary, Secondary, Melee, Archgun, Archmelee and Companion weapons; Sentinels and Beasts (Kubrows, Kavats, Vulpaphylas and Predasites); and Archwings and Necramechs. Every heading shows how many items you've mastered, with a small bar.

Inside each list you'll see every item with its type, the mastery rank needed to use it, your current rank, and your mastery XP for it. Tick the box beside an item to mark it as mastered.

Use the search box and filters above the lists to narrow things down by name, type or status (mastered or not). Searching opens any list that has a match, and Other sources steps aside while you search or filter. Sorting by **Most XP remaining** shows where the biggest gains are.

The item lists are refreshed automatically every day from Warframe's game data, so new Warframes, weapons and companions show up without you doing anything.

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

This is an unofficial fan project and is not affiliated with Digital Extremes. Warframe is a trademark of Digital Extremes.
