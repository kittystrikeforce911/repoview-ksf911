# Changelog

## [Unreleased]


## [v0.0.6] - 2026-11-13

- [fixed] `repoview update` no longer fails with "context deadline exceeded" on slow connections: the download no longer has a 60s cap on total time, and instead aborts only if no data arrives for 30s
- [added] `repoview update` shows a live download progress line (`3.1 / 7.4 MB (42%)  65 KB/s`) when run in a terminal; piped or logged output is unchanged

## [v0.0.5] - 2026-11-05

- [added] `go-releaser.sh` completed: a local cross-compiler mirroring the release workflow — an explicit argument sets the version stamp (latest `v*` tag by default, `dev` as fallback), the workflow's GOOS/GOARCH loop writes `dist/repoview-{linux,darwin}-{amd64,arm64}.tar.gz` (top-level `repoview`) and `dist/repoview-windows-{amd64,arm64}.zip` (top-level `repoview.exe`, packaged via python3's stdlib zipfile since the `zip` CLI isn't part of the base toolchain); it rebuilds `dist/` from scratch and never commits, tags or pushes
- [changed] README's Development → Releasing now carries a short analysis of both releasers — `release.sh` as the version clerk (bump, changelog rewrite, annotated tag embedding the release notes, push) and `go-releaser.sh` as the local builder — plus the naming contract both obey, covering the release-asset names `install.sh`/`install.ps1` hard-code against `releases/latest/download/`; the stale "pushes the tag to the fork" note is corrected to `origin`

## [v0.0.4] - 2026-11-05


## [v0.0.3] - 2026-11-05


## [v0.0.2] - 2026-11-05


## [v0.0.1] - 2026-11-05

- [changed] `colors.csv` charts still re-staged as a more complex graph — a bar plot of summed weight per colour name, tinted per category — and the README title now carries the web UI's `Files` octicon (`docs/files-icon.svg`)
- [added] Uninstall scripts: `uninstall.sh` removes the user-installed binary (and any pending self-update leftover) and RepoView's update state, `uninstall.ps1` does the same on Windows and also drops the install directory from the user PATH if it was added; both mirror the installer paths and the update-state layout, pinned together by a Go contract test

