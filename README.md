# Solar Shift

A standalone Three.js solar-farm game. Open `solar-shift.html` through a local server:

```sh
python3 -m http.server 4174 --bind 127.0.0.1
```

Preview: http://127.0.0.1:4174/solar-shift.html
Internet access is required for the pinned Three.js CDN imports.

## Starting a farm and buying panels

New farms begin with **$300** and **zero installed racks**. Open **Shop (T)**, choose one of 48 fixed plots, optionally preview it, and select **Buy & install · $100**. Each purchase includes a clean starter rack with 24 solar panels. Empty plots have no panels, collision, dust, earnings, or sun-point production.

Walk near an installed rack to collect its earnings. Reinvest in additional racks, upgrades, and tools. Tool purchases unlock after the first rack is installed, so the starting investment cannot be spent entirely on tools before generating income. Early missions guide the first purchase, $40 of collected earnings, and expansion to three racks.

Existing players can use **Pause → Start a new farm → Reset this farm** to try the empty-field start. This intentionally clears their saved farm; continuing preserves it.

## Community progression

Press **C** or select **Community**. Generating electricity earns fictional sun points independently of collecting cash. Complete a care milestone and spend sun points to connect solar homes, a greenhouse, and a repair workshop. Connected buildings glow when the farm generates. After all three connections, repeatable community energy days cost progressively more sun points and award cash. Use **See the neighborhood** to focus the camera; **Map / Follow** returns to the player.

Sun points do not represent real kWh, household consumption, or avoided emissions. These are game mechanics, not impact estimates.

Dust now accumulates at one quarter of the previous rate. From completely clean to fully dusty requires 340–420 daylight seconds for starter racks, 500–580 for efficient racks, and 680–760 for premium racks. Dust pauses at night. Existing dust is preserved in saved games.

Browser saves retain the existing `solar-shift-v1` key and now use schema version 2, including plot ownership and community progress. Version 1 saves migrate with their original 48 racks owned; cash, tools, upgrades, existing community progress, and completed missions are preserved. Starter missions are marked complete during migration without granting duplicate rewards. Version 2 saves restore only purchased racks. Resetting starts an empty farm with $300 and clears community progress.

## Validation

```sh
node --test tests/game.test.mjs
```

Covers empty starts, purchases and rejected purchases, generation, slower dust, project rewards, save migration, and navigation before and after construction.
