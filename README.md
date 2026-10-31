# Warframe Mastery Tracker

A static web page for tracking Warframe mastery rank progress. It runs entirely in the browser, so it can be hosted on GitHub Pages. Imported profile data is kept in `localStorage` and never leaves your machine.

Unofficial fan project. Warframe is a trademark of Digital Extremes.

## Hosting

In the repo settings, enable Pages and serve from the `main` branch, root folder.

## How it works

1. `data/items.json` holds the item list. It is meant to be generated from Digital Extremes' Public Export by a separate script (not included yet).
2. You fetch your own profile JSON while logged in at warframe.com and paste or upload it on the page.
3. The page works out per-item rank and mastery XP, your current mastery rank, and what rank you would reach with everything maxed.

You can also tick items by hand if you don't want to import a profile.

## `data/items.json` format

Either a bare array or an object with an `items` array:

```json
{
  "generatedAt": "2026-10-31T00:00:00Z",
  "items": [
    {
      "uniqueName": "/Lotus/Weapons/Tenno/Pistol/LATO",
      "name": "Lato",
      "type": "secondary",
      "masteryReq": 0
    }
  ]
}
```

| Field | Required | Notes |
| --- | --- | --- |
| `uniqueName` | yes | Must match `ItemType` in the profile's `XPInfo` |
| `name` | yes | Display name |
| `type` | no | `warframe`, `companion`, `archwing`, `necramech`, `vehicle` use the Warframe rules; anything else is treated as a weapon |
| `masteryReq` | no | Mastery rank needed to use the item |
| `maxRank` | no | Default 30 |
| `masteryRanks` | no | Ranks that award mastery, default 30 |
| `xpPerRank` | no | Override mastery XP per rank (default 100 for weapons, 200 for Warframe-like) |
| `affinityFactor` | no | Override affinity curve: rank is `floor(sqrt(xp / factor))` (default 500 for weapons, 1000 for Warframe-like) |

## Assumptions to verify

- Rank thresholds are `2500 * rank^2` up to rank 30, then 147,500 per Legendary rank.
- The profile JSON is expected to contain `XPInfo` entries (`ItemType`, `XP`), plus optional `DisplayName` and `PlayerLevel`, either at the top level or in `Results[0]`.
- XP from the star chart, intrinsics and similar sources isn't in the item list, so the page asks for it (and offers a lower-bound estimate from your reported rank).

## Tests

```
node --test test/mastery.test.js
```