- [changed] README screenshots re-filmed on the current build: the charts/theme-picker, Dark code view and Read-as wiki stills were retaken after collapse & fold and the Dark rose theme landed, a fourth still (`docs/screenshots/folds-rose.png`) shows every fold of `main.go` collapsed in Dark rose, and the demo GIF is kept at the top with a note marking it as recorded on an earlier build
- [changed] Install and updating caveats re-phrased for a public repository instead of this repository's private-fork phase: authentication applies to private mirrors, and update checks stay silent until a tagged release is published
- [changed] Repository re-homed to `kittystrikeforce911/repoview-ksf911`: the README, installers (`install.sh`, `install.ps1`), the update checker (`repoview update` release API) and the release script now reference the new repository, the broken `go install <url>@latest` shortcut was replaced with clone-and-build steps, and `release.sh` pushes tags to the fork instead of the original upstream
- [changed] Documentation consolidated: `documentation.md` merged into `README.md` as the *Theming & custom themes* section (anchor `#theming--custom-themes`); de-duplicated the theming feature bullet; internal handover documents removed (`TODO.md`, `PRD.md`, `CLAUDE.md`, `AGENTS.md`) with the Mermaid-CDN limitation salvaged into README's *Known limitations*
- [fixed] API hardening: `/api/file` no longer renders arbitrarily large files inline (size cap above 16 MB now reports `tooLarge` with a Download link backed by `/api/raw`), read-only API endpoints reject non-GET requests with 405, and the `/ws` WebSocket now rejects cross-origin upgrades (same-origin host check) so web pages in other tabs cannot connect to your local viewer
- [fixed] Live-reload watches registered with Windows-style backslash paths now match change notifications on all platforms (watch keys are slash-normalized)
- [changed] Removed unused WebSocket hub goroutine (`hub.run`)
- [added] "Read file as" menu: any text file can now be re-rendered as plain text, Markdown, or a CSV table via a dropdown in the file header (URL param `?as=txt|md|csv`, backend `/api/file&as=…` renderer override)
- [changed] `.txt` files now render in a dedicated plain-text reading view (no syntax-highlighting noise) with soft-wrap and line-number toggles persisted per viewer
- [added] Advanced CSV filtering: a filter toolbar above the table with per-column contains / equals / regex / greater / less / empty operators, match-all or match-any combination, removable filter chips, live "Showing X of Y rows" count, and the server-rendered table restored verbatim when no filters are active
- [added] XML viewer: `.xml` files (and any file read as XML) get a Tree/Table/Code view with client-side element filtering — tag globs (`book*`), attribute matchers (`id=x` or `book@id=x`), text search and XPath (`//book[@genre='web']`) — plus a live match count; unparseable XML falls back to the Code view with a shown error message
- [added] Four-way theme picker in the breadcrumb bar: Light (Obsidian default palette), Dark (Catppuccin-inspired), Nord and OpenCode Orng colorways; the choice persists per browser and follows the OS preference while unset
- [fixed] Code views no longer carry light-mode colors: syntax highlighting now emits class-based tokens themed per color scheme, so dark themes render code correctly
- [fixed] Plain-text reading view paints explicit theme backgrounds instead of inheriting, guaranteeing dark colorways on `.txt` views
- [added] CSV charts: a Charts toggle in CSV views renders hand-rolled SVG visuals (no dependencies) — bar, horizontal bar, stacked bar, line, area, scatter, pie, donut — driven by X / measure / aggregate (sum, avg, min, max, count) / colour-by selects; charts follow the active row filters live, pie/donut show the top 9 categories plus "Other", vertical bars cap at 40 buckets plus "Other", and `?view=charts` restores the chart view
- [added] CSV column sorting: click any table header to cycle ascending → descending → off (status also in the count note), with `aria-sort` state, keyboard focus support (Enter/Space), a numeric-aware comparator (0.35 < 1.40 sorts as numbers), the server-rendered table restored verbatim when sorting is cleared, and record links still targeting their original row while sorted
- [fixed] Theme menu no longer opens underneath the sidebar on short paths (e.g. `/main.go`): the toggle + menu pin to the breadcrumb bar's right edge (`margin-left: auto` moved to `#theme-menu-wrap`) and the menu renders `position: fixed`, anchored under the constant-height bar, so it escapes the sticky-bar subtree Chromium lets the sidebar out-paint — pinned by two new Playwright tests (73 → 75)
- [fixed] Numbered-line gutters gain right padding: chroma code views (`.py`, `.go`, `.json`, `.yaml`, the HTML and XML "Code" tabs, `?as=code`) keep a 1.25em gap between the number column and the code — the same rhythm the plain-text reading view already used — with numbers de-emphasised to tertiary text and excluded from copies; markdown code blocks carry no line numbers today and the rule is pre-scoped for them
- [added] `documentation.md` — theming reference: how the four `[data-theme]` blocks + picker + class-only chroma + chart vars fit together, and a **Custom themes** guide (44-variable contract, worked example block, the two registration spots, verification checklist)
- [added] Collapse & fold for hierarchical views: chroma code views (`.py`, `.go`, `.json`, `.yaml`, the XML and HTML Code tabs) gain indent-based folds with a gutter caret per foldable line — click to hide/reveal a function body, JSON nesting or YAML block, with an `⋯` ellipsis marker on collapsed starts — and the XML Tree tab gains carets that hide child listings; a shared `Collapse`/`Expand` switch in the file header bar toggles everything at once, appearing only when something is foldable; folds are session-only (markdown headings keep their per-file collapsible sections)
- [added] **Dark rose** theme — a pink-shaded take on the Dark colorway (same 44-variable contract and contrast, hue-rotated into warm rose/mauve: plum surfaces, pink links/code tokens/chart ramp); registered in the picker and the boot allowlist so it restores across reloads
- [fixed] The fold switch (`Collapse`/`Expand` in the file header bar) is styled like the other header action buttons — themed surface, 6px radius, hover state, and an active (all-collapsed) state with accent border; the sibling outline button also picks up the same font fix
- [added] README *Screenshots* section with three staged stills of the running app: the Bubble chart on `colors.csv` drawn with the Nord palette and the theme picker open, `main.go` in the Dark code view (Chroma classes), and the Read-as menu open over a wiki-rendered note
- [added] Three more CSV chart shapes — **Histogram** (10 equal-width bins over a numeric column, row count per bin), **Bubble** (one area-scaled bubble per X bucket, √ value scaling, dominant colour entry wins) and **Heat map** (colour-entry rows × bucket columns, cell opacity ramping with the value) — 11 shapes total, all on the filtered row set, theme palettes and 40-bucket caps like the rest
- [changed] CSV charts now follow the active theme: the series palette resolves through `--rv-chart-1…10` variables (Light keeps the GitHub-bright ramp, Dark is Catppuccin, Nord the official ramp, OpenCode the Orng accents) and chart shapes drawn bar→pie agree with the theme in one place
- [added] Hover guideline on CSV charts: a dashed theme-accent line follows the pointer across the plot (vertical for most shapes, a horizontal span that tracks the cursor on horizontal bars), counting on `getScreenCTM` mapping so it stays accurate at any zoom; hidden until the pointer enters and after it leaves, never drawn on pie/donut
- [added] Cross-device access guide in the README (*Access from other devices* under Usage) — `repoview --host 0.0.0.0` plus `http://<server-ip>:7777` from any LAN device; the upgrade is documented alongside regression tests that pin the cross-device WebSocket behaviour (LAN IP and IPv6 pairings accepted, foreign hosts/ports rejected)
- [fixed] README License section now carries the choosealicense.com MIT summary (Permissions / Conditions / Limitations table with the source page linked)
- [added] **`as=wiki` renderer override ("Wiki Markdown" in the Read file as menu)**: any text file can be re-read as Obsidian-style wiki markdown — wiki links (`[[note]]`, `[[note|alias]]`, `[[note#heading]]`) are expanded by the client into navigable anchors (dangling targets marked broken) even when the served directory is not an `.obsidian` vault; vault detection for `.md` files is unchanged
- [added] Descriptive labels on the CSV controls: every filter control (column / rule / value / add / clear / match mode), every chart select (shape / X axis / measure / aggregate / colour by) and every table header carries an `aria-label` + tooltip spell-out of what it does (e.g. "Sort by rating — click to sort ascending")
- [changed] CSV filter chips can now be removed by clicking the chip itself, not just its ✕ button
- [fixed] CSV bar/stacked chart scale: the y-axis max was computed from an empty source when no colour column was set, so every bar rendered at full height with a 0–1 axis; the axis max is now derived from the same aggregated numbers the bars draw, and the chosen aggregate (avg/min/max) is honoured for bar rendering, not just counting
- [fixed] CSV filter toolbar and chips remain available in Charts view so filters can be edited while a chart is open

