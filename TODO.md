# RepoView — work-in-progress notes / handover

> Temporal scratch file: keep writing in-progress state here (next changes,
> found bugs, environment notes). Last updated: 2026-11-04 (device handover
> to a minimal Debian install).

## Branch state (as of handover)

- Branch `feat/viewer-upgrade`, based on `master` (v0.17.0)
- **12 commits, ALL UNPUSHED** — the ZIP includes `.git`, so after switching
  devices run (from the extracted repo):
  ```bash
  git log --oneline -12     # verify history came along
  git push origin feat/viewer-upgrade
  ```
- Commit list (newest last):
  | Commit | Title |
  |--------|-------|
  | `c7edfaf` | fix(api): harden file server and websocket |
  | `3133a95` | docs(api): refresh API reference table |
  | `abcceb0` | feat(view): read file as plain text, markdown or csv |
  | `34fec62` | fix(ui): dedicated plain-text reading view for .txt |
  | `4912f7d` | feat(csv): advanced column filter toolbar |
  | `a283525` | style: gofmt update_test.go |
  | `d5d5d3c` | feat(xml): xml viewer with tree, table and filters |
  | `0e33fb0` | feat(csv): SVG chart engine + core charts |
  | `1be8d7c` | docs: refresh README features and add unified CHANGES.md |
  | `a507635` | feat(theme): four-way color system (Light/Dark/Nord/OpenCode Orng) |
  | `d8c7919` | ci(tests): Playwright webServer runs without mise; 60 s boot timeout |
  | *(this docs commit)* | docs: handover notes and theme entry |
- Last verified state: `go build` ✅ · `go vet` ✅ · `gofmt` clean ✅ ·
  `go test ./...` ok ✅ · **Playwright 68/68 passed** ✅ (through CHANGES.md
  §14)
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
5. **Stage 7b** — chart palettes / hover-polish; **Stage 7c** — histogram,
   bubble, heatmap chart types; **Stage 8** — `stageshow` docs screenshots +
   create the PR for `feat/viewer-upgrade`.

## BUGS / open questions

- **"Dark UI renders .txt as white background" (reported by user)** —
  NOT reproducible on this build with any flow (``/example.txt``,
  `?as=txt`, sidebar click after dark toggle, `UPPERCASE.TXT`, dark OS
  preference). Mitigations shipped in `a507635`: explicit theme backgrounds
  on `pre.plain-text`/`.source-code`, class-based chroma tokens. If it still
  reproduces on the user's device, prime suspect = stale cached
  index.html from an older binary → hard-reload (Ctrl+F5) / restart the
  server. Record further findings here if it recurs.
- **Mermaid loads from jsdelivr CDN** — on an offline/air-gapped
  environment diagram rendering will fail (JS console error, md text still
  readable). Candidate follow-up: vendor the script or lazy-load with a
  fallback notice.
- **Playwright webServer** — FIXED in `d8c7919`: the config used to invoke
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
