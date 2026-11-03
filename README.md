# Warframe Mastery Tracker

Track your Warframe mastery rank progress: see which items you've mastered, how much mastery XP you have, and progress toward the next rank.

**Use it here: https://kapyrna.github.io/warframe-mastery-tracker/**

Nothing to install and no account needed. It works in any modern browser, on desktop or phone.

## How to use it

### 1. Find your account ID (not implemented yet, but planned to import your Tenno for any platform into this tracker)

If you're tracking manually and not importing from an active profile, skip to step 3.

1. Log in at [warframe.com](https://www.warframe.com).
2. Install the open-source **Warframe Account ID Grabber** extension for [Chrome](https://chromewebstore.google.com/detail/warframe-account-id-grabb/kjjjjdcjnanbbghoebnjnbjlkmmfaiga) or [Firefox](https://addons.mozilla.org/en-GB/firefox/addon/warframe-account-id-grabber/) ([source code](https://github.com/Sainan/warframe-account-id-grabber)) and open it. It shows your ID.

PC players can also find it in the `EE.log` file: search for `Logged in`, and the ID is in the brackets on that line.

### 2. Import your account (not implemented yet)

Open the importer section and paste in your account ID.  This should automagically pull the game data for your profile and update the tracker's page to reflect your progress.  Note that this is not you logging-in, as always only enter passwords where they belong on sites you trust.  Your cached game data stays in this browser session in JavaScript `localStorage` and never sent out to other servers.

### 3. Read your progress in Overview

- **Mastery rank** and a bar showing how close you are to the next rank
- **Items mastered** out of everything available that counts toward mastery
- **Item XP**, and **Other XP** as totals from the categories in the tracker

### 4. Check entries outside the arsenal, like Star Chart progress and Intrinsics

- **Intrinsics** is grouped by system and class for ease of tracking, each granting 1,500 mastery XP.
- **Star Chart** is grouped by region with the nodes and junction(s) for each region and a checkbox for both normal star chart and Steel Path.  Mastery XP is granted for both times of first clear, and only nodes that grant XP are listed to keep things tidy.

### 5. Work through your progress

The **Progress** section has expandable sections and sub-sections for **Warframes**, **Weapons**, **Companions** and **Vehicles**.  Weapons, Companions, and Vehicles are split further into expandable sections by type, and each section/subsection totals up all its listed entries.

If there's changes to imported in-game data, you can re-import or adjust manually with checkboxes.

Search filters are available at the top to help narrow down things by name, variants like Prime/Prisma/Vandal, and whether or not it's maxed.

The item lists are refreshed from Warframe's game data ([Public Export](https://wiki.warframe.com/w/Public_Export)), so new items should show up automatically after game updates.

## Light and dark mode

Toward the top is a three-position switch to change between Sol, Lua, and whatever your browser/system is set to.  This site defaults to your browser's setting but you can change your alignment manually.

## Your data and privacy

- Everything stays in your browser. Your profile data is never sent to a server.
- It's saved on this device so it's still there next time you visit. Clearing your browser's site data removes it, and it won't appear on your other devices.
- To keep a backup or move to another device, press **Download my progress** (not implemented yet), then import that file on the other device.
- **Clear saved data** removes everything the tracker has stored in this browser.

## The Disclaimers

- The tracker is only as accurate as the data it's given. Warframe's data sources are unofficial and could change, which may temporarily break importing or the item list.
- This is an unofficial fan project and is not affiliated with [Digital Extremes](https://www.digitalextremes.com).  [Warframe](https://www.warframe.com) is a trademark of Digital Extremes.
