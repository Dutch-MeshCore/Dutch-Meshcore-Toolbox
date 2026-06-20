# Repeater Packet-Filter CLI generator + live serial block — Design

**Date:** 2026-06-20
**Repo:** Dutch-Meshcore-Toolbox
**Status:** Approved (design), pending implementation plan

## Context

The custom DutchMeshCore repeater firmware (MeshCore `dmc-dev`, `FIRMWARE_VERSION =
"DutchMeshcore.nl - v1.16.0"`) added a **packet filter** that drops flood (multi-hop)
packets exceeding configurable limits before they are repeated. It is driven entirely
by a new `filter …` CLI command tree and persisted to `/filter_prefs` on the device.
See `MeshCore/examples/simple_repeater/Filter.{h,cpp}` and
`MeshCore/docs/cli_commands.md` (Packet Filter section).

The toolbox already has two relevant surfaces:

- **MQTT CLI generator** (`/mqtt-cli`, `src/pages/MqttCliPage.tsx`) — a form that builds
  copy-paste `set …` commands, with per-line copy, "copy all", and a help dialog. This is
  the "CLI generator" pattern we are mirroring.
- **Repeater serial setup** (`/usb-config`, `src/pages/UsbConfigPage.tsx` +
  `src/components/config/ConfigForm.tsx`) — a live Web-Serial connection whose panels
  read/write `device.vars` and can send arbitrary commands via `onSendCommand`.

This feature adds, in the toolbox:

1. A **standalone Filter CLI generator page** for the new `filter …` commands.
2. A **"Packet Filter — (Custom DMC firmware only)" block** inside the repeater serial
   setup that reads and writes filter settings live over USB.

No firmware changes are in scope.

## Goals

- Generate correct, copy-pasteable `filter …` commands from a form (no device needed).
- Let users view and edit the live filter configuration of a connected DMC repeater.
- Reuse one source of truth for the command strings and the form UI across both surfaces.
- Match the existing toolbox look, i18n (NL/EN), and code patterns.

## Non-goals (YAGNI)

- Editing read-only/informational commands: `filter count`, `filter types` (purely
  informational; `count` is live stats). Not exposed as editable fields.
- `clear stats` handling (already available elsewhere in the CLI).
- Any firmware change.
- Working around the device's 160-byte reply buffer (see Known limitations).

## Firmware reference (source of truth for the model)

### Payload types (index → name) — 12 total
```
00 REQ        06 GRP_DATA
01 RESPONSE   07 ANON_REQ
02 TXT_MSG    08 PATH
03 ACK        09 TRACE
04 ADVERT     10 MULTIPART
05 GRP_TXT    11 CONTROL
```

### Defaults (`FilterPrefs` in Filter.h)
- `enabled`: `false`
- `minHashBytes`: `1`
- `malformed`: `false`
- per-type `hops_max`: `8` for every type **except GRP_TXT (05) = 32**
- per-type `rate_limit`: `5` default, except **TXT_MSG (02) = 20**, **ADVERT (04) = 10**,
  **GRP_TXT (05) = 20**
- per-type `rate_secs`: `60` for every type
- channels: none (empty); up to `FILTER_CHANNEL_COUNT = 16`

### Write commands
| Command | Args / ranges |
|---|---|
| `filter on` / `filter off` | — |
| `filter reset` | restores all defaults |
| `filter hops <type> <max_hops>` | type `0–11`, max_hops `0–64` |
| `filter rate <type> <limit> <secs>` | type `0–11`, limit/secs ≥ 0 |
| `filter channel add <#name \| Public>` | up to 16 channels |
| `filter channel remove <#name \| Public>` | — |
| `filter hash <min_bytes>` | `1–3` |
| `filter malformed on` / `filter malformed off` | — |

### Read commands and exact reply formats
The repeater main loop emits every reply as `Serial.print("  -> ");
Serial.println(reply);`. Multi-line replies use embedded `\n` between rows and a single
trailing `\r\n` (from `println`). The toolbox's existing `SerialCLI.sendCommand` returns
the trimmed text between the `  -> ` marker and the final `\r\n`, i.e. **the whole
multi-line block as one string with embedded `\n`** — so no transport changes are needed;
parsing is plain string work.

| Command | Reply (after `  -> `) | Parse |
|---|---|---|
| `filter` | `> Filter on: Blocked [ Hops: … ]` | `enabled` = the `on`/`off` token after `Filter ` |
| `filter hops` | `[TYPE: MAX_HOPS]\n00: 8\n01: 8\n…\n11: 8` | per row `NN: V` → `perType[NN].hops` |
| `filter rate` | `[TYPE: LIMIT,SECS]\n00: 5,60\n…\n11: 5,60` | per row `NN: L,S` → `rateLimit`,`rateSecs` |
| `filter channel list` | `name (hh),name2 (hh)` or `None` | split on `,`, strip trailing ` (hh)` → channel name |
| `filter hash` | `> Filter: minimal N bytes path hash size` | `minHashBytes` = N |
| `filter malformed` | `> Filter: malformed text scan on` / `off` | `malformed` = on/off |

