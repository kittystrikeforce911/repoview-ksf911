# RepoView Documentation

Practical reference beyond the README. For the product tour see
[README.md](README.md); for the per-commit engineering record see
[CHANGES.md](CHANGES.md).

## Theming

RepoView ships four built-in themes — **Light** (Obsidian default light),
**Dark** (Catppuccin-based), **Nord** (official ramp) and **OpenCode
Orng**. Everything is CSS-variable driven and client-side; the server
never hard-codes a color.

### How the theme system works

| Piece | Where (`static/index.html` unless noted) | What it does |
|---|---|---|
| `[data-theme="…"]` blocks | lines ~10, ~60, ~111, ~163 | Four blocks × **44 `--rv-*` variables each** — page shell colors, 9 chroma token colors, 10 chart series colors |
| Boot IIFE | ~2225–2231 | Reads `localStorage("rv-theme")` (validated against the allowlist), falls back to `prefers-color-scheme` (dark → Dark, else Light), sets `data-theme` on `<html>` before first paint — no flash |
| Theme picker | `THEMES` array ~2355 + `setTheme()` / `renderThemeMenu()` ~2373+ | Builds the menu (id, label, two-color swatch chips); switching sets the attribute, persists to `localStorage`, and remaps Mermaid (any non-`light` id renders as `dark`) |
| Chroma code tokens | `main.go:710–712` | The file server emits **class names only** (`chromahtml.WithClasses(true)`, `WithLineNumbers(true)`, inline `.ln` variant) — token colors resolve through `--rv-code-*`, so one var block restyles every lexed file type |
| Charts | SVG chart engine | Series fills are written as `style="fill: var(--rv-chart-N)"`, so all 11 chart shapes re-color per theme automatically |

### Custom themes — how to add one (format & structure)

Adding a theme touches exactly two files' worth of edit in
`static/index.html` (the UI is embedded into the binary via `go:embed`,
so rebuild or `go run .` to see it):

1. **Choose the `id`** — a lowercase slug used as the `data-theme`
   attribute value and in `localStorage`, e.g. `dracula`.

2. **Append one `[data-theme="dracula"]` block** after the last theme
   block. The contract is **44 variables** — all four built-in blocks are
   structurally identical, and every surface (tree, markdown, code
   tokens, CSV charts, overlays, scrollbars) hangs off them:

   | Group | Variables |
   |---|---|
   | Page shell (25) | `--rv-bg`, `--rv-bg-secondary`, `--rv-bg-tertiary`, `--rv-bg-hover`, `--rv-bg-active`, `--rv-border`, `--rv-border-active`, `--rv-text`, `--rv-text-secondary`, `--rv-text-tertiary`, `--rv-link`, `--rv-icon-folder`, `--rv-resize-handle`, `--rv-scrollbar-thumb`, `--rv-scrollbar-thumb-hover`, `--rv-overlay`, `--rv-shadow`, `--rv-shadow-strong`, `--rv-error-bg`, `--rv-error-border`, `--rv-error-text`, `--rv-error-btn-hover`, `--rv-warning-bg`, `--rv-warning-border`, `--rv-warning-text` |
   | Code (chroma) tokens (9) | `--rv-code-key` (keywords), `--rv-code-str` (strings), `--rv-code-num` (numbers), `--rv-code-com` (comments), `--rv-code-fn` (functions), `--rv-code-cls` (classes/types), `--rv-code-tag` (tags), `--rv-code-attr` (attributes), `--rv-code-op` (operators/punctuation) |
   | Chart series (10) | `--rv-chart-1` … `--rv-chart-10` — sequential assignment to repeated series (line/area/scatter/dot colors, heat-map rows). Define **all ten**; a missing var renders its series with transparent fills |

   Each block also sets `color-scheme: dark` (or `light`), which drives
   native scrollbars and form controls. Worked example (values illustrative
   — adapt to the target palette):

   ```css
   [data-theme="dracula"] {
       color-scheme: dark;
       /* Page shell */
       --rv-bg: #282a36;
       --rv-bg-secondary: #21222c;
       --rv-bg-tertiary: #1e1f27;
       --rv-bg-hover: #343746;
       --rv-bg-active: #44475a40;
       --rv-border: #44475a;
       --rv-border-active: #bd93f9;
       --rv-text: #f8f8f2;
       --rv-text-secondary: #a0a2b5;
       --rv-text-tertiary: #6272a4;
       --rv-link: #bd93f9;
       --rv-icon-folder: #ff79c6;
       --rv-resize-handle: #bd93f940;
       --rv-scrollbar-thumb: #44475a;
       --rv-scrollbar-thumb-hover: #6272a4;
       --rv-overlay: #00000060;
       --rv-shadow: rgba(0, 0, 0, 0.30);
       --rv-shadow-strong: rgba(0, 0, 0, 0.45);
       --rv-error-bg: #42283a;
       --rv-error-border: #ff5555;
       --rv-error-text: #ff6e6e;
       --rv-error-btn-hover: #c74c4c;
       --rv-warning-bg: #3f3a2e;
       --rv-warning-border: #f1fa8c;
       --rv-warning-text: #e6d97a;
       /* Chroma tokens */
       --rv-code-key: #ff79c6;
       --rv-code-str: #f1fa8c;
       --rv-code-num: #bd93f9;
       --rv-code-com: #6272a4;
       --rv-code-fn: #50fa7b;
       --rv-code-cls: #8be9fd;
       --rv-code-tag: #ff79c6;
       --rv-code-attr: #50fa7b;
       --rv-code-op: #f8f8f2;
       /* Chart palette */
       --rv-chart-1: #bd93f9;
       --rv-chart-2: #50fa7b;
       --rv-chart-3: #ffb86c;
       --rv-chart-4: #ff5555;
       --rv-chart-5: #8be9fd;
       --rv-chart-6: #f1fa8c;
       --rv-chart-7: #ff79c6;
       --rv-chart-8: #6272a4;
       --rv-chart-9: #9580ff;
       --rv-chart-10: #b4befe;
   }
   ```

3. **Register it in the picker** — two spots in the script blocks:
   ```js
   // boot allowlist (~2225): saved themes outside this list fall back
   var THEMES = ['light', 'dark', 'nord', 'opencode', 'dracula'];
   // picker menu (~2355): entries render as menu rows
   var THEMES = [
       { id: 'light',    label: 'Light',         swatch: ['#ffffff', '#705dcf'] },
       { id: 'dracula',  label: 'Dracula',       swatch: ['#282a36', '#bd93f9'] },
       ...
   ];
   ```
   `swatch` is `[background, accent]` — the two mini-color-chips shown in
   the menu before the theme is applied. These preview hexes are the one
   intentional duplication in the system.

4. **Verify**: open the theme menu (the new row appears), switch to it,
   and check tree, a markdown file, a code file (token colors), a CSV
   Charts view (all 10 palette entries distinct) and a save/empty-warn
   state (error/warning colors). The choice persists across reloads via
   `localStorage`.

Structure notes learned by shipping the system:

- **Same-specificity overrides must come later in source order.** The
  `@media (max-width: 768px)` block sits *before* the theme section, so
  any mobile override of a theme-section rule added inside that early
  block is silently ignored — repeat the override after the base rule
  instead (this bit the theme-menu positioning fix, `15d8c0e`).
- Mermaid diagrams don't get their own palette — the picker only maps
  `light` vs everything else to Mermaid's `default`/`dark`.
- `prefers-color-scheme` picks only the built-ins; custom ids are always
  reachable through the menu (or `localStorage`).
