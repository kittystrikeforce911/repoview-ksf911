# CHANGES — `feat/viewer-upgrade`

Unified change record for the `feat/viewer-upgrade` branch: hardening of the
file-server API, three new reading experiences (re-rendering menu, plain-text
view, XML viewer), a full CSV data layer (filter toolbar + SVG charts), a
four-way theme system (Light / Dark / Nord / OpenCode Orng) and workflow
hardening for the device handover.

- Base: `master` (v0.17.0) · Branch: `feat/viewer-upgrade` · 12 commits, all unpushed
- Rule: zero new dependencies; all charts are hand-rolled SVG; every commit builds, passes `go vet`, `go test ./...` and the full Playwright suite, and carries its own `[Unreleased]` entries in `CHANGELOG.md`

## Index

| # | Commit | Type | Title | Stage |
|---|--------|------|-------|-------|
| 1 | `c7edfaf` | fix | harden file server and websocket | API hardening |
| 2 | `3133a95` | docs | refresh API reference table | Docs |
| 3 | `abcceb0` | feat | read file as plain text, markdown or csv | Read-as menu |
| 4 | `34fec62` | fix | dedicated plain-text reading view for `.txt` | Plain-text view |
| 5 | `4912f7d` | feat | advanced column filter toolbar | CSV filters |
| 6 | `a283525` | style | gofmt `update_test.go` | Housekeeping |
| 7 | `d5d5d3c` | feat | XML viewer with tree, table and filters | XML viewer |
| 8 | `0e33fb0` | feat | SVG chart engine + core charts | CSV charts |
| 9 | `1be8d7c` | docs | refresh README features and add unified CHANGES.md | Docs |
| 10 | `a507635` | feat | four-way color system (Light/Dark/Nord/OpenCode Orng) | Themes |
| 11 | `d8c7919` | ci | Playwright webServer runs without mise; 60 s boot timeout | Tooling |
| 12 | `f6cb0ee` | docs | handover notes and theme entry | Handover |
| 13 | `7d100c3` | feat | CSV column sort from table headers + descriptive control labels | CSV sort/labels |
| 14 | `2e01bad` | feat | "Wiki Markdown" in Read file as (`as=wiki`) | Read-as wiki |
| 15 | `583f1fd` | feat | cross-device WebSocket origin tests + README access-guide | Interop |
| 16 | `6dfd6ee` | docs | MIT license summary table (choosealicense.com) | Docs |
| 17 | `78d7266` | feat | theme-aware chart palettes (`--rv-chart-N`) + hover guideline | Charts 7b |
| 18 | `4df1646` | feat | histogram, bubble, heat map chart types | Charts 7c |
| 19 | `83afeea` | docs | README screenshots (charts/themes, code view, read-as) | Docs |
| 20 | `15d8c0e` | fix | theme menu clears the sidebar on short paths | UI |
| 21 | `e2f78ef` | fix | padded line-number gutters across all numbered views | UI |
| 22 | `a7f6a21` | docs | documentation.md + custom-themes guide | Docs |
| 23 | `aac917e` | feat | collapse & fold for hierarchical views | UI |
| 24 | *(this commit)* | feat | styled fold switch + Dark rose theme | UI |

---

## 1. `c7edfaf` — fix(api): harden file server and websocket

**Summary.** Three security/robustness fixes in `main.go`: huge files are no
longer rendered inline into every response, read-only endpoints no longer
accept state-changing verbs, and the WebSocket upgrade is refused for
cross-origin origins.

### Added
- Size cap arithmetic in the file API: content above 16 MB is reported as
  `tooLarge` (with exact size) instead of being inlined; the UI can then
  offer a Download link backed by `/api/raw`
- Same-origin host check for `/ws` WebSocket upgrades so pages in other
  origins/tabs cannot connect to the local viewer

### Fixed
- `/api/file` no longer renders arbitrarily large files inline
- Read-only API endpoints reject non-GET/HEAD requests with `405`

### Changed
- Removed the unused WebSocket hub goroutine (`hub.run`)

### Files
`main.go` (+96), `main_test.go` (+133), `static/index.html` (+20), `CHANGELOG.md`

### Tests
Backend: `tooLarge` path, 405 matrix for all read-only endpoints, cross-origin
`/ws` rejection, slash-normalized watch-path test (all in `main_test.go`,
43→43 Playwright unchanged, backend suite ~67 functions).

---

## 2. `3133a95` — docs(api): refresh API reference table

**Summary.** README API table brought up to date with the hardened endpoint
contract: new response flags (`isSVG`, `isXML`, `isJSONL`, `tooLarge`,
`rawSVG`, `mimeType`, `size`), the `&as=` renderer override, and note that
read-only endpoints answer `GET`/`HEAD` only.

- Files: `README.md` (API table, +8/−2)
- Tests: docs only

---

## 3. `abcceb0` — feat(view): read file as plain text, markdown or csv

**Summary.** New "Read file as" menu in the file header: any *text* file can
be re-rendered through a different pipeline — plain text, Markdown or CSV
table — via the `?as=txt|md|csv` URL parameter, backed by
`/api/file?path=&as=…`.

### Added
- Backend: `as` renderer override in the file handler (rejects invalid
  values with `400`), applied only to text-renderable files
- Frontend: header dropdown ("Read file as") with `txt` / `md` / `csv`
  entries; URL param is carried through navigation and restored on reload
- README: `&as=` row in the API table

### Files
`main.go` (+32), `main_test.go` (+77), `static/index.html` (+106), `README.md`, `CHANGELOG.md`

### Tests
Backend: as-override matrix (markdown→txt, x→md, x→csv, invalid value 400,
non-text rejection). Playwright 43 (menu present, URL-param plumbing).

---

## 4. `34fec62` — fix(ui): dedicated plain-text reading view for `.txt`

**Summary.** `.txt` files (and files read as `?as=txt`) render in a dedicated
reading view instead of a syntax-highlighted code blob: verbatim lines with
optional soft-wrap and line numbers, both persisted per viewer.

### Added
- `pre.plain-text` reading view with per-line spans, CSS soft-wrap toggle
  and line-number gutter; toggles are stored in `localStorage`
  (`plainTextWrap`, `plainTextNumbers`)
