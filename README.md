# decimalunits

A Blueprint extension for [Pterodactyl](https://pterodactyl.io) that displays all storage, memory and network byte values shown to users on the client dashboard in **decimal units** (KB, MB, GB, TB) instead of Pterodactyl's default **binary units** (KiB, MiB, GiB, TiB). Admin-side values (server edit, egg configuration, etc.) are left untouched and are still entered/displayed in raw MiB.

## How it works

Pterodactyl's own `bytesToString()` (`resources/scripts/lib/formatters.ts`) is the single place that formats every DOM-rendered byte value shown to users, always using binary units with a 1024 divisor: `['Bytes', 'KiB', 'MiB', 'GiB', 'TiB']`. There is no supported `Components.yml` hook to override that function directly, so this extension instead:

*   Watches the rendered DOM with a `MutationObserver` and rewrites any already-rendered text matching that binary output into decimal units (1000 divisor) — see [`components/elements/DecimalUnitConverter.tsx`](components/elements/DecimalUnitConverter.tsx).
*   Registers a global Chart.js plugin that rewrites tick labels on the CPU/Memory/Network usage graphs (`resources/scripts/components/server/console/StatGraphs.tsx`), since those are drawn onto a `<canvas>` and can't be reached by scanning DOM text nodes — see [`components/elements/lib/chartPlugin.ts`](components/elements/lib/chartPlugin.ts).

Both entry points share the same conversion helpers in [`components/elements/lib/units.ts`](components/elements/lib/units.ts), so the DOM scanner and the chart plugin always agree on exactly which strings count as "binary unit output" and how they're rewritten. Converted output never contains the binary `i` suffix again, so re-scanning already-converted text is always a no-op.

### Why `Dashboard.Global.BeforeSection`

`Components.yml` binds the (invisible) converter component to `Dashboard.Global.BeforeSection`, which is rendered by Pterodactyl's shared `PageContentBlock` — used by every dashboard/account/server page. Binding it here means the converter mounts once and applies everywhere, without needing a separate binding per page.

## Installation

1. Download the latest `decimalunits.blueprint` file from the
   [Releases](https://github.com/jw2702/pterodactyl-decimalunits/releases) page.
2. Upload it to your panel and run:

   ```bash
   blueprint -install decimalunits.blueprint
   ```

## Uninstallation

```
blueprint -remove decimalunits
```

This extension has no install/update/remove scripts and patches no panel files directly — removal simply unmounts the component and reverts to Pterodactyl's default binary-unit formatting.

## Compatibility

Last verified against:

*   Pterodactyl Panel: `develop` branch (as of the date of this commit).
*   Blueprint Framework: `beta-2026-06` (current stable release, matching `info.target` in `conf.yml`).

Since the DOM converter relies on matching the exact output format of Pterodactyl's `bytesToString()`, compatibility with _future_ Pterodactyl versions is not guaranteed, but a format change would simply result in unconverted (binary) values being shown again, not a broken UI.