**Channel round-tripping note (verify in implementation):** the list shows the stored
channel name plus a ` (hashhex)` suffix. The parsed name (suffix stripped) is what we pass
back to `filter channel add/remove`. The public channel appears as `Public`. The implementer
should confirm against `Filter::addChannel` / `listChannelNames` that a parsed name passed
back to `remove` matches (especially whether a leading `#` is stored or stripped).

## Architecture

One shared core, two surfaces.

```
filterCommands.ts ── pure model: PAYLOAD_TYPES, FILTER_DEFAULTS,
   │                 FilterSettings type, buildFilterCommands(), parsers
   │
   ├── FilterSettingsForm.tsx ── shared UI (globals + advanced per-type table + channels)
   │        │
   │        ├── FilterCliPage.tsx ............ Surface 1: generator (no device)
   │        └── ConfigForm.tsx (new panel) ... Surface 2: live read/write (DMC fw only)
   │
   └── useSerialDevice.ts ── live read on connect + diff/write on save (Surface 2)
```

### Shared module: `src/lib/config/filterCommands.ts` (new)
Pure logic, no React. Exports:

- `PAYLOAD_TYPES: readonly { index: number; name: string }[]` — the 12 types above.
- `FILTER_DEFAULTS: FilterSettings` — mirrors firmware defaults exactly.
- `FilterSettings` type:
  ```ts
  interface PerTypePrefs { hops: number; rateLimit: number; rateSecs: number }
  interface FilterSettings {
    enabled: boolean
    perType: PerTypePrefs[]   // length 12, indexed by payload type
    channels: string[]        // stored channel names (e.g. "Public", "#general")
    minHashBytes: number      // 1–3
    malformed: boolean
  }
  ```
- `buildFilterCommands(next: FilterSettings, base: FilterSettings): string[]`
  Returns the **minimal ordered list** of `filter …` commands to turn `base` into `next`
  (only emits commands for fields that differ). Order: `hash` → `malformed` → per-type
  `hops` (changed only) → per-type `rate` (changed only) → channel `add` (in next, not base)
  → channel `remove` (in base, not next) → `on`/`off` last (so config is in place before
  enabling). For the generator, `base = FILTER_DEFAULTS`. For the live block,
  `base = device.filterDevice` (the snapshot read from the device).
- Parsers (each takes the raw `sendCommand` reply string, returns a partial update):
  `parseFilterStatus`, `parseFilterHops`, `parseFilterRate`, `parseFilterChannels`,
  `parseFilterHash`, `parseFilterMalformed`. Tolerant of whitespace and the optional `> `
  prefix; ignore unparseable rows rather than throwing.
- `isDmcFirmware(version: string): boolean` — `version.toLowerCase().includes('dutchmeshcore')`.
  (May live in `configUtils.ts` instead; see file list.)

### Shared component: `src/components/config/FilterSettingsForm.tsx` (new)
Props: `{ value: FilterSettings; onChange: (next: FilterSettings) => void }`. Renders:

- **Globals (always visible):** enable toggle, min hash bytes (1–3), malformed scan toggle.
- **Channel block-list:** list of current channel names with remove buttons + an add input
  (`#name` or `Public`); cap at 16 with a hint.
- **Advanced — per payload type (collapsed by default):** an expandable table with one row
  per type (index + name) and inputs for max hops (0–64), rate limit, rate window (s).

Stateless/controlled — it never talks to a device; both surfaces own the state. Field
labels follow `ConfigForm`'s convention (hardcoded English labels, translated section
legends).

### Surface 1: `src/pages/FilterCliPage.tsx` (new) — route `/filter-cli`
Modeled on `MqttCliPage`:
- Local `copy` object for NL/EN strings (same pattern as MqttCliPage — page-local i18n).
- Holds a `FilterSettings` state seeded from `FILTER_DEFAULTS`; renders `FilterSettingsForm`.
- Output box: `buildFilterCommands(state, FILTER_DEFAULTS)` rendered as command lines with
  per-line **Copy** and a **Copy all** button (reuse existing `cmd-line` / `output-box`
  styles). A leading comment notes the commands assume the node is at default filter
  settings and suggests `filter reset` first if unsure.
- A **Command reference** help dialog (same `help-overlay` pattern) listing the `filter …`
  command tree, payload-type table, and ranges.
- DMC firmware banner + beta/privacy notes consistent with MqttCliPage.

