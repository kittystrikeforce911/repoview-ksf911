# RepoView — work-in-progress notes / handover

> Temporal scratch file: keep writing in-progress state here (next changes,
> found bugs, environment notes). Last updated: 2026-11-04 (device handover
> to a minimal Debian install).

## Branch state (as of the theme-menu fix, 2026-11-04)

- Branch `feat/viewer-upgrade`, based on `master` (v0.17.0)
- **31 commits, ALL UNPUSHED** — stages 1–8 (CHANGES.md §13–§19) plus the
  theme-menu fix (§20), the line-number gutter padding (§21), the
  documentation.md theming guide (§22), collapse & fold (§23) and the
  styled fold switch + Dark rose theme (§24): CSV sort
  + labels, wiki read-as, cross-device
  access, MIT table, chart palettes + hover guideline (7b), histogram/
  bubble/heat map (7c), README screenshots (stage 8, `8a01525`), hash
  pinning (`462f316`), TODO refresh (`811f9d8`). Stage 8's PR is drafted,
  not opened: `gh` is not installed and pushing needs credentials, so see
  the owner-facing draft at `~/Desktop/pr-feat-viewer-upgrade.md` — do
  not push without the owner's go-ahead. Verify state with:
  ```bash
  git log --oneline -23     # history intact after device switches
  git rev-list --count origin/master..HEAD   # expect 23
  ```
- Commit list (newest last):
  | Commit | Title |
  |--------|-------|
  | `1587af6` | fix(api): harden file server and websocket |
  | `084cbf6` | docs(api): refresh API reference table |
  | `019f505` | feat(view): read file as plain text, markdown or csv |
  | `9a13562` | fix(ui): dedicated plain-text reading view for .txt |
  | `338a589` | feat(csv): advanced column filter toolbar |
  | `790bcb1` | style: gofmt update_test.go |
  | `7dbcf87` | feat(xml): xml viewer with tree, table and filters |
  | `f8354d8` | feat(csv): SVG chart engine + core charts |
  | `1d3fd96` | docs: refresh README features and add unified CHANGES.md |
  | `5f65ee0` | feat(theme): four-way color system (Light/Dark/Nord/OpenCode Orng) |
  | `4294154` | ci(tests): Playwright webServer runs without mise; 60 s boot timeout |
  | *(this docs commit)* | docs: handover notes and theme entry |
- Last verified state: `go build` ✅ · `go vet` ✅ · `gofmt` clean ✅ ·
  `go test ./...` ok ✅ · **Playwright 88/88 passed** ✅ (through CHANGES.md
  §24)
- Full change record: see `CHANGES.md` (per-commit detail + cross-index).
  Keep `CHANGES.md` updated with each new commit; `CHANGELOG.md` stays the
  per-commit `[Unreleased]` entry log.

## NEXT CHANGES (agreed roadmap, in order)

> Workflow note (portability-first): every stage below ships as one
> self-contained green commit in its own host/build environment — no new
> dependencies, frontend-only where possible, backend readable in one file
> (`main.go`).

1. ~~**CSV column sorting (click header) + descriptive labels**~~ —
   **SHIPPED as CHANGES.md §13** (click-to-cycle asc/desc/off,
   numeric-aware, `aria-sort`, labels across filter/sort/chart controls,
   Playwright 62 → 66).
2. ~~**Wiki Markdown in "Read file as"**~~ — **SHIPPED as CHANGES.md §14**
   (`as=wiki` forces `preprocessWikiLinks` + `WithUnsafe` even outside an
   `.obsidian` vault; menu item added; Go + Playwright suites extended).
3. ~~**Cross-device access on `--host 0.0.0.0`**~~ — **SHIPPED as CHANGES.md
   §15** (`TestCheckSameOrigin` LAN/IPv6/subnet cases; README
   *Access from other devices* section).
4. ~~**README: MIT license summary table (from choosealicense.com)**~~ —
   **SHIPPED as CHANGES.md §16** (Permissions/Conditions/Limitations table
   + link, grounded on the MIT page).
