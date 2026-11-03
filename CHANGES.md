# CHANGES — `feat/viewer-upgrade`

Unified change record for the `feat/viewer-upgrade` branch: hardening of the
file-server API, three new reading experiences (re-rendering menu, plain-text
view, XML viewer) and a full CSV data layer (filter toolbar + SVG charts).

- Base: `master` (v0.17.0) · Branch: `feat/viewer-upgrade` · 8 commits, all unpushed
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

## Cross-index by area

### Backend — `main.go` / `main_test.go`
| Change | Commit |
|--------|--------|
| `tooLarge` cap (>16 MB), `405` on non-GET, same-origin `/ws` | `c7edfaf` |
| `as=` renderer override (txt/md/csv/xml) | `abcceb0`, `d5d5d3c` |
| `isPlainText` flag for `.txt` reading view | `34fec62` |
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

### Docs
| Change | Commit |
|--------|--------|
| API reference table refresh | `3133a95`, `abcceb0`, `d5d5d3c` |
| Feature list: read-as, filters, charts, XML | `abcceb0`, `d5d5d3c`, `0e33fb0` (this docs commit) |
| `CHANGELOG.md` `[Unreleased]` entries per commit | all feature/fix commits |

### Tests & fixtures
| Change | Commit |
|--------|--------|
| Backend hardening + as/xml/override tests | `c7edfaf`, `abcceb0`, `34fec62`, `d5d5d3c` |
| `tests/repoview.spec.ts` 43 → 59 tests | filter/x txt/xml/charts commits |
| Fixtures: `testdata/colors.csv`, `testdata/sample.xml` | `4912f7d`, `d5d5d3c` |

---

## Verification state (at this checkpoint)

| Gate | Result |
|------|--------|
| `go build -o repoview .` | pass |
| `go vet ./...` | pass |
| `gofmt -l .` | clean |
| `go test ./...` | `ok repoview` |
| Playwright (Chromium) | **59 / 59 passed** |
| Frontend script parse gate (`new Function` over all `<script>` blocks) | pass (3 blocks) |

## Deferred (not in this branch yet)

- Stage 7b — chart palettes (light/dark-friendly alternates) and hover
  guideline/cursor crosshair polish
- Stage 7c — more chart types (histogram, bubble, heatmap selector)
- Stage 8 — `stageshow` screenshots for README/demo, branch PR creation
