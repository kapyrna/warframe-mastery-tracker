# Warframe Mastery Tracker

Track your Warframe mastery rank progress: see which items you've mastered, how much mastery XP you have, and what rank you'd reach once everything is maxed.

**Use it here: https://kapyrna.github.io/warframe-mastery-tracker/**

Nothing to install and no account needed. It works in any modern browser, on desktop or phone.

> **Current status:** the item list is still being added. Until it appears, the page shows a notice instead of items, and your rank figures won't be meaningful yet. Check back soon.

## How to use it

### 1. Get your profile data

The tracker reads your own public profile data from Warframe. It can't log in for you, so you grab it yourself:

1. Log in at [warframe.com](https://www.warframe.com) and find your account ID on your account page.
2. Open your profile data address in a new tab. For PC it looks like this, with your ID in place of `YOUR_ACCOUNT_ID`:
   `https://api.warframe.com/cdn/getProfileViewingData.php?playerId=YOUR_ACCOUNT_ID`
   Console players use the equivalent address for their platform.
3. Copy everything on the page, or save it as a `.json` file.

### 2. Import it

Open the tracker, expand **Import your progress**, then either paste the data into the box and press **Import pasted JSON**, or press **Choose file** and pick the file you saved.

You'll see a confirmation with the number of items found. If you see an error instead, check that you copied the whole page.

### 3. Read your progress

- **Mastery rank** and a bar showing how close you are to the next rank.
- **Items mastered** out of everything that counts toward mastery.
- **Item XP**: the mastery XP you've earned from items.
- **If everything is maxed**: the rank you'd reach by maxing every item on the list.

### 4. Fill in the gaps

Your profile data only covers items. Mastery XP also comes from the star chart, intrinsics and other sources, so the tracker asks for that figure. It starts with an estimate worked out from your current rank, which is a minimum. If you know your real number, type it in for more accurate projections. **Use estimate** switches back.

You can also tick any item by hand to mark it as mastered, for example if you'd rather not import a profile. Items mastered through your profile data are ticked automatically and can't be unticked.

### 5. Find what to level next

Use the search box and the filters above the table to narrow the list by name, type or status (mastered or not). Sorting by **Most XP remaining** shows where the biggest gains are.

## Your data and privacy

- Everything stays in your browser. Your profile data is never sent to a server.
- It's saved on this device so it's still there next time you visit. Clearing your browser's site data removes it, and it won't appear on your other devices.
- To keep a backup or move to another device, press **Download my progress**, then import that file on the other device.
- **Clear saved data** removes everything the tracker has stored in this browser.

## Good to know

- Mastery XP counts the first 30 ranks of each item, even for items that go higher, and each item counts once however many copies you own.
- Ranks above 30 are the Legendary ranks.
- The tracker is only as accurate as the data it's given. Warframe's data sources are unofficial and could change, which may temporarily break importing or the item list.

---

This is an unofficial fan project and is not affiliated with Digital Extremes. Warframe is a trademark of Digital Extremes.