5. ~~**Stage 7b** — chart palettes / hover-polish~~ — **SHIPPED as
   CHANGES.md §17** (`--rv-chart-1…10` theme vars in all four themes;
   palette writes as inline `style="fill:var(--rv-chart-N)"`; hover
   guideline via `attachChartCursor`, pie/donut exempt; Playwright
   68 → 70).
   ~~**Stage 7c** — histogram, bubble, heatmap~~ — **SHIPPED as
   CHANGES.md §18** (three new shapes on the theme-variable palette;
   Playwright 70 → 73).
   ~~**Stage 8** — README screenshots~~ — **SHIPPED as CHANGES.md §19**
   (three staged stills in `docs/screenshots/`, filmed from the live app
   in Playwright with the stageshow framing rules; `gh` is not installed,
   so the PR itself is handed to the owner as a ready-to-run draft +
   push/PR commands — do not push without the owner's go-ahead).

## BUGS / open questions

- **"Theme menu blocked by the sidebar on short paths" (reported 2026-11-04)** —
  RESOLVED as `2eea88a` (CHANGES.md §20): `margin-left: auto` moved
  from `#theme-toggle` to `#theme-menu-wrap` so the toggle + menu pin to
  the bar's right edge, and the menu renders `position: fixed` anchored
  under the constant-height bar — it escapes the sticky-bar subtree that
  Chromium lets the sidebar out-paint (measured pre-fix: menu x 208–428
  vs sidebar ≤250 on `/main.go`; hit-tests plus a screenshot). The two
  new "Theme menu" Playwright tests fail red pre-fix (73 → 75).
- **"Dark UI renders .txt as white background" (reported by user)** —
  NOT reproducible on this build with any flow (``/example.txt``,
  `?as=txt`, sidebar click after dark toggle, `UPPERCASE.TXT`, dark OS
  preference). Mitigations shipped in `5f65ee0`: explicit theme backgrounds
  on `pre.plain-text`/`.source-code`, class-based chroma tokens. If it still
  reproduces on the user's device, prime suspect = stale cached
  index.html from an older binary → hard-reload (Ctrl+F5) / restart the
  server. Record further findings here if it recurs.
- **Mermaid loads from jsdelivr CDN** — on an offline/air-gapped
  environment diagram rendering will fail (JS console error, md text still
  readable). Candidate follow-up: vendor the script or lazy-load with a
  fallback notice.
- **Playwright webServer** — FIXED in `4294154`: the config used to invoke
  `mise x go` (fails without mise) with a 15 s timeout that a cold compile
  could exceed. It now uses plain `go run ..` on every platform with a 60 s
  boot timeout, and reopened the fallback: build + serve the binary
  yourself (`go build -o /tmp/opencode/repoview .`, then
  `/tmp/opencode/repoview -port 3123 -no-browser testdata`) — the suite
  reuses the listening server (`reuseExistingServer` when not CI). Free a
  stuck port with `fuser -k 3123/tcp`, never `pkill -f repoview`.

## Environment (this machine → minimal Debian)

- This machine runs tools via **mise** shims in `~/.local/bin`
  (`go`, `node`, `npx`). A stock shell may lack them → first command line:
  `export PATH="$HOME/.local/bin:$PATH"`.
- On the new minimal Debian device, install directly (no mise) — now
  documented step-by-step in `README.md` (Development → *Setting up a
  minimal Debian machine*):
  - `sudo apt-get install -y curl git ca-certificates build-essential unzip`
  - Go: untar the current GNU/Linux tarball into `/usr/local/go`
    (or `~/.local/go`), add `<dir>/go/bin` to PATH
  - Node.js LTS: untar into `~/.local/opt/node-*`, add its `bin` to PATH
  - Frontend tests: `cd tests && npm ci && npx playwright install --with-deps chromium`
    (needs apt deps — one-time; without them, backend-only gates still run)
- Per-command gates (same on every machine):
  ```bash
  go build -o repoview . && go vet ./... && go test ./... && gofmt -l .
  cd tests && npx playwright test
  ```
- Operational quirks to remember:
  - Free the test port with `fuser -k 3123/tcp` — NEVER `pkill -f repoview`
    (it self-kills the shell).
  - Playwright tests are rooted at `tests/` and serve testdata on :3123.
  - `page.evaluate(fn)` cannot close over test-scope variables — pass
    explicit args instead.
  - Run servers with `--no-browser` for CI/test use.

## Handover package

- `repoview-handover-YYYYMMDD.zip` (Desktop, next to this repo) contains the
  full repo INCLUDING `.git` history; excludes `tests/node_modules`,
  `tests/test-results`, `tests/playwright-report` (rebuild with npm ci /
  run the suite).
- After unzip on the new device: verify with the gates above, then
  `git push origin feat/viewer-upgrade`.