- Reading view registered as the `txt` target of the "Read file as" menu

### Changed
- Backend: `.txt` responses now flag `isPlainText` so the frontend can pick
  the right renderer

### Files
`static/index.html` (+83), `main.go` (+22), `main_test.go`, `tests/repoview.spec.ts` (+14), `CHANGELOG.md`

### Tests
Playwright 44: "CSV read-as plain text shows verbatim rows" plus txt reading
view visibility; backend txt flag test; `go test` green.

---

## 5. `4912f7d` — feat(csv): advanced column filter toolbar

**Summary.** CSV views gain a real filter toolbar above the table: per-column
operators (`contains`, `equals`, `regex`, greater, less, `empty`), match-all
or match-any combination, removable filter chips and a live
"Showing X of Y rows" count. With no filters active the server-rendered
table is restored verbatim.

### Added
- Filter bar: column select, operator select, value input (regex validity
  flagged inline), add button, clear-all, invalid-expression message,
  live match count
- Filter chips row: each filter as a chip with a ✕ button; chips only
  render when filters exist
- Client-side filtering engine feeding the table re-render
- Fixture: `testdata/colors.csv` (30 rows × 6 columns: `id`, `name`,
  `category` warm/cool/neutral, `hex`, `weight`, `rating`)

### Files
`static/index.html` (+458), `tests/repoview.spec.ts` (+69), `testdata/colors.csv` (+31), `CHANGELOG.md`

### Tests
Playwright 47: toolbar smoke, per-operator behaviour, match-any/all, chip
removal, live count ("11 of 30" on `category contains warm`).

---

## 6. `a283525` — style: gofmt update_test.go

**Summary.** One-line `gofmt` cleanup of `update_test.go`; no behaviour
change (backend suite verified green).

---

## 7. `d5d5d3c` — feat(xml): XML viewer with tree, table and filters

**Summary.** `.xml` files (and anything read as `?as=xml`) get a client-side
viewer with three views — Tree, Table, Code — and live element filters: tag
globs, attribute matchers, text search and XPath 1.0 subset. Unparseable XML
falls back to the Code view with the parse error shown.

### Added
- Backend: `isXML` / `rawXML` file flags; `as=xml` registered in the
  read-as menu
- Frontend: XML viewer module
  - Tree view: collapsible element hierarchy, attribute chips
  - Table view: element rows (path, tag, attrs, text)
  - Code view with the raw source
  - Filters: tag glob (`book*`), attribute (`book@id=x` or `id=x`), text
    search, XPath (`//book[@genre='web']`), live match count
  - Read-as menu gains "XML viewer"
- Fixture: `testdata/sample.xml` (catalog with 4 books and 2 magazines,
  31 elements)

### Fixed
- Attribute keys in the parsed element objects use a proper `Set` guard so
  repeated attribute names do not duplicate keys
- Parse-error message is set after match counting, so the banner is not
  wiped by a re-render
- Watch/fill inputs re-bind their `input` events after view switches

### Files
`main.go` (+25), `main_test.go` (+35), `static/index.html` (+427), `tests/repoview.spec.ts` (+82), `testdata/sample.xml` (+39), `README.md`, `CHANGELOG.md`

### Tests
Backend: isXML/rawXML flag matrix, as=xml pass-through. Playwright 56:
tree/table/code switching, tag glob, attr matcher, XPath, text filter,
parse-error fallback, read-as menu path.

---

## 8. `0e33fb0` — feat(csv): SVG chart engine + core charts

**Summary.** CSV views gain a **Charts** toggle beside Table/Records: eight
hand-rolled SVG chart types configured through X / measure / aggregate /
colour-by selects. Charts consume the filtered row set
(`csvFilteredIndices`), so they refresh live when filters change; the filter
toolbar and chips remain mounted in Charts view so the row set stays
editable while the chart is open. Chart configuration is kept in memory for
the session (`?view=charts` restores the Charts view).

### Added
- Chart config bar: type select (`bar`, `hbar`, `stacked`, `line`, `area`,
  `scatter`, `pie`, `donut`), X column, numeric measure select (numeric
  columns only), aggregate (`sum | avg | min | max | count`) and colour-by
  column ("(none)" default)
- Chart engine (all static/index.html, no dependencies):
  - `CSV_CHART_COLORS` 10-colour palette; legend auto-populates
    from the colour-by column
  - `niceChartMax` rounded axis max + `chartGridY` grid (4 divisions)
    + x-axis baseline; `fmtChartNum` number formatting (k/M/B)
  - `csvChartGroups` bucketing: X buckets × colour groups, raw measure
    values per group, `(blank)` bucket for empty keys, numeric-X ordering
    shared by line/area
  - `renderCSVGroupedBars` (bar/stacked): single mode (one untinted bar),
    grouped mode (a bar per colour), stacked mode (segments); vertical bars
    cap at 40 buckets with the rest rolled into an "Other" bucket
  - `renderCSVHBarChart`: horizontal bars from pre-aggregated rows
  - `buildPieSVG` + `chartArcPath`: pie and donut, top 9 categories
    + "Other" slice
  - `renderCSVLineChart` (line/area): family over shared X order, multi-
    series when colour-by is set, area adds a translucent fill-to-zero path,
    single-point series get a dot instead of a line
  - `renderCSVScatterChart`: raw numeric X vs measure, min/max scaling,
    colour groups, hover title `x / y (group)`