### Surface 2: new panel in `src/components/config/ConfigForm.tsx`
- Rendered **only when `isDmcFirmware(device.version)`** is true.
- Panel legend: `t('config_section_filter')` →
  *"Packet Filter — (Custom DMC firmware only)"* / NL equivalent.
- Renders `FilterSettingsForm` bound to `device.filter`, updating via the existing
  `onUpdate({ filter })` path.
- A **"Reset filter to defaults"** button sends `filter reset` (via `onSendCommand`) then
  re-reads.
- Saving is handled by the existing **Save** button → `setData()` (see hook changes); filter
  changes do **not** require a reboot (the firmware persists `/filter_prefs` immediately).

### Hook: `src/hooks/useSerialDevice.ts`
Mirror the existing `vars` / `varsDevice` two-way pattern with `filter` / `filterDevice`:
- **Read (`_getData`):** after reading standard vars, if `isDmcFirmware(version)`, send
  `filter`, `filter hops`, `filter rate`, `filter channel list`, `filter hash`,
  `filter malformed`, parse via the `filterCommands` parsers into a `FilterSettings`, and
  store both `filter` (editable) and `filterDevice` (pristine snapshot) on the device object.
  On non-DMC firmware leave both `undefined`.
- **Write (`setData`):** if `device.filter` and `device.filterDevice` are present, compute
  `buildFilterCommands(device.filter, device.filterDevice)` and send each via
  `cli.sendCommand`, before the final re-read. No reboot flag for filter changes.

### Types: `src/types.ts`
- Add `FilterSettings`, `PerTypePrefs`, and `FILTER_DEFAULTS` (or re-export from
  `filterCommands.ts` — pick one home; `filterCommands.ts` is preferred to keep the model
  with its logic).
- Extend `SerialDeviceInfo` with `filter?: FilterSettings` and `filterDevice?: FilterSettings`.

### Routing & nav
- `src/App.tsx`: add `<Route path="/filter-cli" element={<FilterCliPage />} />`.
- `src/components/layout/Navbar.tsx`: add a link under the **Config** dropdown next to
  "MQTT CLI Setup", using `t('nav_filter')`. Update the `inConfig` active-state check to
  include `/filter-cli`.

### i18n: `src/i18n.ts`
Add NL + EN keys: `nav_filter` (e.g. "Filter CLI") and `config_section_filter`
(e.g. EN "Packet Filter — (Custom DMC firmware only)"). The generator page keeps its own
local `copy` object like MqttCliPage. Run the existing i18n-orphans test to confirm parity.

## Validation / ranges (enforce in the form + builders)
- payload type index `0–11`
- max hops `0–64`
- min hash bytes `1–3`
- rate limit / window: integers ≥ 0
- channels: max 16; trim and require non-empty

## Testing
- `src/test/filterCommands.test.ts` (new): the highest-value tests.
  - `buildFilterCommands`: no diff → `[]`; single-field diffs emit exactly the right command;
    per-type hops/rate; channel add/remove deltas; on/off ordering; generator baseline
    (`FILTER_DEFAULTS`).
  - parsers: real device reply strings (including multi-line `\n` blocks, `None` channels,
    on/off status) → expected `FilterSettings` partials; malformed rows ignored.
- Reuse existing test infra (`vitest`, `src/test/setup.ts`). Optionally a light render test
  for `FilterSettingsForm` mirroring existing component tests.

## Known limitations
- The device fills filter replies into a shared 160-byte buffer. `filter rate` across all 12
  types with very large custom limit/secs values can truncate the tail on the device side.
  Defaults and ordinary values fit comfortably. Surfaced as a help-text note; not worked
  around.

## File-by-file change list
**New (Toolbox):**
- `src/lib/config/filterCommands.ts`
- `src/components/config/FilterSettingsForm.tsx`
- `src/pages/FilterCliPage.tsx`
- `src/test/filterCommands.test.ts`

**Modified (Toolbox):**
- `src/App.tsx` — add `/filter-cli` route
- `src/components/layout/Navbar.tsx` — add Config-dropdown link + active state
- `src/i18n.ts` — `nav_filter`, `config_section_filter` (NL/EN)
- `src/types.ts` — `SerialDeviceInfo.filter?` / `.filterDevice?` (and model home decision)
- `src/hooks/useSerialDevice.ts` — read filter on connect (DMC only); diff/write on save
- `src/components/config/ConfigForm.tsx` — render filter panel when DMC fw detected
- `src/utils/configUtils.ts` — `isDmcFirmware(version)` helper (if not placed in filterCommands.ts)

## Open questions
None blocking. One implementation detail to verify against the firmware: exact channel-name
round-trip (leading `#` storage and the ` (hashhex)` suffix) — see Channel round-tripping note.