## [v0.17.0] - 2026-05-25

- [fixed] Relative links in folder README.md files now resolve correctly; directory URLs are normalized with a trailing slash so `[./file.md]` resolves to the correct path within the folder instead of the parent

## [v0.16.0] - 2026-05-20

- [added] HTML file rendering: `.html`/`.htm` files now show a rendered Preview (sandboxed iframe) with a Preview/Code toggle, mirroring Markdown/SVG behavior.
- [added] Obsidian wiki-link image embeds: `[[image.png]]`, `[[image.png|300]]` (width), `[[image.png|300x200]]` (width×height), and `[[image.png|alt text]]` now render as inline images resolved via the same fuzzy filename index as wiki links.

## [v0.15.0] - 2026-04-30

- [added] Dark mode toggle with eye-easing warm dark theme (Catppuccin-inspired), persisted via localStorage with OS preference detection as fallback
- [added] Sun/moon toggle button in breadcrumb bar for switching themes
- [changed] Refactored all CSS colors to use CSS custom properties for theme support

## [v0.14.0] - 2026-04-30

- [fixed] Obsidian wiki links inside markdown tables: `[[path\|alias]]` (backslash-escaped pipe, the form Obsidian uses to disambiguate from the table column separator) now parses correctly instead of producing a target with a trailing backslash.

## [v0.13.0] - 2026-04-29

- [added] Page title includes root folder name for easy tab identification

## [v0.12.0] - 2026-04-20

- [added] JSONL (JSON Lines) file viewer with server-side pagination for large files, three view modes (List, Compact, Raw), configurable page size, and malformed JSON error handling
- [added] JSONL pagination controls at both top and bottom of content for easier navigation
- [added] JSONL Compact view: expand/collapse buttons to show full JSON for each row, and "View in List" buttons that jump to specific records in List view with highlighting