- `renderCSVChart` dispatcher with graceful `empty` reasons ("No rows match
  the active filters.", "Pick a colour column to stack the bars.", …) and
  in-sheet legend rendering
- Behaviour: stacked requires a colour column; bar shows grouped bars under
  colour-by; pie/donut ignore colour-by; scatter keeps raw numeric X
  (no bucketing); charts re-render on every `applyFilters()` while active

### Fixed
- **Axis scale bug**: with no colour column the y-axis max was computed
  from an empty source (`maxV=0 → nice 1`), so every bar rendered at full
  plot height with a 0–1 axis. The max is now derived from the same
  aggregated numbers the bars draw, covered for all three modes
- `renderCSVGroupedBars` now receives the *real* aggregate; previously
  bars always summed (avg/min/max were only honoured for ordering/capping)
- The shared filter toolbar + chips move into the Charts view mount
  (and back into Table), keeping filters editable next to the chart
- Filter chips now also remove their filter when the chip body (not only
  the ✕) is clicked

### Files
`static/index.html` (+1024), `tests/repoview.spec.ts` (+73), `CHANGELOG.md` (+4)

### Tests
Playwright 59 (net +3 chart tests):
- "bar default, type switching and hover titles": all 8 types render,
  rect/title alignment, scale sanity (bars not saturated, axis reaches
  the rounded max = 50 for `sum(id) by id`)
- "colour legend, stacked bars and line groups": 3-item legend on
  `category`, one rect per (bucket × colour) stacked, 3 line paths
- "render the filtered row set": `category contains warm` → note
  "plotting 11 of 30 rows", 11 `id` buckets; removing the chip while the
  chart is open refreshes it live to "30 of 30"
Gate: every `<script>` block parses (`new Function`), no page errors
across types in the probe run.

---

## 9. `1be8d7c` — docs: refresh README features and add unified CHANGES.md

**Summary.** README `## Features` rewritten to full coverage of what the
branch ships (read-as menu, plain-text view, CSV filter toolbar, XML viewer,
SVG chart engine) and `CHANGES.md` introduced — the unified per-commit
change record (this file).

### Added
- `CHANGES.md` (+311): index, per-commit sections, cross-index by area,
  verification state, deferred stages

### Changed
- README feature list to compact one-line bullets; install and usage untouched

### Files
`CHANGES.md` (new, +311), `README.md` (+7/−1)

### Tests
Docs-only commit; no test impact.

---

## 10. `a507635` — feat(theme): four-way color system (Light/Dark/Nord/OpenCode Orng)

**Summary.** The binary dark/light toggle becomes a theme picker in the
breadcrumb bar: an ARIA `menu` of `menuitemradio` items with two-tone
swatches and a ✓ on the active colorway, offering Light = Obsidian's
default-light palette (`#ffffff` surfaces, `#705dcf` accent, `#222222`
text), Dark = the existing Catppuccin-inspired scheme, and the two
"colored" slots filled with named real palettes — Nord (official palette)
and OpenCode "Orng" (`#0a0a0a` surface, `#eeeeee` ink, `#ec5b2b` orange,
values from opencode.ai/theme). Palette selection follows the "unslop"
design method — named real palettes rather than invented defaults — as
noted in `CHANGELOG.md`.

### Added
- Theme menu UI: `#theme-menu-wrap` / `#theme-menu` (`hidden`, populated on
  open), selecting a colorway closes it, Escape and outside-click close it;
  active item highlighted via `--rv-bg-active`
- Theme persistence: `rv-theme` localStorage validated against the four
  known ids; OS `prefers-color-scheme` drives the choice while unset and
  keeps updating until the user picks explicitly
- Themed syntax highlighting: chroma switched to
  `chromahtml.WithClasses(true)`; CSS token families (`k*`, `s*`, `m*`,
  `c*`, `nf/fm`, `nc/no/nb/nx`, `na/nt/nd/nv`, `o/ow/p`, `err`, line-number
  cells) map to per-theme `--rv-code-*` variables defined in every theme
  block
- Explicit themed surfaces on `pre.plain-text` and `.source-code`
  (background + text color) so dark colorways render deterministically —
  mitigation for a user-reported "dark UI renders .txt as white" that never
  reproduced on this build (stale-cache hypothesis recorded in `TODO.md`)
- Mermaid renders `theme: 'dark'` for every non-light colorway (head
  `initialize` compares `!= 'light'`; runtime `updateMermaidTheme` re-renders
  processed diagrams from `data-original`)

### Fixed
- Code views no longer carry light-mode inline colors, so dark colorways
  restyle every token

### Files
`static/index.html` (+380/−53), `main.go` (+7/−1), `main_test.go` (+25),
`tests/repoview.spec.ts` (+70), `CHANGELOG.md` (+3), `README.md` (+1)

### Tests
Backend: `TestRenderCodeClassedTokens` demands `<span class=` tokens and
zero inline `style="color:` / `style="background-color:`; the plain-text
test keeps asserting "chroma" absence (`.txt` never reaches the formatter).
Playwright 59 → 62 (+3): theme-menu cycling across all four colorways
(distinct body background, `data-theme` and localStorage per colorway,
Escape-close), dark colorway `.txt` regression (background never
`rgb(255, 255, 255)`), and class-based code-view highlighting.

---

## 11. `d8c7919` — ci(tests): Playwright webServer runs without mise; 60 s boot timeout

**Summary.** `tests/playwright.config.ts` invoked `mise x go` for the
webServer on POSIX systems, which fails on machines without the mise
toolchain manager — including the incoming minimal Debian device.

### Changed
- webServer command is plain `go run .. -port 3123 -no-browser ../testdata`
  on every platform
- `webServer.timeout` raised 15 s → 60 s to absorb a cold `go run` compile
- config comment documents the fallback: build and serve the binary
  yourself; `reuseExistingServer` picks it up

### Files
`tests/playwright.config.ts` (+6/−4)

### Tests
Full Playwright re-run with **no pre-started server** so the new command had
to boot it: 62 / 62 passed.

---

## 12. `f6cb0ee` — docs: handover notes and theme entry

**Summary.** Device-handover documentation: `CHANGES.md` brought current
(this file), a minimal-Debian development setup in the README and a temporal
in-progress file (`TODO.md`) to keep writing state into across the device
change.

### Added
- `TODO.md`: branch state table (12 unpushed commits), next-changes queue,
  bugs/open questions, environment notes, handover-package checklist
- README `## Development` gains *Setting up a minimal Debian machine*:
  base apt packages, official Go/Node tarballs, `npm ci` +
  `npx playwright install --with-deps chromium`, gate notes
- `CHANGES.md`: index rows 9–12, sections 9–12, cross-index rows,
  verification state refreshed to 62 / 62

### Files
`README.md`, `TODO.md` (new), `CHANGES.md`

### Tests
Docs-only commit; no test impact.

---

## 13. `7d100c3` — feat(csv): CSV column sort from table headers + descriptive control labels

**Summary.** CSV tables gain click-to-sort headers with a three-way cycle
(ascending → descending → off), a numeric-aware comparator and ARIA sort
state; every filter, chart and header control is given a descriptive
`aria-label` + tooltip. Desktop-quality data-tooling interoperability:
comparator behaviour matches spreadsheet sorting (numbers order as numbers),
and the pristine server-rendered table is restored verbatim when sorting is
off.

### Added
- Click any header to sort: no sort → ascending → descending → no sort;
  the table body re-renders client-side around the filtered row set
  (filters + sort compose), and the pristine server-rendered table is
  restored verbatim when no filters and no sort remain
- Sort state surfaces: `aria-sort="ascending|descending"` on the active
  `th`, ▲/▼ indicator span, highlighted header background, hover affordance,
  keyboard focus (tabindex) with Enter/Space activation, and a
  "Showing X of Y rows · sorted by weight ▲" note in the count element
- Numeric-aware comparator: both cells parse as numbers → numeric order
  (`0.35 < 1.40`); otherwise case-insensitive text order; mixed columns
  fall back to text; ties keep file order (stable sort)
- Record links stay correct while sorted: the per-row → button still
  carries the original 1-based row number
- Labels on all CSV controls: filter column ("...which column the rule
  tests"), filter rule, filter value, add rule, clear, match all/match
  any, and chart shape/X axis/measure/aggregate/colour by — each an
  `aria-label` mirrored to a tooltip
- Header hints: "Sort by rating — click to sort ascending" (clicking keeps
  the hint current with the actual state; stays accurate after each cycle)

### Files
`static/index.html` (+248/−5), `tests/repoview.spec.ts` (+133)

### Tests
Playwright 62 → 66 (+4): the click cycle (file order → ascending →
descending → pristine restore, with `aria-sort` and ▲/▼ transitions),
numeric-aware sorting combined with an active filter (weight ▲ over the
"warm" subset: Peach 0.47 first, "11 of 30 rows · sorted by weight ▲"),
record-link integrity while sorted (`#record-17` reachable from the
top-sorted row), and the control-label spell-outs across the filter bar,
sortable headers and the chart bar. Backend untouched — `go test ./...`
unchanged. Note: this commit also fixed a latent bug the new tests caught
(`renderCSVTableHTML` iterated `row.length` on `{cells, orig}` row
objects — filtered/sorted tables rendered rows with only the record-link
cell; now iterates `row.cells`).

---

## 14. `2e01bad` — feat(view): "Wiki Markdown" in Read file as (`as=wiki`)

**Summary.** The "Read file as" menu gains a fourth renderer: any inline
text file can be re-read as Obsidian-style wiki markdown. Previously wiki
links only expanded for `.md` files inside an `.obsidian` vault directory;
`as=wiki` now forces wiki expansion and inline-HTML rendering regardless
of the root being a vault — a single note file on any machine gets full
repo-view interop with Obsidian-style notes.

### Added
- Backend: `as=wiki` renderer override in `handleFile` (validation switch
  accepts it, `isMarkdown` set, `renderMarkdown` gained an `allowWiki`
  parameter that forces `preprocessWikiLinks` + goldmark `WithUnsafe()`
  even outside vaults; vault detection for plain `.md` files unchanged
  via `isObsidianVault ||`)
- Frontend: "Wiki Markdown" item in `populateReadAsMenu` (checking-mark +
  `?as=wiki` current-marker behaviour); the markdown render path resolves
  the emitted `<a class="wiki-link" data-wiki-target>` placeholders
  client-side (valid → `wiki-link-valid` + href, dangling →
  `wiki-link-broken` + "File not found" title)
- Fixture: `testdata/wiki-notes.txt` (links: `[[hello]]` twice, aliased
  `[[hello|the hello note]]`, dangling `[[no-such-note-anywhere]]`)

### Files
`main.go` (+12/−7), `main_test.go` (+59), `static/index.html` (+1),
`testdata/wiki-notes.txt` (new, +9), `README.md` (+2/−2),
`CHANGELOG.md` (+2)

### Tests
Backend: `TestHandleFile_ViewAsWiki` — outside a vault (temp dir),
`as=md` leaves `[[target]]` literal and emits no wiki placeholders while
`as=wiki` expands both a resolvable and a dangling target into wiki
anchors (`data-wiki-target` + `class="wiki-link"`).
Playwright 66 → 68 (+2): read-as menu offers "Wiki Markdown" on a plain
text file, links resolve (`/hello.md` href, four anchors including two
valid variants + one aliased + one broken), the resolved link navigates
client-side to the target note, and `?as=wiki` deep-links restore the
view with the menu item marked preferred.

---

## 15. `583f1fd` — feat(api): cross-device WebSocket origin tests + README access guide

**Summary.** The WebSocket upgrade is already usable across devices
(`checkSameOrigin` requires the Origin host to equal the request host, so a
browser at `http://192.168.1.42:7777` reaches a server bound with
`--host 0.0.0.0`). This stage documents the flow and locks the behaviour in
with device-shaped regression cases, so LAN-interop cannot regress silently.

### Added
- `TestCheckSameOrigin` cases: LAN IPv4 pairing (`192.168.1.42` ↔
  `192.168.1.42:7777`) including an https-origin variant, another subnet
  (`10.0.0.5`), IPv6 loopback pairing (`[::1]:7777`), and the negative
  triples (neighbouring IP, foreign host, wrong port)
- README *Access from other devices* section under Usage: `--host 0.0.0.0`,
  open `http://<server-ip>:7777`, note that the UI + API + live-reload all
  use the connecting address and that non-browser clients (no Origin
  header) are unaffected

### Files
`main_test.go` (+12), `README.md` (+15)

### Tests
Backend only: +8 acceptance cases (LAN/subnet/IPv6 pairings and scheme
insensitivity) and +3 rejections (neighbouring IP, foreign host, wrong
port); `go test ./...` green; Playwright re-run unchanged (68/68).

---

## 16. `6dfd6ee` — docs: MIT license summary table (choosealicense.com)

**Summary.** The bare `MIT` under the README License section becomes the
one-line choosealicense.com description plus its Permissions / Conditions /
Limitations table (grounded on
[the MIT page](https://choosealicense.com/licenses/mit/): commercial use,
distribution, modification and private use permitted; license-and-copyright
notice required; no warranty, no liability).

### Added
- License table mirroring choosealicense.com's MIT row, with link to the
  source page

### Files
`README.md` (+7/−1), `CHANGELOG.md` (+1), `CHANGES.md` (+26/−3), `TODO.md`
(+3/−4)

### Tests
Docs-only commit; all gates re-run green (68/68 Playwright).

---

## 17. `78d7266` — feat(csv): theme-aware chart palettes + hover guideline

**Summary.** The SVG chart palette is no longer hard-coded to one set of
bright hexes: every series fill/stroke now resolves through new
`--rv-chart-1…10` theme variables, so charts recolour themselves with the
four-way theme picker (Light keeps the original GitHub-bright ramp; Dark is
Catppuccin; Nord the official palette; OpenCode the Orng accent ramp).
Because SVG *presentation attributes* cannot hold `var()`, the palette
writes move to inline `style="fill:…"` / `style="stroke:…"` (the legend
swatches already worked that way); grid/axis lines were already
inline-`var()` styled. On top of this, non-pie charts gain a hover
guideline — a theme-accent line that follows the pointer across the plot
while you read values — the polish item queued as stage 7b.

### Added
- `--rv-chart-1` … `--rv-chart-10` defined in all four theme blocks:
  Light = current GitHub bright hexes, Dark = Catppuccin Mocha accents,
  Nord = the official Nord colour ramp, OpenCode = the Orng accent ramp
- `CSV_CHART_COLORS` now holds `var(--rv-chart-N)` strings; every palette
  write converted from `fill=`/`stroke=` attributes to inline styles —
  grouped/stacked/vertical bar rects, pie slice paths, hbar rects, line
  dots, line/area paths (`area` keeps `fill-opacity:0.14;stroke:none` in
  the same style), scatter dots; legend swatches unchanged (`background:`)
- Hover guideline: `attachChartCursor()` appends a `<line class="chart-cursor">`
  to the freshly-rendered SVG and maps pointer coordinates into the viewBox
  via `createSVGPoint` + `getScreenCTM().inverse()`, so the guide tracks
  correctly at any rendered scale; vertical types get a vertical guide
  (viewBox y 20→400), horizontal bars get a horizontal span (x 170→782)
  whose y follows the cursor; `pointerleave` hides it; pie/donut get none
- `.chart-cursor` CSS: `var(--rv-border-active)` stroke, dashed, 0.8
  opacity, `pointer-events: none`

### Files
`static/index.html` (+132/−13: four theme palette blocks of ten, the var
palette array, nine attribute→style conversion sites, the cursor CSS and
`attachChartCursor`)

### Tests
Playwright 68 → 70 (+2): the palette test asserts the inline
`fill:var(--rv-chart-1)` write, then flips Light → Nord through the real
theme menu and shows the same chart element resolves to a different
computed colour without being re-rendered; the cursor test drives the
pointer across the rendered bar chart (guide hidden → follows pointer with
x decreasing leftwards → hides on leave), verifies pie wheels render no
cursor line, and checks the hbar x-span (170→782) with vertical tracking.
JS parse gate re-run clean; no backend change.

---

## 18. `4df1646` — feat(csv): histogram, bubble, heat map chart types

**Summary.** The Charts view grows from 8 to 11 shapes, closing out stage
7c. All three new renderers build on the existing theme-variable palette
(§17), reuse `csvChartGroups` bucketing and the 40-bucket cap, and need no
new dependencies:

- **Histogram** — equal-width bins over the numeric X column (10 bins
  across [min…max], bar height = row count per bin); non-numeric X gets
  a helpful empty state. A distribution view right inside the viewer —
  the row set is the actively filtered one, like every other shape.
- **Bubble** — one bubble per X bucket with area-proportional radius
  (√ value scaling against the nice-rounded max) and the aggregate shown
  in the tooltip; with a colour column the bucket takes its dominant
  entry's series colour. Sorted descending with a merged "Other" bucket
  past 40.
- **Heat map** — colour-entry rows × X-bucket columns grid; cell opacity
  ramps `0.04…0.96` with value/maxV so empty pairings read as an empty
  grid, tooltips carry "bucket / colour: value", rows share the colour
  legend. Whole-grid view of a category-crossed measure in one glance.

### Added
- Picker options: Histogram, Bubble, Heat map (between Scatter and Pie)
- Three renderer branches in `renderCSVChart` (histogram is pure-numeric
  driven, bubble/heat ride `csvChartGroups` + `bucketTotal` + `legendFor`)
- Titles: histogram = "rows by <X> bin"; bubble/heat = the shared
  `chartTitle()` (agg(measure) by X · colour: …)

### Files
`static/index.html` (+226/−0), `tests/repoview.spec.ts` (+72/−0),
`CHANGELOG.md` (+1/−0), `CHANGES.md` (+51/−5), `README.md` (+1/−1),
`TODO.md` (+7/−5)

### Tests
Playwright 70 → 73 (+3): histogram bins the `weight` column (bar count
clamped 3…10, "rows" in the bin title, non-numeric X → empty state),
bubble renders one area-scaled bubble per category (3 circles, radii
> 20, bucket labels, aggregate tooltips) and the heat map switches from
one value row (3 cells) to a 3×3 colour grid where the strongest cell
reaches `fill-opacity:0.96`, empty pairings sit at `0.04`, and cross
cells carry "bucket / colour" titles.

---

## 19. `83afeea` — docs: README screenshots (charts/themes, code view, read-as)

**Summary.** The README gains a *Screenshots* section with three staged
stills of the running app, filmed after stage 7c landed. The stageshow
craft rules were applied as the framing discipline (one story per frame,
restrained real strings, no dead corners), but the frames are real
captures of the live product in Playwright — no faux rebuild — because
the product itself runs on this machine; a fake UI of a screenshotable
app would undercut the truthful-fidelity story the viewer sells.

### Added
- `docs/screenshots/charts-themes-nord.png` — Bubble chart of
  `testdata/colors.csv` by category in the Nord theme, theme menu open
  as the satellite (stage 7b/7c story)
- `docs/screenshots/code-view-dark.png` — `main.go` code view in the
  Dark theme, Chroma class-based highlighting (the GitHub-locally story)
- `docs/screenshots/read-as-wiki.png` — the Read-as menu open over the
  wiki-rendered `wiki-notes.txt` with resolved/aliased/dangling anchors
- README section between the demo GIF and *Why*, each still with a
  two-line caption

### Files
`docs/screenshots/*` (3 new PNGs, ~734 KB total), `README.md` (+21),
`CHANGELOG.md` (+1/−0), `CHANGES.md` (+48/−9), `TODO.md` (+7/−3)

### Tests
Docs-only commit; gates re-run green (73/73 Playwright).

---

## 20. `15d8c0e` — fix(ui): theme menu clears the sidebar on short paths

**Summary.** Owner-report: on short paths the open theme menu is
blocked by the sidebar. Reproduced by measurement on `/main.go` at
1440px: the menu spans x 208–428 while the sidebar ends at x 250, so its
left ~42px (rounded corner, shadow, the left strip of every row) paints
under the sidebar tree — confirmed by both `elementFromPoint` hit-tests
and a screenshot. Long paths only looked fine because enough crumb text
pushed the menu clear of the sidebar column.

Two causes, both fixed in `static/index.html`:

1. **Position — the wrap never pinned right.** `margin-left: auto` sat
   on `#theme-toggle` *inside* the content-sized `#theme-menu-wrap`
   (a no-op), so the whole wrap trailed the breadcrumbs (wrapRight 428
   on `/main.go` vs 521 on `/testdata/wiki-notes.txt`, barRight 1440 for
   both). The auto margin now lives on `#theme-menu-wrap`: the toggle +
   menu hug the bar's right edge at every path length — the original
   intent of the toggle rule.
2. **Stacking — the menu was trapped in the sticky bar's subtree.**
   Its `z-index: 90` was scoped inside `#breadcrumb-bar`'s sticky
   `z-index: 5` context. Variant testing (seven injected permutations,
   all hit-tested) showed the deeper truth: even explicit root-level
   ordering (`#main` z-1, `#sidebar` z-0, bar will-change, scroller
   demotion, wrap translateZ) still lost to the sidebar's composited
   tree on overlap — sticky subtrees inside this flex layout rank under
   it regardless of inner z, while plain main content wins. So the menu
   leaves the subtree entirely: `position: fixed`, anchored
   `top: 42px` (the bar's constant 36px height + 6px gap) and
   `right: 24px` (the bar's padding, so the menu's right edge aligns
   with the toggle; `right: 12px` in the ≤768px block — placed *after*
   the base `#theme-menu` rule, since the theme section sits below the
   mobile block in source order and an equal-specificity override that
   precedes the base gets ignored).

### Files
`static/index.html` (+20/−4), `tests/repoview.spec.ts` (+44/−0),
`CHANGELOG.md` (+1/−0), `CHANGES.md` (+53/−1), `TODO.md` (+20/−12)

### Tests
Playwright **+2 (73 → 75)** — new `Theme menu` describe: "opens clear of
the sidebar on short paths" (menu-left ≥ sidebar-right, menu pinned to
the bar edge ±48px, and `elementFromPoint` at the menu's left edge
resolves inside `#theme-menu`) and "stays clickable above a very wide
sidebar" (inline 1100px sidebar at a 1280px viewport — overlaps ~64px of
menu and must still win the hit). Both fail red pre-fix. A mobile probe
at 420px shows menu-right = toggle-right = 408px. Full gate battery
re-run green.

---

## 21. `e2f78ef` — fix(ui): padded line-number gutters across all numbered views

**Summary.** The owner asked to add right padding to the numbered lines
inside code files. Where the numbers come from, verified by a rendered-
markup sweep across every view that emits them:

- **Code views (chroma)** — `/api/file` returns the *inline* line-number
  variant: each line is a `<span class="line">` holding a
  `<span class="ln">   1</span>` followed by the code in `<span class="cl">`.
  This covers `.py`, `.go`, `.json`, `.yaml` and any other lexed file,
  plus the HTML file *Code* tab and the XML viewer's *Code* tab (39
  numbered lines on `sample.xml`), and any `?as=code` flow — all of them
  render through the same formatter (`main.go:710–712`).
- **Plain-text reading view** — numbers come from a CSS `::before`
  counter on `.plain-line`, already spaced `width: 3em; margin-right:
  1.25em`, so no change was needed there.
- **Markdown fences** — render with no chroma and **no line numbers at
  all** (0 `.ln` spans in a rendered markdown body), so there is nothing
  to pad today; the new rule scopes `.markdown-body .ln` anyway so the
  gap applies automatically if numbering is ever switched on there.

The chroma `.ln` spans previously had `padding-right: 0`. The existing
number-column rule at index.html only listed the *table* variant classes
(`.lnt/.lntd/.lntable`) — never emitted by this chroma version — so the
rule now also covers the live `.ln` class: numbers take
`color: var(--rv-text-tertiary)` as originally intended, and the gutter
gains `padding-right: 1.25em` (16.25px at the 13px mono), exactly
matching the plain-text view's gutter so both feel like one design
decision across views. `text-align: right` and `user-select: none`
finish it (numbers stay out of copied code).

### Files
`static/index.html` (+17/−1), `tests/repoview.spec.ts` (+59/−0),
`CHANGELOG.md` (+1/−0), `CHANGES.md` (+47/−1), `TODO.md` (+4/−3)

### Tests
Playwright **+4 (75 → 79)** — new `Line-number gutter` describe: code
views (`.py`/`.json`/`.go`/`.yaml` via the sidebar) assert computed
`padding-right: 16.25px`; the XML and HTML "Code" tabs assert the same;
markdown fences assert no numbered lines exist (pinning the scoping
decision); the reading view (numbers toggled on) asserts its existing
1.25em margin. Full gate battery re-run green.

---

## 22. `a7f6a21` — docs: documentation.md with the theming + custom-themes guide

**Summary.** New top-level `documentation.md`, linked from the README,
carrying the theming reference:

- The mechanism table — four 44-variable `[data-theme]` blocks, the boot
  IIFE (`localStorage('rv-theme')` validated against the allowlist,
  `prefers-color-scheme` fallback, attribute set before first paint),
  the picker (`THEMES` + swatch chips + Mermaid remap), class-only chroma
  output at `main.go:710–712`, and chart fills written as
  `var(--rv-chart-1…10)`
- **Custom themes** — the 44-variable contract grouped (25 page-shell +
  9 chroma tokens + 10 chart series, all four built-in blocks verified
  structurally identical), a complete worked `[data-theme="dracula"]`
  example block, the two registration spots (boot allowlist list + the
  `THEMES` picker array with the `swatch: [background, accent]` format),
  a verification checklist, and structural notes: the source-order
  gotcha for same-specificity media overrides (the `15d8c0e` lesson),
  Mermaid's binary light/dark mapping, and the fact that custom ids don't
  participate in `prefers-color-scheme`

### Files
`documentation.md` (new, +132), `CHANGES.md` (+37/−5), `README.md` (+1),
`CHANGELOG.md` (+1), `TODO.md` (+1/−1)

### Tests
Docs-only commit, no behavior change; gates green (79/79).

---

## 23. `aac917e` — feat(ui): collapse & fold for hierarchical views

**Summary.** The owner asked for a simple collapse switch for
hierarchical file types — python functions, JSON, XML, markdown titles,
etc. A sweep found markdown *titles* already fully collapsible
(`wrapCollapsibleSections` + per-file persistence at
`getCollapseStorageKey`), so the new work is the two missing surfaces —
chroma code views and the XML Tree tab — sharing one visual language
(carets + a header Collapse/Expand switch) and one policy (session-only
state; markdown keeps its per-file persistence):

- **Code views (indent-based folding).** Chroma's flat output needs no
  wrapper element: `applyCodeFolds` reads each line's `.cl` leading
  indent (tabs count 4) and marks a line foldable when a deeper line
  follows — the hidden range runs to the last line deeper than the
  start (blank lines are neutral, `Infinity`), so a fold covers a
  function body, JSON nesting, YAML blocks, gofmt'd Go and
  uniformly-indented HTML. For Python functions it's exactly
  PEP-8-reliable. Unfolding is a class toggle on the following line
  spans (`.folded → display:none`), with an `⋯` ellipsis marker on the
  collapsed start line. The caret lives in the gutter: every line gets
  a one-glyph slot (▾ on fold starts, a blank elsewhere) so the code
  column stays aligned across foldable and non-foldable lines;
  `.ln` stays `user-select:none`, so slots never leak into copies. The
  gutter caret toggles a single fold; a `Collapse`/`Expand` switch in
  `.file-header-actions` (the file header bar) collapses/opens all
  ranges at once and appears **only when foldable ranges exist** —
  plain-text reading views and the flush-left `sample.html` Code tab
  correctly get none.
- **Coverage.** Wired into the generic code-file branch (`.py`, `.go`,
  `.json`, `.yaml`…), the HTML file Code tab (its chroma output rides
  `rawContent`) and the XML viewer's Code tab — plus the markdown Code
  tab naturally goes without (source has no indent hierarchy; md
  *titles* are the existing collapsible sections).
- **XML Tree tab.** `nodeHTML` emits a `▾` caret on every node with
  children; a delegated click on `viewWrap` (survives filter re-renders)
  toggles `collapsed` on the node, hiding its `.xml-children` UL and
  rotating the caret with the same `⋯` marker. The same header switch
  collapse-alls / expands-all the tree — one button drives both tree
  and Code-tab modes, shown only when the current view has fold targets
  (never on Table).

### Files
`static/index.html` (+287/−1), `tests/repoview.spec.ts` (+147/−0),
`CHANGES.md` (+68/−5), `TODO.md` (+5/−4), `CHANGELOG.md` (+1/−0)

### Tests
Playwright **+4 (79 → 83)** — new `Collapse & fold` describe: python
folds via the gutter caret assert 2 ranges on `sample.py`, 2 hidden
lines after folding, 3 visible lines remain, and the `⋯` marker;
the JSON fold switch asserts collapse-all → `Expand` label → expand-all
round-trip; XML tree carets assert a collapsed node hides its child UL
(`display:none`) and un-collapses; the XML switch + Code tab test
collapse-alls all 7 foldable nodes, then the same switch folds the
chroma source on the Code tab. A flush-left HTML fixture is a negative
control in the probe stage (0 foldables, no switch). Full gate battery
re-run green (83/83; Go tests, vet, gofmt, JS parse).

---

## 24. *(this commit)* — feat(ui): styled fold switch + Dark rose theme

**Summary.** Three follow-ups from the owner, scoped exactly: give the
new collapse/fold switch real styling, ship a pink-shaded version of
the dark theme, and update the documentation.

- **Fold switch styling.** `.fold-switch` was a bare button falling back
  to OS default styling. It now shares the standalone header
  action-button rule set with `.outline-btn` (the same declarations
  `.edit-dropdown-btn` uses for "Read file as"/Edit): themed
  `--rv-bg-secondary` surface, `--rv-border` hairline, 6px radius,
  `/hover → --rv-bg-hover`, and an `.active` state
  (`--rv-bg-active` + `--rv-border-active` + `--rv-link` text) — which
  maps 1:1 onto the switch's existing "all collapsed" state. One
  consistency fix rides along: `.outline-btn` gains
  `font-family: inherit` (it was rendering in the browser default font),
  matching the dropdown buttons it sits beside.
- **Dark rose theme.** A fifth registered colorway: the `dark` block's
  full 44-variable contract hue-rotated into warm rose/mauve (same
  structure, same contrast levels) — plum shell surfaces, pink-tinted
  text ramp, pink `--rv-link`, pink-forward chroma tokens, and a
  10-entry pink-forward chart ramp. Registered in both spots the guide
  specifies: the boot allowlist (`localStorage` restore) and the picker
  `THEMES` array with a `['#2a1f27', '#f38bc5']` swatch. Id `rose`,
  label `Dark rose`, `color-scheme: dark`. Mermaid keeps mapping any
  non-`light` id to its dark preset, so diagrams render correctly with
  no extra code.
- **Documentation.** `documentation.md` updated for five themes/blocks
  (mechanism-table line ranges re-measured against the current file:
  theme blocks ~10/60/112/163/215, boot IIFE ~2366–2376, picker `THEMES`
  ~2499), plus two structural notes: `rose` is the shipped live example
  of a tinted take on an existing block, and the fold switch shares the
  outline-btn rule set for future header buttons. README's theming
  bullet moves to "Five-way theming" in both places it appears.

### Files
`static/index.html` (+64/−5), `tests/repoview.spec.ts` (+141/−2),
`CHANGES.md` (+57/−1), `documentation.md` (+16/−10), `TODO.md` (+5/−4),
`README.md` (+2/−2), `CHANGELOG.md` (+2/−0)

### Tests
Playwright **+5 (83 → 88)** — new `Dark rose theme` describe (menu →
`data-theme="rose"` + `localStorage`, body bg `rgb(42, 31, 39)`,
`--rv-link` `#f5a8c6`, code tokens resolve through `--rv-code-key`,
persistence across reload) and new `Fold switch styling` describe
(computed-style probes asserting the switch matches resolved theme vars
at rest and when active, in both Light and Dark rose — no hardcoded
colors). The existing picker test's row matcher is exact now
(`^label(✓)?$`, tolerating the active-row check mark) and its menu
count asserts **5** items. Full gate battery re-run green (88/88; Go
tests, vet, gofmt, JS parse).

---

## Cross-index by area

### Backend — `main.go` / `main_test.go`
| Change | Commit |
|--------|--------|
| `tooLarge` cap (>16 MB), `405` on non-GET, same-origin `/ws` | `c7edfaf` |
| `as=` renderer override (txt/md/csv/xml) | `abcceb0`, `d5d5d3c` |
| `isPlainText` flag for `.txt` reading view | `34fec62` |
| Chroma class-based token formatter (`WithClasses`) | `a507635` |
| `as=wiki` override: force wiki expansion anywhere | `2e01bad` |
| `isXML` / `rawXML` flags | `d5d5d3c` |

### Frontend — `static/index.html`
| Change | Commit |
|--------|--------|
| Download affordance for large files | `c7edfaf` |
| "Read file as" menu + `?as=` plumbing | `abcceb0`, `d5d5d3c` |
| Plain-text reading view (wrap, line numbers) | `34fec62` |
| CSV filter toolbar, chips, live count | `4912f7d` |
| XML viewer (tree/table/code + filters) | `d5d5d3c` |
| SVG chart engine + 8 chart types | `0e33fb0` |
| Chip body removes filter | `4912f7d` (✕), `0e33fb0` (body) |
| Four-way theme picker + themed chroma/plain-text CSS | `a507635` |
| CSV column sorting from headers + control labels | `7d100c3` |
| "Wiki Markdown" read-as menu item | `2e01bad` |
| Chart series palette via theme vars + hover guideline | `78d7266` |
| Histogram / bubble / heat map chart types | `4df1646` |
| README screenshots (charts/themes, code, read-as) | `83afeea` |
| Theme menu clears the sidebar on short paths | `15d8c0e` |
| Padded line-number gutters across numbered views | `e2f78ef` |
| documentation.md + custom-themes guide | `a7f6a21` |
| Collapse & fold for hierarchical views | `aac917e` |
| Styled fold switch & Dark rose theme | *(this commit)* |

### Docs
| Change | Commit |
|--------|--------|
| API reference table refresh | `3133a95`, `abcceb0`, `d5d5d3c` |
| Feature list: read-as, filters, charts, XML; `CHANGES.md` created | `1be8d7c` |
| README feature bullet for theming | `a507635` |
| Debian dev-env setup, `TODO.md` handover notes, this file brought current | `f6cb0ee` |
| README "Access from other devices" cross-device guide | `583f1fd` |
| MIT license summary table (choosealicense.com) | `6dfd6ee` |
| `CHANGELOG.md` `[Unreleased]` entries per commit | all feature/fix commits |

### Tests & fixtures
| Change | Commit |
|--------|--------|
| Backend hardening + as/xml/override tests | `c7edfaf`, `abcceb0`, `34fec62`, `d5d5d3c` |
| `tests/repoview.spec.ts` 43 → 59 → 62 tests | filter/x txt/xml/charts commits, then theme commits |
| Theme suite (menu cycle, dark `.txt` regression, classed code view) | `a507635` |
| Sort/label suite + read-as-wiki suite; `wiki-notes.txt` fixture | `7d100c3` (sort), `2e01bad` (wiki) |
| Playwright webServer without mise; 60 s boot timeout | `d8c7919` |
| Fixtures: `testdata/colors.csv`, `testdata/sample.xml` | `4912f7d`, `d5d5d3c` |

---

## Verification state (at this checkpoint)

| Gate | Result |
|------|--------|
| `go build -o repoview .` | pass |
| `go vet ./...` | pass |
| `gofmt -l .` | clean |
| `go test ./...` | `ok repoview` |
| Playwright (Chromium) | **88 / 88 passed** — 83 at `aac917e`; +5 fold-switch/rose tests at *(this commit)* |
| Frontend script parse gate (`new Function` over all `<script>` blocks) | pass (3 blocks) |

## Deferred (branch follow-up)

- ~~Stage 7b — chart palettes + hover guideline~~ — shipped `78d7266`
- ~~Stage 7c — histogram / bubble / heatmap chart types~~ — shipped `4df1646`
- ~~Stage 8 — screenshots for README/demo~~ — shipped `83afeea`;
  remaining action: push `feat/viewer-upgrade` and open the PR (draft text
  handed to the owner — `gh` is not installed and the remote needs
  credentials, so pushing is the owner's call)

## Deferred (not in this branch yet)

(none)
