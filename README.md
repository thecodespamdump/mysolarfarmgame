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

Browser saves retain the existing `solar-shift-v1` key and now use schema version 3, including plot ownership, worker roles and levels, repeatable missions, and community progress. Version 1 saves migrate with their original 48 racks owned; cash, tools, upgrades, existing community progress, and completed missions are preserved. Starter missions are marked complete during migration without granting duplicate rewards. Version 2 saves restore only purchased racks. Resetting starts an empty farm with $300 and clears community progress.

## Validation

```sh
node --test tests/game.test.mjs
```

Covers empty starts, purchases and rejected purchases, generation, slower dust, project rewards, save migration, and navigation before and after construction.

## Field crew and extended missions

The Shop hires **cleaners ($250)** and **collectors ($200)** after the first rack is installed. Up to six workers can be hired, with no recurring wages. They follow farm paths, choose distinct tasks within their role, and work only while the game is running (including nighttime). Pausing or opening a menu pauses the crew. Cleaners target racks with at least 15% dust; collectors gather available rack earnings. Player and worker collections use the same cash balance, preventing double collection.

Each worker can be upgraded twice: level 2 costs $200 and level 3 costs $400. Travel speed increases from 3 to 4.5 to 6 metres per second. Cleaning duration decreases from 6 to 3.5 to 1.8 seconds; collection takes 40% of that duration. Levels persist through saves, and unfinished tasks are safely reassigned on reload.

15 new missions cover expansion, hires, worker upgrades, crew cleaning and collection, and lifetime earnings. Crew work counts toward farm missions. Existing mission IDs remain stable. Previously achieved new milestones are awarded once. After all 22 missions, repeatable earnings goals continue with increasing targets and rewards.

The pressure washer has a nozzle and a sweeping three-stream spray fan, with gentler arm movement than manual scrubbing. The spray disappears when cleaning stops or play pauses. Reduced-motion mode removes the sweep.

## Campaign finale

Finishing all 22 main missions opens a congratulations screen the next time gameplay is active. It shows farm achievements and an educational summary of solar power, with a Department of Energy source link. Choose **Keep my farm & continue** for free play and repeatable goals, or **Start a new farm…** to enter the existing reset confirmation. No progress is cleared by opening or dismissing the finale.

The finale is shown once per farm, including for already-completed older saves. Its acknowledgement persists in the version 3 save format; a new farm resets it. Repeatable missions and community energy days do not delay campaign completion.

## Responsive interface

The HUD adapts to desktop, tablet, narrow portrait, and short landscape viewports. Mission & community is a native expandable panel: it starts collapsed at widths up to 1000px or heights up to 500px and can be opened by touch or keyboard. Breakpoint changes reset that default; normal resizing within a breakpoint preserves the user's selection.

Dialogs scroll within the visible viewport, with safe-area padding for phone notches and home indicators. Touch actions use at least 44px targets. The joystick scales with the screen and uses its actual radius for normalized movement. Hybrid devices expose touch controls through `any-pointer: coarse`. No farm save migration is required.