## [v0.11.0] - 2026-04-05

- [added] Mobile-friendly responsive design: collapsible sidebar with hamburger menu, touch-optimized layout, full-width panels on small screens
- [added] Resizable outline panel (right sidebar) - drag the left edge to resize
- [fixed] Outline close button now clickable (resize handle no longer overlaps header)
- [fixed] Wiki links with heading anchors now correctly navigate to headings (mixed-case anchors are slugified to match heading IDs)

## [v0.10.0] - 2026-04-05

- [added] Obsidian wiki link support: when serving an Obsidian vault (directory containing `.obsidian/`), `[[wiki links]]` in markdown are converted to clickable links with frontend resolution.

## [v0.9.0] - 2026-04-05

- [added] Mermaid diagram rendering in markdown code blocks (flowcharts, sequence diagrams, class diagrams, etc.)

## [v0.8.0] - 2026-04-05

- [added] Folder listing now displays file size and last modified date

## [v0.7.0] - 2026-04-05

- [added] Inline PDF viewing using the browser's native PDF viewer

## [v0.6.0] - 2026-03-28

- [added] Markdown hard wraps: single newlines are now rendered as `<br>` tags, making line breaks visible in the preview.
- [fixed] Local images in markdown files now render correctly (image src rewritten to use /api/raw endpoint)
- [added] Windows support: release pipeline now builds Windows binaries (amd64/arm64) as .zip archives
- [added] PowerShell install script (`install.ps1`) for Windows one-liner installation
- [fixed] Path separators normalized to forward slashes in all API responses, fixing frontend on Windows
- [fixed] WebSocket file-change notifications now work correctly on Windows (path matching uses forward slashes)
- [fixed] Markdown frontmatter parsing now handles CRLF line endings (common on Windows)
- [fixed] Self-update uses pure Go archive extraction instead of shelling out to `sh`/`tar`, enabling updates on Windows
- [changed] VS Code editor setup URL now links to generic CLI docs instead of macOS-specific page

## [v0.5.1] - 2026-03-15

- [changed] Default port changed from 8080 to 7777 (less commonly used by other services)

## [v0.5.0] - 2026-03-06

- [added] Add "Edit" button with editor selection, open local computer code editors.

## [v0.4.0] - 2026-03-01

- [fixed] Live reload now works when files are added/removed in expanded folders. Fixed two issues: (1) backend now notifies clients watching parent directories, not just exact paths; (2) frontend now re-fetches all expanded directories during refresh so they stay expanded.
- [changed] Improved error messages: "Connection lost" banner now only shows for actual network failures. HTTP errors (e.g., file not found) show specific inline messages instead of the misleading connection error.
- [added] Outline sidebar for markdown files: click "Outline" button (next to Preview/Code toggle) to open a right sidebar with document headings. State persists in localStorage.
- [added] Clickable anchor links on markdown headings: hover over any heading to see the link icon, click to copy the URL with hash. Outline links also update the URL hash.

## [v0.3.1] - 2026-03-01

- [changed] Release script now includes changelog in git tag messages, making them visible on GitHub's tags page

## [v0.3.0] - 2026-03-01

- [added] Add update command and auto-update check
  - `repoview update` command to download and install the latest version
  - `repoview update --check` to check for updates without installing
  - Background update check on startup (at most once per day) with notification when update available
  - Update command shows release notes and link to GitHub release page

## [v0.2.0] - 2026-03-01
- [changed] Folder click behavior: clicking a non-selected folder navigates to it; clicking an already-selected folder toggles expand/collapse. Caret always toggles.
- [added] Active folder highlighting in sidebar when viewing a directory
- [added] Automatically find another port if default port is not available.
- [added] Add connection error banner when API fails

## [v0.1.0] - 2026-03-01

- [changed] Treeview: Clicking on folder icon also trigger collapse/expand of items. This allows easier toggle (wider surface click area).
- [added] CSV row-to-record navigation: click the arrow icon (→) in any table row to jump directly to that record in Records view. The URL updates to `?view=records&r=N` for easy sharing.
- [added] CSV Records view mode: toggle between Table and Records views for CSV files. Records view displays data as vertical cards, making wide CSV files easier to read. URL supports `?view=records` and `?view=records&r=N` for direct linking to specific records.
- [changed] Moved view toggle (Preview/Code, Table/Records) from breadcrumb bar to a new file header bar below the breadcrumb, following GitHub's layout. The file header bar also displays file metadata like size and MIME type for binary files.

