# RepoView

A lightweight, single-binary local folder viewer that replicates the GitHub UI for browsing files, rendering Markdown, and viewing CSV data.

![repoview-demo](https://github.com/user-attachments/assets/940a295f-bbc4-4949-b1a1-770f39781b2c)

## Why

I noticed my marketing team, when working with Claude Code and lots of markdown files, pushing commits to GitHub just to read them with a nice UI. That seemed backwards — why should you need to commit and push just to preview your docs? RepoView gives you that same GitHub reading experience locally, instantly.

## Features

- **GitHub-style UI** — familiar layout with resizable sidebar, breadcrumb navigation, and file tree
- **Markdown rendering** — GitHub-Flavored Markdown via goldmark (tables, task lists, code blocks)
- **Read file as** — re-render any text file as plain text, Markdown, Wiki Markdown (Obsidian wiki links expand even outside a vault), a CSV table, or XML from a dropdown in the file header; plain `.txt` files open in a clean reading view with soft-wrap and line-number toggles
- **CSV filter toolbar** — per-column operators (contains, equals, regex, greater, less, empty), match all or any combination, removable filter chips (click the chip itself) and a live "Showing X of Y rows" count
- **CSV column sorting** — click a table header to cycle ascending → descending → off, numeric-aware (weights sort as numbers), `aria-sort` state, and every filter/sort/chart control carries a descriptive label + tooltip
- **CSV charts** — a Charts view beside the table with hand-rolled SVG visuals, no dependencies: bar, horizontal bar, stacked bar, line, area, scatter, pie and donut; choose the X column, numeric measure and aggregation (sum, avg, min, max, count), group by a colour column where it makes sense, and charts refresh live with the active row filters
- **XML viewer** — `.xml` files get Tree/Table/Code views with client-side element filtering via tag globs (`book*`), attribute matchers (`book@id=x`), text search and XPath (`//book[@genre='web']`)
- **Four-way theming** — Light (Obsidian palette), Dark (Catppuccin-inspired), Nord and OpenCode Orng colorways from a picker in the header; persisted per browser, with themed syntax-highlighted code views
- **Fuzzy file search** — press `t` to open a "Go to file" modal with fuzzy matching
- **Live reload** — WebSocket-based file watching with fsnotify; changes appear instantly
- **Single binary** — all HTML/CSS/JS embedded via `go:embed`, no external dependencies at runtime
- **Lazy-loading tree** — sidebar fetches directory contents on demand for fast startup on large repos
- **Auto-update** — checks for updates daily and can self-update with `repoview update`

## Install

### One-liner (macOS / Linux)

```bash
curl -fsSL https://raw.githubusercontent.com/nvquanghuy/repoview/master/install.sh | bash
```

Downloads the latest release binary for your OS/architecture to `~/.local/bin`.

### One-liner (Windows PowerShell)

```powershell
irm https://raw.githubusercontent.com/nvquanghuy/repoview/master/install.ps1 | iex
```

Downloads the latest release binary to `%LOCALAPPDATA%\Programs\repoview`.

### From source

```bash
go install github.com/nvquanghuy/repoview@latest
```

Or build locally:

```bash
go build -o repoview .
```

## Usage

```bash
cd ~/projects/myrepo && repoview
```

This starts a local server at http://localhost:7777 and opens your browser to browse the repo with a GitHub-style UI.

### Options

```bash
repoview                    # serve current directory on http://localhost:7777
repoview /path/to/dir       # serve a specific directory
repoview --port 3000        # use a custom port
repoview --host 0.0.0.0     # expose to the network (default: 127.0.0.1)
repoview --no-browser       # don't auto-open the browser
repoview --version          # print version and exit
repoview update             # download and install the latest version
repoview update --check     # check for updates without installing
```

### Flags

| Flag | Default | Description |
|------|---------|-------------|
| `--host` | `127.0.0.1` | Host/IP to bind to |
| `--port` | `7777` | Port to serve on |
| `--no-browser` | `false` | Don't auto-open the browser on startup |
| `--version` | | Print version and exit |

### Updating

RepoView checks for updates automatically once per day on startup. If a new version is available, you'll see a notification in the terminal.

To manually update:

```bash
repoview update           # download and install the latest version
repoview update --check   # check for updates without installing
```

The update command downloads the latest release from GitHub, shows release notes, and replaces the current binary.

### Access from other devices

Folder viewing is meant to live on your own network. Phones, tablets and
other machines on the same LAN can browse the repository served by any
machine running RepoView with `--host 0.0.0.0`:

```bash
repoview --host 0.0.0.0              # reachable by every device on the LAN
```

Then open `http://<server-ip>:7777` on the other device. The whole app
(browser UI, `/api/*` reads and the live-reload WebSocket) uses the address
you connect to, so no extra setup is needed. The WebSocket upgrade is
accepted from the same host you are browsing through — including a LAN IP —
and refused for pages served from foreign hosts; non-browser clients that
send no `Origin` header are unaffected.

## API

| Endpoint | Description |
|----------|-------------|
| `GET /api/tree?path=` | Returns immediate children of a directory as JSON |
| `GET /api/file?path=` | Returns rendered file content as JSON. Flags: `isMarkdown`, `isCSV`, `isSVG`, `isHTML`, `isXML` (+ `rawXML` for the DOM-parseable source), `isPDF`, `isJSONL`, `isBinary`, `tooLarge` (file exceeds the 16 MB inline cap → Download via `/api/raw`), `content` (rendered HTML), `rawContent` (code view), `rawCSV`, `rawSVG`, `mimeType`, `size`. Optional `&as=txt\|md\|csv\|xml\|wiki` overrides how the file renders ("Read file as" menu; `as=wiki` renders Markdown and expands Obsidian wiki links even outside an `.obsidian` vault) |
| `GET /api/raw?path=` | Serves the original file bytes for inline display and downloads (supports Range requests) |
| `GET /api/files` | Returns a flat list of all file paths (uses `git ls-files` when available) |
| `GET /api/jsonl?path=&page=&pageSize=` | Returns a page of JSONL records as pretty-printed JSON (max 100/page) |
| `GET /api/editors` | Returns available editors for the "Open in editor" feature |
| `POST /api/open?path=&editor=` | Opens a file in a configured editor (`vscode`, `cursor`, `sublime`, `zed`) |
| `WS /ws` | WebSocket for file change notifications (same-origin only) |

All read-only endpoints accept `GET`/`HEAD` only and answer `405` otherwise.

## Development

```bash
# Run locally
go run . /path/to/dir

# Run tests
go test -v ./...

# Frontend (Playwright browser) tests
cd tests && npm test

# Build
go build -o repoview .
```

### Setting up a minimal Debian machine

The branch is developed against a full toolchain. A fresh **minimal Debian**
install has none of it — no version managers, no distribution Go — so set it
up manually:

```bash
# Base tooling
sudo apt-get update && sudo apt-get install -y \
    git curl ca-certificates build-essential unzip xz-utils

# Go — official tarball (set GOVER to the current release from go.dev/dl)
GOVER=1.25.6
curl -L "https://go.dev/dl/go${GOVER}.linux-amd64.tar.gz" \
    | sudo tar -C /usr/local -xz
echo 'export PATH=$PATH:/usr/local/go/bin:$HOME/go/bin' >> ~/.profile

# Node.js LTS — official tarball into ~/.local/opt (current from nodejs.org)
NODEVER=v22.21.1
mkdir -p ~/.local/opt
curl -L "https://nodejs.org/dist/${NODEVER}/node-${NODEVER}-linux-x64.tar.xz" \
    | tar -C ~/.local/opt -xJ
echo "export PATH=$PATH:$HOME/.local/opt/node-${NODEVER}-linux-x64/bin" >> ~/.profile
```

Then in a new checkout, and for every gate run:

```bash
# Backend gate (no Node needed at all)
go build -o repoview . && go vet ./... && go test ./... && gofmt -l .

# Frontend / Playwright (one-time setup)
cd tests && npm ci
npx playwright install --with-deps chromium

# Frontend gate
npm test
```

Notes:
- Playwright's webServer boots `go run ..` on port 3123 with a 60 s timeout.
  A cold compile can still be exceeded: build and serve the binary yourself
  (`go build -o /tmp/repoview .. && /tmp/repoview -port 3123 -no-browser
  ../testdata`) and the suite reuses the already-running server.
- The plain-text view of `static/index.html` re-embeds on every `go build`;
  no Node step is required for backend-only work.

### Releasing

```bash
./release.sh          # bump patch: v0.1.0 → v0.1.1
./release.sh minor    # bump minor: v0.1.0 → v0.2.0
./release.sh major    # bump major: v0.1.0 → v1.0.0
./release.sh 2.0.0    # explicit version
```

This updates `CHANGELOG.md`, commits, tags, and pushes. GitHub Actions builds the release binaries.

### Project Structure

```
main.go              # Server, API handlers, WebSocket hub, file watchers
static/index.html    # Single-page frontend (embedded at build time)
static/index_test.html # Frontend test harness
main_test.go         # Backend unit and integration tests
testdata/            # Sample files used by tests
```

## License

MIT