## [v0.0.1] - 2026-02-28

- [added] README.md is rendered below directory listings (like GitHub) when present in a directory
- [fixed] Sidebar now scrolls to the active file when using "Go to file" search or navigating to deeply nested files
- [added] SVG files now have a Preview/Code toggle like markdown: preview renders the image inline, code view shows syntax-highlighted SVG source
- [added] Binary file handling: images display inline with preview, non-image binaries show metadata panel with file size, MIME type, and download link
- [added] `/api/raw` endpoint for serving raw file bytes (used for inline `<img>`, `<video>`, `<audio>` tags and downloads)
- [added] Binary detection via `net/http.DetectContentType` — prevents browser hang when opening large binary files
- [changed] Moved "Go to file" button from breadcrumb bar to sidebar, above the file tree, where it's closer to the files it searches
- [added] Markdown raw/preview toggle: switch between rendered preview and syntax-highlighted source code, like GitHub's "Code" / "Preview" tabs
- [added] View state persists in URL via `?view=code` query param (shareable and survives refresh)
- [fixed] Clicking the chevron icon on an expanded folder now collapses it (chevron toggles open/closed, clicking the folder name still navigates)
- [fixed] Fuzzy search now treats spaces as term separators (like GitHub/VSCode): typing "nes agg" matches "nested_aggregation.go" by matching each term independently
- [added] `--host` flag to control bind address (default `127.0.0.1` instead of `0.0.0.0` for safer localhost-only access)
- [fixed] Browser now opens `http://localhost:<port>` instead of `http://0.0.0.0:<port>` which isn't browsable on all OSes
- [added] GitHub Actions release workflow: cross-compiles for macOS and Linux (amd64/arm64) on `v*` tags and uploads tarballs to GitHub Releases
- [added] One-liner install script (`install.sh`) for teammates: detects OS/arch, downloads the right binary, installs to `~/.local/bin`
- [added] Tag-based versioning with ldflags injection and `release.sh` script
- [changed] Show dotfiles and dotfolders (e.g. `.github`, `.gitignore`) in the sidebar file tree
- [added] Pretty-print support for JSON and YAML files: minified/compact files are automatically formatted with proper indentation before syntax highlighting. Gracefully falls back to raw content if parsing fails.
- [added] Dynamic page title: shows `filename - RepoView` when viewing a file, `dirname - RepoView` for subdirectories, and `RepoView` at root
- [added] Playwright browser test suite (`tests/`) with 10 end-to-end tests covering sidebar tree, file viewing (markdown, CSV, code), frontmatter rendering, directory listing, parent navigation, fuzzy search, anchor links, and URL routing
- [added] Single-binary Go server with embedded static files (`go:embed`)
- [added] GitHub-style UI with resizable sidebar and breadcrumb navigation
- [added] Lazy-loading file tree via `/api/tree` endpoint
- [added] Markdown rendering with GitHub-Flavored Markdown (goldmark + GFM extensions)
- [added] CSV rendering to styled HTML tables
- [added] Fuzzy file search modal (press `t`) with custom fuzzysort implementation
- [added] WebSocket-based live reload with fsnotify file watching
- [added] Smart watcher: only watches expanded directories and the currently viewed file
- [added] Flat file listing via `/api/files` (uses `git ls-files` when available)
- [added] Auto-open browser on startup (`-no-browser` flag to disable)
- [fixed] `/api/file` endpoint now returns JSON (`content`, `name`, `path`, `isMarkdown`, `isCSV`) instead of raw HTML, matching the frontend's expected API contract
- [tests] Comprehensive backend test suite (`main_test.go`) with 14 tests covering tree, file, files, safePath, WebSocket, and static file serving
- [tests] Frontend test harness (`static/index_test.html`) covering `esc()`, `escAttr()`, `fuzzysort()`, JSON parsing, keyboard shortcuts, and live API calls
- [tests] Test data files (`testdata/`) for markdown, CSV, plain text, and nested directory scenarios
