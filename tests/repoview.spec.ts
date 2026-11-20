import { test, expect } from "@playwright/test";

test.describe("Local mode (no auth)", () => {
  test("hides login and sharing controls", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#tree-container .tree-item").first()).toBeVisible();
    await expect(page.locator("#share-btn")).toBeHidden();
    await expect(page.locator("#shares-btn")).toBeHidden();
    await expect(page.locator("#logout-form")).toBeHidden();
    // The theme toggle still sits right after the search button.
    const search = await page.locator("#search-btn").boundingBox();
    const theme = await page.locator("#theme-toggle").boundingBox();
    expect(theme!.x - (search!.x + search!.width)).toBeLessThan(12);
  });
});

test.describe("Sidebar tree", () => {
  test("root loads and contains known files", async ({ page }) => {
    await page.goto("/");
    const sidebar = page.locator("#tree-container");
    await expect(sidebar.locator(".tree-item")).not.toHaveCount(0);
    await expect(sidebar.locator(".tree-item .label", { hasText: "hello.md" })).toBeVisible();
    await expect(sidebar.locator(".tree-item .label", { hasText: "data.csv" })).toBeVisible();
    await expect(sidebar.locator(".tree-item .label", { hasText: "subdir" })).toBeVisible();
  });

  test("html files get the HTML file icon", async ({ page }) => {
    await page.goto("/");
    const row = page.locator("#tree-container .tree-item", { hasText: "sample.html" }).first();
    await expect(row.locator(".icon text")).toHaveText("HTML");
  });

  test("clicking chevron collapses an expanded folder", async ({ page }) => {
    await page.goto("/");
    const sidebar = page.locator("#tree-container");
    await expect(sidebar.locator(".tree-item")).not.toHaveCount(0);

    // Click the subdir label to expand it
    await sidebar.locator(".tree-item .label", { hasText: "subdir" }).click();
    const subdirRow = sidebar.locator(".tree-item", { hasText: "subdir" }).first();
    await expect(subdirRow.locator(".caret")).toHaveClass(/open/);
    // nested.md should be visible inside expanded subdir
    await expect(sidebar.locator(".tree-item .label", { hasText: "nested.md" })).toBeVisible();

    // Click the chevron to collapse
    await subdirRow.locator(".caret").click();
    await expect(subdirRow.locator(".caret")).not.toHaveClass(/open/);
    // nested.md should no longer be visible
    await expect(sidebar.locator(".tree-item .label", { hasText: "nested.md" })).not.toBeVisible();
  });

  test("clicking folder icon toggles expand/collapse", async ({ page }) => {
    await page.goto("/");
    const sidebar = page.locator("#tree-container");
    const subdirRow = sidebar.locator(".tree-item", { hasText: "subdir" }).first();

    // Initially collapsed
    await expect(subdirRow.locator(".caret")).not.toHaveClass(/open/);

    // Click the folder icon to expand
    await subdirRow.locator(".icon").click();
    await expect(subdirRow.locator(".caret")).toHaveClass(/open/);
    await expect(sidebar.locator(".tree-item .label", { hasText: "nested.md" })).toBeVisible();

    // Click the folder icon again to collapse
    await subdirRow.locator(".icon").click();
    await expect(subdirRow.locator(".caret")).not.toHaveClass(/open/);
    await expect(sidebar.locator(".tree-item .label", { hasText: "nested.md" })).not.toBeVisible();
  });

  test("clicking selected folder toggles expand/collapse instead of navigating", async ({ page }) => {
    await page.goto("/");
    const sidebar = page.locator("#tree-container");
    const subdirRow = sidebar.locator(".tree-item", { hasText: "subdir" }).first();

    // Click folder label to navigate (folder becomes selected and expanded)
    await subdirRow.locator(".label").click();
    await expect(subdirRow).toHaveClass(/active/);
    await expect(subdirRow.locator(".caret")).toHaveClass(/open/);
    await expect(page.locator("#content-area .dir-listing")).toBeVisible();

    // Click folder label again - should collapse (since already selected)
    await subdirRow.locator(".label").click();
    await expect(subdirRow.locator(".caret")).not.toHaveClass(/open/);

    // Click folder label again - should expand
    await subdirRow.locator(".label").click();
    await expect(subdirRow.locator(".caret")).toHaveClass(/open/);
  });

  test("active folder is highlighted in sidebar", async ({ page }) => {
    await page.goto("/");
    const sidebar = page.locator("#tree-container");
    const subdirRow = sidebar.locator(".tree-item", { hasText: "subdir" }).first();

    // Initially no folder is active
    await expect(subdirRow).not.toHaveClass(/active/);

    // Navigate to folder
    await subdirRow.locator(".label").click();
    await expect(subdirRow).toHaveClass(/active/);

    // Navigate to a file - folder should no longer be active
    await sidebar.locator(".tree-item .label", { hasText: "nested.md" }).click();
    await expect(subdirRow).not.toHaveClass(/active/);
    await expect(sidebar.locator(".tree-item", { hasText: "nested.md" })).toHaveClass(/active/);
  });
});

test.describe("File viewing", () => {
  test("markdown — rendered HTML with headings, table, heading IDs", async ({ page }) => {
    await page.goto("/");
    await page.locator(".tree-item .label", { hasText: "hello.md" }).click();
    const content = page.locator("#content-area");
    await expect(content.locator(".markdown-body")).toBeVisible();
    await expect(content.locator("h1")).toHaveText("Hello World");
    await expect(content.locator("h1")).toHaveAttribute("id", /./);
    await expect(content.locator("table")).toBeVisible();
    await expect(content.locator("td", { hasText: "Alice" })).toBeVisible();
  });

  test("CSV — rendered HTML table with data", async ({ page }) => {
    await page.goto("/");
    await page.locator(".tree-item .label", { hasText: "data.csv" }).click();
    const content = page.locator("#content-area");
    await expect(content.locator(".csv-table")).toBeVisible();
    await expect(content.locator("th", { hasText: "name" })).toBeVisible();
    await expect(content.locator("td", { hasText: "Alice" })).toBeVisible();
    await expect(content.locator("td", { hasText: "Tokyo" })).toBeVisible();
  });

  test("CSV — toggle between Table and Records view", async ({ page }) => {
    await page.goto("/");
    await page.locator(".tree-item .label", { hasText: "data.csv" }).click();
    const content = page.locator("#content-area");

    // Toggle should be visible with Table and Records buttons
    await expect(page.locator(".view-toggle")).toBeVisible();
    await expect(page.locator(".view-toggle button", { hasText: "Table" })).toBeVisible();
    await expect(page.locator(".view-toggle button", { hasText: "Records" })).toBeVisible();

    // Table view is active by default
    await expect(page.locator(".view-toggle button", { hasText: "Table" })).toHaveClass(/active/);
    await expect(content.locator(".csv-table")).toBeVisible();

    // Click Records to switch to records view
    await page.locator(".view-toggle button", { hasText: "Records" }).click();
    await expect(content.locator(".csv-records")).toBeVisible();
    await expect(content.locator(".csv-record-card")).toHaveCount(3); // Alice, Bob, Charlie
    await expect(content.locator(".csv-record-card .record-header", { hasText: "Record 1" })).toBeVisible();
    // Each record card has field labels and values - check at least one exists
    await expect(content.locator(".csv-record-card .field-label", { hasText: "name" }).first()).toBeVisible();
    await expect(content.locator(".csv-record-card .field-value", { hasText: "Alice" })).toBeVisible();

    // URL should have ?view=records
    await expect(page).toHaveURL(/\?view=records/);

    // Click Table to switch back
    await page.locator(".view-toggle button", { hasText: "Table" }).click();
    await expect(content.locator(".csv-table")).toBeVisible();
    await expect(content.locator(".csv-records")).not.toBeVisible();
  });

  test("CSV — direct navigation with ?view=records loads records view", async ({ page }) => {
    await page.goto("/data.csv?view=records");
    const content = page.locator("#content-area");
    await expect(content.locator(".csv-records")).toBeVisible();
    await expect(page.locator(".view-toggle button", { hasText: "Records" })).toHaveClass(/active/);
  });

  test("CSV — clicking row link switches to Records view and scrolls to that record", async ({ page }) => {
    await page.goto("/data.csv");
    const content = page.locator("#content-area");

    // Table view should be visible with row link buttons
    await expect(content.locator(".csv-table")).toBeVisible();
    await expect(content.locator(".csv-record-link-btn").first()).toBeVisible();

    // Click the second row's link button (data-row="2")
    await content.locator('.csv-record-link-btn[data-row="2"]').click();

    // Should switch to Records view
    await expect(content.locator(".csv-records")).toBeVisible();
    await expect(page.locator(".view-toggle button", { hasText: "Records" })).toHaveClass(/active/);

    // URL should have ?view=records&r=2
    await expect(page).toHaveURL(/\?view=records&r=2/);

    // Record 2 should be visible
    await expect(content.locator(".csv-record-card#record-2")).toBeVisible();
  });

  test("code — syntax-highlighted source", async ({ page }) => {
    await page.goto("/");
    await page.locator(".tree-item .label", { hasText: "sample.go" }).click();
    const content = page.locator("#content-area");
    await expect(content.locator(".source-code")).toBeVisible();
    // Chroma wraps tokens in <span> elements for syntax highlighting
    await expect(content.locator(".source-code span").first()).toBeVisible();
  });
});

test.describe("Word documents", () => {
  test("docx files get the DOC file icon", async ({ page }) => {
    await page.goto("/");
    const row = page.locator("#tree-container .tree-item", { hasText: "sample.docx" }).first();
    await expect(row.locator(".icon text")).toHaveText("DOC");
  });

  test(".docx — rendered as HTML with headings, formatting, lists and tables", async ({ page }) => {
    await page.goto("/sample.docx");
    const doc = page.locator("#content-area .word-doc");
    await expect(doc.locator("h1", { hasText: "Quarterly Report" })).toBeVisible();
    await expect(doc.locator("strong", { hasText: "bold" })).toBeVisible();
    await expect(doc.locator("li", { hasText: "Second item" })).toBeVisible();
    await expect(doc.locator("table td", { hasText: "Revenue" })).toBeVisible();
  });
});

test.describe("Pretty-printed files", () => {
  test("JSON — pretty-printed and syntax-highlighted", async ({ page }) => {
    await page.goto("/");
    await page.locator(".tree-item .label", { hasText: "data.json" }).click();
    const content = page.locator("#content-area");
    await expect(content.locator(".source-code")).toBeVisible();
    // Pretty-printed JSON should show "name" key
    await expect(content.locator(".source-code", { hasText: "name" })).toBeVisible();
    await expect(content.locator(".source-code", { hasText: "Alice" })).toBeVisible();
  });

  test("YAML — pretty-printed and syntax-highlighted", async ({ page }) => {
    await page.goto("/");
    await page.locator(".tree-item .label", { hasText: "config.yaml" }).click();
    const content = page.locator("#content-area");
    await expect(content.locator(".source-code")).toBeVisible();
    await expect(content.locator(".source-code", { hasText: "server" })).toBeVisible();
    await expect(content.locator(".source-code", { hasText: "database" })).toBeVisible();
  });
});

test.describe("Frontmatter", () => {
  test("opens an Obsidian link from a quoted property", async ({ page }) => {
    await page.goto("/frontmatter.md");
    const content = page.locator("#content-area .markdown-body");
    const transcript = content.getByRole("row").filter({ hasText: "transcript" });
    const link = transcript.getByRole("link", { name: "README.md", exact: true });
    await expect(link).toHaveAttribute("href", "/README.md");

    await link.click();
    await expect(page).toHaveURL(/\/README\.md$/);
    await expect(content.getByRole("heading", { name: "Root README" })).toBeVisible();
  });

  test("opens an Obsidian link from a directory README property", async ({ page }) => {
    await page.goto("/");
    const related = page.locator(".readme-body").getByRole("row").filter({ hasText: "related" });
    const link = related.getByRole("link", { name: "wiki-test", exact: true });
    await expect(link).toHaveAttribute("href", "/wiki-test.md");

    await link.click();
    await expect(page).toHaveURL(/\/wiki-test\.md$/);
  });

  test("renders frontmatter table and body", async ({ page }) => {
    await page.goto("/");
    await page.locator(".tree-item .label", { hasText: "frontmatter.md" }).click();
    const content = page.locator("#content-area .markdown-body");
    await expect(content).toBeVisible();
    // Frontmatter is rendered as a table with Key/Value headers
    await expect(content.locator("th", { hasText: "Key" })).toBeVisible();
    await expect(content.locator("td", { hasText: "title" })).toBeVisible();
    await expect(content.locator("td", { hasText: "My Document" })).toBeVisible();
    // Body content
    await expect(content.locator("h1", { hasText: "Welcome" })).toBeVisible();
  });
});

test.describe("Directory listing", () => {
  test("clicking a folder shows directory listing with '..' entry", async ({ page }) => {
    await page.goto("/");
    await page.locator(".tree-item .label", { hasText: "subdir" }).click();
    const content = page.locator("#content-area");
    await expect(content.locator(".dir-listing")).toBeVisible();
    await expect(content.locator(".dir-listing-row .name", { hasText: ".." })).toBeVisible();
    await expect(content.locator(".dir-listing-row .name", { hasText: "nested.md" })).toBeVisible();
  });

  test("parent navigation — clicking '..' returns to root", async ({ page }) => {
    await page.goto("/");
    await page.locator(".tree-item .label", { hasText: "subdir" }).click();
    await expect(page.locator("#content-area .dir-listing-row .name", { hasText: ".." })).toBeVisible();
    await page.locator(".dir-listing-row .name", { hasText: ".." }).click();
    // After clicking "..", we should see root-level files again
    const content = page.locator("#content-area");
    await expect(content.locator(".dir-listing-row .name", { hasText: "hello.md" })).toBeVisible();
    await expect(content.locator(".dir-listing-row .name", { hasText: "subdir" })).toBeVisible();
  });
});

test.describe("Fuzzy search", () => {
  test("press 't', type query, see results, select one", async ({ page }) => {
    await page.goto("/");
    // Wait for tree to load first
    await expect(page.locator("#tree-container .tree-item")).not.toHaveCount(0);
    await page.keyboard.press("t");
    await expect(page.locator("#search-overlay")).toHaveClass(/open/);
    await page.locator("#search-input").fill("hello");
    await expect(page.locator(".search-result").first()).toBeVisible();
    await expect(page.locator(".search-result .sr-path", { hasText: "hello" })).toBeVisible();
    // Click the matching result directly
    await page.locator(".search-result .sr-path", { hasText: "hello" }).first().click();
    await expect(page.locator("#search-overlay")).not.toHaveClass(/open/);
    await expect(page.locator("#content-area .markdown-body")).toBeVisible();
  });

  test("spaces in query act as separate terms", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#tree-container .tree-item")).not.toHaveCount(0);
    await page.keyboard.press("t");
    await expect(page.locator("#search-overlay")).toHaveClass(/open/);
    // "sub nes" should match "subdir/nested.md" — each term matched independently
    await page.locator("#search-input").fill("sub nes");
    await expect(page.locator(".search-result").first()).toBeVisible();
    await expect(page.locator(".search-result .sr-path", { hasText: "nested" })).toBeVisible();
  });

  test("folders are searchable and open the folder view", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#tree-container .tree-item")).not.toHaveCount(0);
    await page.keyboard.press("t");
    await page.locator("#search-input").fill("subdir");
    // The folder itself ranks first, above the files inside it
    const first = page.locator(".search-result").first();
    await expect(first).toHaveClass(/search-dir/);
    await expect(first.locator(".sr-path")).toHaveText("subdir/");
    await first.click();
    await expect(page.locator("#search-overlay")).not.toHaveClass(/open/);
    await expect(page).toHaveURL(/\/subdir\/$/);
    await expect(page.locator("#content-area .dir-listing-row .name", { hasText: "nested.md" })).toBeVisible();
  });

  test("contiguous name matches outrank scattered letters", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#tree-container .tree-item")).not.toHaveCount(0);
    await page.keyboard.press("t");
    await page.locator("#search-input").fill("data");
    const first = page.locator(".search-result").first();
    await expect(first.locator(".sr-path")).toHaveText("data.csv");
    await expect(first.locator("mark")).toHaveCount(4);
  });
});

test.describe("Full-text search", () => {
  test("press '/', search contents, open result and see the hit highlighted", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#tree-container .tree-item")).not.toHaveCount(0);
    await page.keyboard.press("/");
    await expect(page.locator("#search-overlay")).toHaveClass(/open/);
    await expect(page.locator('#search-modes button[data-mode="content"]')).toHaveClass(/active/);
    await expect(page.locator("#search-input")).toHaveAttribute("placeholder", /contents/);

    // Two words that only co-occur in hello.md's content (not its name)
    await page.locator("#search-input").fill("alice bob");
    const result = page.locator(".content-result", { has: page.locator(".sr-path", { hasText: "hello.md" }) });
    await expect(result).toBeVisible();
    await expect(result.locator(".cr-snippet mark").first()).toHaveText(/alice|bob/i);
    await expect(result.locator(".cr-count")).toHaveText("2 matches");
    // nested.md doesn't contain these words
    await expect(page.locator(".content-result .sr-path", { hasText: "nested.md" })).toHaveCount(0);

    // data.csv also contains both names; it ranks first (same count, path order)
    await expect(page.locator(".content-result").first()).toHaveAttribute("data-path", "data.csv");
    await result.click();
    await expect(page.locator("#search-overlay")).not.toHaveClass(/open/);
    await expect(page).toHaveURL(/\/hello\.md$/);
    await expect(page.locator("#content-area mark.search-hit")).toHaveText(/alice|bob/i);
  });

  test("quoted phrase matches exact phrase only", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("/");
    await page.locator("#search-input").fill('"inside a subdirectory"');
    await expect(page.locator(".content-result .sr-path", { hasText: "nested.md" })).toBeVisible();
    await page.locator("#search-input").fill('"subdirectory inside"');
    await expect(page.locator("#search-empty")).toHaveText("No notes match");
  });

  test("Tab switches between Files and Contents modes", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#tree-container .tree-item")).not.toHaveCount(0);
    await page.keyboard.press("/");
    await page.locator("#search-input").fill("nested");
    await expect(page.locator(".content-result").first()).toBeVisible();

    await page.locator("#search-input").press("Tab");
    await expect(page.locator('#search-modes button[data-mode="files"]')).toHaveClass(/active/);
    await expect(page.locator("#search-input")).toHaveAttribute("placeholder", "Go to file…");
    // Same query is re-run as a file-name search
    await expect(page.locator(".search-result:not(.content-result) .sr-path", { hasText: "subdir/nested.md" })).toBeVisible();
    await expect(page.locator(".content-result")).toHaveCount(0);

    await page.locator("#search-input").press("Tab");
    await expect(page.locator(".content-result").first()).toBeVisible();
  });

  test("short query shows a hint instead of searching", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("/");
    await page.locator("#search-input").fill("a");
    await expect(page.locator("#search-empty")).toHaveText("Keep typing…");
  });

  test("search button in the top bar opens content search on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await expect(page.locator("#search-btn")).toBeVisible();
    await page.locator("#search-btn").click();
    await expect(page.locator("#search-overlay")).toHaveClass(/open/);
    await expect(page.locator('#search-modes button[data-mode="content"]')).toHaveClass(/active/);
    await page.locator("#search-input").fill("subdirectory");
    await page.locator(".content-result").first().click();
    await expect(page).toHaveURL(/\/subdir\/nested\.md$/);
    await expect(page.locator("#content-area mark.search-hit")).toBeInViewport();
  });

  test("'t' still opens file search in Files mode", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("/");
    await page.keyboard.press("Escape");
    await page.keyboard.press("t");
    await expect(page.locator('#search-modes button[data-mode="files"]')).toHaveClass(/active/);
    await expect(page.locator(".search-result").first()).toBeVisible();
  });
});

test.describe("Backlinks", () => {
  test("note shows notes that link to it, and clicking reveals the link", async ({ page }) => {
    await page.goto("/hello.md");
    const section = page.locator("#content-area .backlinks");
    await expect(section).toBeVisible();
    await expect(section.locator(".backlinks-count")).toHaveText("1");
    const item = section.locator(".backlink-item");
    await expect(item).toHaveCount(1);
    await expect(item).toHaveAttribute("data-path", "wiki-test.md");
    await expect(item.locator(".bl-name")).toHaveText("wiki-test");
    await expect(item.locator(".bl-snippet").first()).toContainText("Simple link: [[hello]]");
    // Section sits below the note body
    await expect(page.locator("#content-area .markdown-body + .backlinks")).toHaveCount(1);

    await item.click();
    await expect(page).toHaveURL(/\/wiki-test\.md$/);
    const hit = page.locator("#content-area a.backlink-hit");
    await expect(hit).toHaveCount(1);
    await expect(hit).toHaveAttribute("href", "/hello.md");
    await expect(hit).toBeInViewport();
  });

  test("works for notes in subfolders", async ({ page }) => {
    await page.goto("/subdir/nested.md");
    const item = page.locator("#content-area .backlinks .backlink-item");
    await expect(item).toHaveAttribute("data-path", "wiki-test.md");
    await expect(item.locator(".bl-snippet")).toContainText("[[subdir/nested]]");
  });

  test("no section when nothing links to the note", async ({ page }) => {
    await page.goto("/frontmatter.md");
    await expect(page.locator("#content-area .markdown-body")).toBeVisible();
    // Give the backlinks request time to land before asserting absence
    await page.waitForLoadState("networkidle");
    await expect(page.locator("#content-area .backlinks")).toHaveCount(0);
  });

  test("not shown in Code view, reappears in Preview", async ({ page }) => {
    await page.goto("/hello.md");
    await expect(page.locator("#content-area .backlinks")).toBeVisible();
    await page.locator(".view-toggle button", { hasText: "Code" }).click();
    await expect(page.locator("#content-area .source-code")).toBeVisible();
    await expect(page.locator("#content-area .backlinks")).toHaveCount(0);
    await page.locator(".view-toggle button", { hasText: "Preview" }).click();
    await expect(page.locator("#content-area .backlinks")).toBeVisible();
  });

  test("backlinks from a previous note don't leak into the next one", async ({ page }) => {
    await page.goto("/hello.md");
    await expect(page.locator("#content-area .backlinks")).toBeVisible();
    await page.locator(".tree-item .label", { hasText: "frontmatter.md" }).click();
    await expect(page).toHaveURL(/\/frontmatter\.md$/);
    await page.waitForLoadState("networkidle");
    await expect(page.locator("#content-area .backlinks")).toHaveCount(0);
  });
});

test.describe("Anchor links", () => {
  test("headings have id attributes", async ({ page }) => {
    await page.goto("/");
    await page.locator(".tree-item .label", { hasText: "hello.md" }).click();
    const content = page.locator("#content-area .markdown-body");
    // Wait for hello.md's specific h1 content, not just any h1
    await expect(content.locator("h1", { hasText: "Hello World" })).toBeVisible();
    const h2s = content.locator("h2");
    const count = await h2s.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      await expect(h2s.nth(i)).toHaveAttribute("id", /./);
    }
  });
});

test.describe("Page title", () => {
  test("title updates to show filename when viewing a file", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle("testdata - RepoView");
    await page.locator(".tree-item .label", { hasText: "hello.md" }).click();
    await expect(page).toHaveTitle("hello.md - RepoView");
  });

  test("title updates to show dirname when navigating to a subdirectory", async ({ page }) => {
    await page.goto("/");
    await page.locator(".tree-item .label", { hasText: "subdir" }).click();
    await expect(page).toHaveTitle("subdir - RepoView");
  });

  test("title resets to RepoView when navigating back to root", async ({ page }) => {
    await page.goto("/");
    await page.locator(".tree-item .label", { hasText: "hello.md" }).click();
    await expect(page).toHaveTitle("hello.md - RepoView");
    await page.locator(".crumb.root").click();
    await expect(page).toHaveTitle("testdata - RepoView");
  });
});

test.describe("Markdown raw/preview toggle", () => {
  test("toggle appears for markdown files, not for non-markdown", async ({ page }) => {
    await page.goto("/");
    await page.locator(".tree-item .label", { hasText: "hello.md" }).click();
    await expect(page.locator(".view-toggle")).toBeVisible();
    await expect(page.locator(".view-toggle button", { hasText: "Preview" })).toBeVisible();
    await expect(page.locator(".view-toggle button", { hasText: "Code" })).toBeVisible();

    // Navigate to a non-markdown file — toggle should disappear
    await page.locator(".tree-item .label", { hasText: "sample.go" }).click();
    await expect(page.locator(".source-code")).toBeVisible();
    await expect(page.locator(".view-toggle")).not.toBeVisible();
  });

  test("clicking Code shows source, clicking Preview restores rendered markdown", async ({ page }) => {
    await page.goto("/");
    await page.locator(".tree-item .label", { hasText: "hello.md" }).click();
    await expect(page.locator("#content-area .markdown-body")).toBeVisible();

    // Switch to code view
    await page.locator(".view-toggle button", { hasText: "Code" }).click();
    await expect(page.locator("#content-area .source-code")).toBeVisible();
    await expect(page.locator("#content-area .markdown-body")).not.toBeVisible();

    // Switch back to preview
    await page.locator(".view-toggle button", { hasText: "Preview" }).click();
    await expect(page.locator("#content-area .markdown-body")).toBeVisible();
    await expect(page.locator("#content-area .source-code")).not.toBeVisible();
  });

  test("toggle disappears when navigating to non-toggle file", async ({ page }) => {
    await page.goto("/");
    await page.locator(".tree-item .label", { hasText: "hello.md" }).click();
    await expect(page.locator(".view-toggle")).toBeVisible();

    // Navigate to a .go file (no view toggle; CSV/TXT have their own toggles)
    await page.locator(".tree-item .label", { hasText: "sample.go" }).click();
    await expect(page.locator(".source-code")).toBeVisible();
    await expect(page.locator(".view-toggle")).not.toBeVisible();
  });

  test("plain text files show wrap and line-number controls", async ({ page }) => {
    await page.goto("/");
    await page.locator(".tree-item .label", { hasText: "example.txt" }).click();
    await expect(page.locator(".source-code pre.plain-text")).toBeVisible();
    await expect(page.locator(".view-toggle button", { hasText: "Wrap" })).toBeVisible();
    await expect(page.locator(".view-toggle button", { hasText: "Line numbers" })).toBeVisible();
    // Dedicated plain-text view, not syntax-highlighted
    await expect(page.locator(".source-code pre.plain-text .plain-line").first()).toBeVisible();
  });

  test("CSV filter bar filters rows and restores server content", async ({ page }) => {
    await page.goto("/");
    await page.locator(".tree-item .label", { hasText: "colors.csv" }).click();
    await expect(page.locator(".csv-filter-bar")).toBeVisible();

    const colSelect = page.locator(".csv-filter-col");
    const opSelect = page.locator(".csv-filter-op");
    const valueInput = page.locator(".csv-filter-value");
    const add = page.locator(".csv-filter-add");

    // Filter: category contains "warm"
    await colSelect.selectOption({ label: "category" });
    await opSelect.selectOption("contains");
    await valueInput.fill("warm");
    await add.click();

    await expect(page.locator(".csv-filter-count", { hasText: "Showing 0 of" })).not.toBeVisible();
    const countAll = await page.locator(".csv-filter-count").textContent();
    expect(countAll).toMatch(/Showing \d+ of \d+ rows/);
    const firstCount = parseInt(countAll!.match(/Showing (\d+)/)![1], 10);
    expect(firstCount).toBeGreaterThan(0);
    expect(firstCount).toBeLessThan(30);
    await expect(page.locator(".csv-filter-chip", { hasText: "category" })).toBeVisible();

    // Clear restores the server-rendered table (count hides again)
    await page.locator(".csv-filter-clear").click();
    await expect(page.locator(".csv-filter-count")).not.toBeVisible();
    await expect(page.locator(".csv-table tbody tr")).toHaveCount(30);
  });

  test("CSV numeric and regex filters with match any/all modes", async ({ page }) => {
    await page.goto("/colors.csv");
    await expect(page.locator(".csv-filter-bar")).toBeVisible();

    // weight > 1.0 (numeric op)
    await page.locator(".csv-filter-col").selectOption({ label: "weight" });
    await page.locator(".csv-filter-op").selectOption("gt");
    await page.locator(".csv-filter-value").fill("1.0");
    await page.locator(".csv-filter-add").click();
    const gtCount = await page.locator(".csv-filter-count").textContent();
    expect(parseInt(gtCount!.match(/Showing (\d+)/)![1], 10)).toBeGreaterThan(0);

    // invalid regex does not create a chip
    await page.locator(".csv-filter-col").selectOption({ label: "name" });
    await page.locator(".csv-filter-op").selectOption("regex");
    await page.locator(".csv-filter-value").fill("([unclosed");
    await page.locator(".csv-filter-add").click();
    await expect(page.locator(".csv-filter-invalid", { hasText: "invalid regex" })).toBeVisible();

    // valid regex chip appears and count updates again
    await page.locator(".csv-filter-value").fill("^m");
    await page.locator(".csv-filter-add").click();
    await expect(page.locator(".csv-filter-chip", { hasText: "~" }).first()).toBeVisible();

    // match-any widens the result set
    const allCount = await page.locator(".csv-filter-count").textContent();
    await page.getByRole("button", { name: "match any" }).click();
    const anyCount = await page.locator(".csv-filter-count").textContent();
    expect(parseInt(anyCount!.match(/Showing (\d+)/)![1], 10)).toBeGreaterThanOrEqual(
      parseInt(allCount!.match(/Showing (\d+)/)![1], 10),
    );
  });

  test("CSV read-as plain text shows verbatim rows", async ({ page }) => {
    await page.goto("/colors.csv?as=txt");
    await expect(page.locator(".source-code pre.plain-text")).toBeVisible();
    await expect(page.locator(".plain-text .plain-line").first()).toBeVisible();
  });

  test("CSV column sort cycles ascending, descending, off from headers", async ({
    page,
  }) => {
    await page.goto("/colors.csv");
    const firstId = page
      .locator(".csv-table table tbody tr")
      .first()
      .locator("td")
      .first();
    const weightTh = page.locator(".csv-table th", { hasText: "weight" }).first();

    // Server-rendered pristine table starts in file order (ids 1..30).
    await expect(firstId).toHaveText("1");
    await expect(weightTh).not.toHaveAttribute("aria-sort");

    await weightTh.click();
    await expect(weightTh).toHaveAttribute("aria-sort", "ascending");
    await expect(weightTh).toContainText("▲");
    await expect(firstId).toHaveText("17"); // Lightest row: Beige 0.35

    await weightTh.click();
    await expect(weightTh).toHaveAttribute("aria-sort", "descending");
    await expect(weightTh).toContainText("▼");
    await expect(firstId).toHaveText("9"); // Heaviest row: Charcoal 1.40

    await weightTh.click();
    await expect(weightTh).not.toHaveAttribute("aria-sort");
    await expect(firstId).toHaveText("1"); // Pristine server-rendered order back
    await expect(weightTh).not.toContainText("▲");
    await expect(weightTh).not.toContainText("▼");
  });

  test("CSV sort is numeric-aware and combines with filters", async ({ page }) => {
    await page.goto("/colors.csv");
    await page.locator(".csv-table th", { hasText: "weight" }).first().click();
    await page.locator(".csv-filter-col").selectOption({ label: "category" });
    await page.locator(".csv-filter-op").selectOption("contains");
    await page.locator(".csv-filter-value").fill("warm");
    await page.locator(".csv-filter-add").click();
    await expect(page.locator(".csv-filter-count")).toContainText(
      "11 of 30 rows · sorted by weight ▲",
    );
    const names = page.locator(
      ".csv-table table tbody tr td:nth-child(2)",
    );
    await expect(names).toHaveCount(11);
    // Lightest warm colors first: Peach 0.47, then Salmon 0.48.
    await expect(names.first()).toHaveText("Peach");
    await expect(names.nth(1)).toHaveText("Salmon");
  });

  test("CSV record links still target the original row while sorted", async ({
    page,
  }) => {
    await page.goto("/colors.csv");
    const weightTh = page.locator(".csv-table th", { hasText: "weight" }).first();
    await weightTh.click(); // ascending: row 17 (Beige 0.35) sorts on top
    await page
      .locator(".csv-table table tbody tr")
      .first()
      .locator(".csv-record-link-btn")
      .click();
    await expect(page.locator(".view-toggle button", { hasText: "Records" })).toHaveClass(
      /active/,
    );
    await expect(page.locator(".csv-record-card#record-17")).toBeVisible();
  });

  test("CSV control labels describe what each control does", async ({ page }) => {
    await page.goto("/colors.csv");
    await expect(page.locator(".csv-filter-col")).toHaveAttribute(
      "aria-label",
      "Filter column: which column the rule tests",
    );
    await expect(page.locator(".csv-filter-op")).toHaveAttribute(
      "aria-label",
      "Filter rule: how the column value is compared",
    );
    await expect(page.locator(".csv-filter-add")).toHaveAttribute(
      "aria-label",
      "Add filter rule: applies this rule alongside the others",
    );
    await expect(page.locator(".csv-filter-value")).toHaveAttribute(
      "aria-label",
      "Filter value",
    );
    // Match-mode buttons exist only while filter chips are shown
    // (renderChips appends them next to the chips), so create one filter
    // and check, then clear.
    await page.locator(".csv-filter-col").selectOption({ label: "rating" });
    await page.locator(".csv-filter-op").selectOption("gt");
    await page.locator(".csv-filter-value").fill("3");
    await page.locator(".csv-filter-add").click();
    await expect(page.locator(".csv-filter-mode.active")).toHaveAttribute(
      "aria-label",
      "Match all: rows must satisfy every rule",
    );
    await page.locator(".csv-filter-clear").click();
    const ratingTh = page.locator(".csv-table th", { hasText: "rating" }).first();
    await expect(ratingTh).toHaveAttribute(
      "aria-label",
      "Sort by rating — click to sort ascending",
    );
    await ratingTh.click();
    await expect(ratingTh).toHaveAttribute(
      "aria-label",
      "Sort by rating — ascending now; click for descending",
    );

    // Chart configuration bar carries the same kind of labels.
    await page.locator(".view-toggle button", { hasText: "Charts" }).click();
    await expect(page.locator(".csv-chart-type")).toHaveAttribute(
      "aria-label",
      "Chart shape: how the data is drawn",
    );
    await expect(page.locator(".csv-chart-x")).toHaveAttribute(
      "aria-label",
      "X axis: column for the categories or buckets",
    );
    await expect(page.locator(".csv-chart-measure")).toHaveAttribute(
      "aria-label",
      "Measure: the numeric column being aggregated",
    );
    await expect(page.locator(".csv-chart-agg")).toHaveAttribute(
      "aria-label",
      "Aggregate: how rows combine into one value per X",
    );
    await expect(page.locator(".csv-chart-color")).toHaveAttribute(
      "aria-label",
      "Colour by: split into one series per value",
    );
  });

  test("Theme picker switches all ten colorways", async ({ page }) => {
    await page.goto("/");
    await page.locator("#theme-toggle").click();
    const menu = page.locator("#theme-menu");
    await expect(menu).toBeVisible();
    await expect(page.locator(".theme-menu-item")).toHaveCount(10);
    // Close once so every loop cycle opens the menu from a clean state.
    await page.keyboard.press("Escape");
    await expect(menu).toBeHidden();

    const bgs: Record<string, string> = {};
    for (const [label, theme] of [
      ["Light", "light"],
      ["Dark", "dark"],
      ["Nord", "nord"],
      ["OpenCode Orng", "opencode"],
      ["Dark rose", "rose"],
      ["Rosé Pine", "rosepine"],
      ["Aura", "aura"],
      ["Kanagawa", "kanagawa"],
      ["Mercury", "mercury"],
      ["Monokai", "monokai"],
    ]) {
      // Selecting a theme closes the menu, so re-open it each cycle.
      await page.locator("#theme-toggle").click();
      await expect(menu).toBeVisible();
      await menu.locator(".theme-menu-item", { hasText: new RegExp("^" + label + "(✓)?$") }).click();
      await expect(menu).toBeHidden();
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
      expect(
        await page.evaluate(() => localStorage.getItem("rv-theme")),
      ).toBe(theme);
      bgs[theme] = await page.evaluate(() =>
        getComputedStyle(document.body).backgroundColor,
      );
    }
    // All ten colorways render a distinct chrome color.
    expect(new Set(Object.values(bgs)).size).toBe(10);
  });

  test("OpenCode Orng text contrast matches Dark rose", async ({ page }) => {
    // Measured WCAG ratios from the Dark rose colorway: the OpenCode Orng
    // text ramp is tuned to the same values so long sessions read equally
    // softly (the old #eeeeee/#a3a3a3/#808080 ramp was considerably harsher).
    const measure = async (theme: string) => {
      await page.goto("/");
      await page.evaluate((t) => localStorage.setItem("rv-theme", t), theme);
      await page.reload();
      return page.evaluate(() => {
        const styles = getComputedStyle(document.documentElement);
        const bg = styles.getPropertyValue("--rv-bg").trim();
        const lin = (v: number) => {
          v /= 255;
          return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
        };
        const lum = (hex: string) => {
          const h = hex.replace("#", "");
          const [r, g, b] = [0, 2, 4].map((i) =>
            parseInt(h.slice(i, i + 2), 16),
          );
          return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
        };
        const ratio = (a: string, b: string) => {
          const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
          return (hi + 0.05) / (lo + 0.05);
        };
        return Object.fromEntries(
          [
            "--rv-text",
            "--rv-text-secondary",
            "--rv-text-tertiary",
            "--rv-link",
          ].map((name) => {
            const color = styles.getPropertyValue(name).trim();
            return [name, { color, ratio: ratio(color, bg) }];
          }),
        );
      });
    };

    const rose = await measure("rose");
    const orng = await measure("opencode");
    for (const name of Object.keys(rose)) {
      expect(orng[name].ratio).toBeCloseTo(rose[name].ratio, 1);
    }
    // Pin the tuned Orng ramp itself (hex values, not just ratios).
    expect(orng["--rv-text"].color).toBe("#cacaca");
    expect(orng["--rv-text-secondary"].color).toBe("#8d8d8d");
    expect(orng["--rv-text-tertiary"].color).toBe("#656565");
    expect(orng["--rv-link"].color).toBe("#f29171");
  });

  test("Plain-text reading view follows dark colorways", async ({ page }) => {
    for (const theme of [
      "dark",
      "nord",
      "opencode",
      "rose",
      "rosepine",
      "aura",
      "kanagawa",
      "mercury",
      "monokai",
    ]) {
      await page.addInitScript(
        (t) => {
          localStorage.setItem("rv-theme", t);
          document.documentElement.setAttribute("data-theme", t);
        },
        theme,
      );
      await page.goto("/example.txt");
      await expect(page.locator("pre.plain-text")).toBeVisible();
      expect(
        await page.locator("html").getAttribute("data-theme"),
      ).toBe(theme);
      const bg = await page.evaluate(() =>
        getComputedStyle(
          document.querySelector("pre.plain-text") as Element,
        ).backgroundColor,
      );
      expect(bg).not.toBe("rgb(255, 255, 255)");
    }
  });

  test("Code view highlights with theme classes, not inline colors", async ({
    page,
  }) => {
    await page.goto("/sample.go");
    await expect(page.locator(".source-code pre.chroma")).toBeVisible();
    expect(
      await page.locator(".source-code pre.chroma span[class]").count(),
    ).toBeGreaterThan(3);
    expect(await page.locator(".source-code span[style]").count()).toBe(0);
  });

  test("CSV charts: bar default, type switching and hover titles", async ({ page }) => {
    await page.goto("/colors.csv");
    await page.locator(".view-toggle button", { hasText: "Charts" }).click();
    await expect(page.locator("svg.csv-chart")).toBeVisible();
    await expect(page.locator(".csv-chart-note")).toHaveText(/plotting \d+ of 30 rows/);
    // Default bar chart: one rect + hover title per X bucket
    const rects = page.locator("svg.csv-chart rect.chart-rect");
    await expect(rects.first()).toBeVisible();
    expect(await rects.count()).toBeGreaterThan(0);
    // SVG <title> is a tooltip-only node (never "visible" to Playwright),
    // so assert its text and one-title-per-rect instead.
    const titles = page.locator("svg.csv-chart rect.chart-rect title");
    await expect(titles.first()).toHaveText(/\d/);
    expect(await titles.count()).toBe(await rects.count());
    // Scale sanity: bars are not saturated at full plot height and the
    // y-axis reaches the nice-rounded max — sum(id) tops at 30 → axis 50.
    expect(parseFloat(await rects.first().getAttribute("height"))).toBeLessThan(304);
    await expect(
      page.locator("svg.csv-chart text.chart-tick", { hasText: "50" }),
    ).not.toHaveCount(0);

    // Switch through the core chart types
    const types = [
      ["hbar", "rect.chart-rect"],
      ["scatter", "circle.chart-dot"],
      ["pie", "path.chart-slice"],
      ["donut", "path.chart-slice"],
      ["area", "path.chart-area"],
      ["line", "path.chart-line"],
    ];
    for (const [t, sel] of types) {
      await page.locator(".csv-chart-type").selectOption(t);
      await expect(page.locator(`svg.csv-chart ${sel}`).first()).toBeVisible();
    }
  });

  test("CSV charts: color-by legend, stacked bars and line groups", async ({ page }) => {
    await page.goto("/colors.csv");
    await page.locator(".view-toggle button", { hasText: "Charts" }).click();
    await expect(page.locator("svg.csv-chart")).toBeVisible();

    // color-by: three categories in the palette legend
    await page.locator(".csv-chart-color").selectOption({ label: "category" });
    await expect(page.locator(".chart-legend-item")).toHaveCount(3);
    await expect(page.locator(".chart-legend-item", { hasText: "warm" })).toBeVisible();

    // stacked bars need a colour column and show one rect per (bucket, colour)
    await page.locator(".csv-chart-type").selectOption("stacked");
    await expect(page.locator("svg.csv-chart rect.chart-rect").first()).toBeVisible();

    // line chart with colour-by: one path per colour group
    await page.locator(".csv-chart-type").selectOption("line");
    await expect(page.locator("path.chart-line")).toHaveCount(3);
  });

  test("CSV charts colour series through theme variables", async ({ page }) => {
    await page.goto("/colors.csv");
    await page.locator(".view-toggle button", { hasText: "Charts" }).click();
    const rect = page.locator("svg.csv-chart rect.chart-rect").first();
    await expect(rect).toBeVisible();

    // Fills are written as inline styles carrying the theme variable
    // (SVG presentation attributes cannot hold var()).
    expect(await rect.getAttribute("style")).toMatch(/^fill:var\(--rv-chart-1\)/);

    // The variable resolves through the active theme's palette: switch
    // Light → Nord and the same chart element re-resolves to a different
    // concrete colour without being re-rendered.
    const light = await rect.evaluate((el) => getComputedStyle(el).fill);
    expect(light).toMatch(/^rgb\(/);
    await page.locator("#theme-toggle").click();
    await page
      .locator("#theme-menu")
      .locator(".theme-menu-item", { hasText: "Nord" })
      .click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "nord");
    const nord = await rect.evaluate((el) => getComputedStyle(el).fill);
    expect(nord).toMatch(/^rgb\(/);
    expect(nord).not.toBe(light);
  });

  test("CSV charts show a hover guideline that follows the pointer", async ({ page }) => {
    await page.goto("/colors.csv");
    await page.locator(".view-toggle button", { hasText: "Charts" }).click();
    const svg = page.locator("svg.csv-chart");
    await expect(svg).toBeVisible();
    const cursor = svg.locator("line.chart-cursor");

    // Hidden until the pointer enters the chart
    await expect(cursor).toHaveAttribute("visibility", "hidden");

    const box = await svg.boundingBox();
    expect(box).toBeTruthy();
    await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
    await expect(cursor).toHaveAttribute("visibility", "visible");

    // The vertical guide tracks the pointer's position in the viewBox
    const xMid = await cursor.getAttribute("x1");
    await page.mouse.move(box!.x + box!.width * 0.25, box!.y + box!.height / 2);
    const xLeft = await cursor.getAttribute("x1");
    expect(parseFloat(xLeft!)).toBeLessThan(parseFloat(xMid!));

    // Leaving the chart hides the guide again
    await page.mouse.move(box!.x - 50, box!.y + box!.height / 2);
    await expect(cursor).toHaveAttribute("visibility", "hidden");

    // Pie wheels get no guideline
    await page.locator(".csv-chart-type").selectOption("pie");
    await expect(page.locator("svg.csv-chart path.chart-slice").first()).toBeVisible();
    await expect(page.locator("svg.csv-chart line.chart-cursor")).toHaveCount(0);

    // Horizontal bars: the guide spans the bar area and tracks vertically
    await page.locator(".csv-chart-type").selectOption("hbar");
    await expect(page.locator("svg.csv-chart rect.chart-rect").first()).toBeVisible();
    const cursorH = page.locator("svg.csv-chart line.chart-cursor");
    await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
    await expect(cursorH).toHaveAttribute("visibility", "visible");
    await expect(cursorH).toHaveAttribute("x1", "170");
    await expect(cursorH).toHaveAttribute("x2", "782");
    const hy = await cursorH.getAttribute("y1");
    await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height * 0.25);
    const hy2 = await cursorH.getAttribute("y1");
    expect(parseFloat(hy2!)).toBeLessThan(parseFloat(hy!));
  });

  test("CSV charts: histogram bins a numeric X column", async ({ page }) => {
    await page.goto("/colors.csv");
    await page.locator(".view-toggle button", { hasText: "Charts" }).click();
    await page.locator(".csv-chart-x").selectOption({ label: "weight" });
    await page.locator(".csv-chart-type").selectOption("histogram");

    const hist = page.locator("svg.csv-chart.chart-histogram");
    await expect(hist).toBeVisible();
    const rects = hist.locator("rect.chart-rect");
    await expect(rects.first()).toBeVisible();
    const count = await rects.count();
    expect(count).toBeGreaterThanOrEqual(3);
    expect(count).toBeLessThanOrEqual(10);
    await expect(rects.first().locator("title")).toContainText("rows");

    // Non-numeric X column is refused with a helpful empty state
    await page.locator(".csv-chart-x").selectOption({ label: "category" });
    await expect(
      page.locator(".csv-chart-empty", { hasText: "Histogram needs numeric values in the X column." }),
    ).toBeVisible();
  });

  test("CSV charts: bubble sizes with the aggregated measure", async ({ page }) => {
    await page.goto("/colors.csv");
    await page.locator(".view-toggle button", { hasText: "Charts" }).click();
    await page.locator(".csv-chart-x").selectOption({ label: "category" });
    await page.locator(".csv-chart-type").selectOption("bubble");

    const bubbles = page.locator("svg.csv-chart.chart-bubble circle.chart-dot");
    // Three category buckets: cool, neutral, warm
    await expect(bubbles).toHaveCount(3);
    const radii = await bubbles.evaluateAll((els) =>
      els.map((e) => parseFloat((e as SVGElement).getAttribute("r") || "0")),
    );
    // Area-scaled radii above the minimum draw threshold for these values
    for (const r of radii) {
      expect(r).toBeGreaterThan(20);
    }
    await expect(bubbles.first().locator("title")).toContainText(": ");

    // Bucket labels are drawn under the bubbles
    await expect(page.locator("svg.csv-chart.chart-bubble text.chart-tick")).toHaveCount(3);
  });

  test("CSV charts: heat map grid with colour rows", async ({ page }) => {
    await page.goto("/colors.csv");
    await page.locator(".view-toggle button", { hasText: "Charts" }).click();
    await page.locator(".csv-chart-x").selectOption({ label: "category" });
    await page.locator(".csv-chart-type").selectOption("heat");

    // Without a colour column: one value row across the buckets
    const cells = page.locator("svg.csv-chart.chart-heat rect.chart-heat-cell");
    await expect(cells).toHaveCount(3);

    // With a colour column: one row per colour entry, one cell per pairing
    await page.locator(".csv-chart-color").selectOption({ label: "category" });
    await expect(page.locator(".chart-legend-item")).toHaveCount(3);
    await expect(cells).toHaveCount(9);
    await expect(cells).not.toHaveCount(0);

    // Intensity ramp: the strongest cell reaches full fill-opacity while
    // empty pairings stay at the faint floor
    const styles = await cells.evaluateAll((els) =>
      els.map((e) => (e as SVGElement).getAttribute("style") || ""),
    );
    expect(styles.some((s) => s.includes("fill-opacity:0.96"))).toBe(true);
    expect(styles.some((s) => s.includes("fill-opacity:0.04"))).toBe(true);

    // Cross cells carry "bucket / colour" titles
    await expect(cells.first().locator("title")).toContainText(" / ");
  });

  test("CSV charts render the filtered row set", async ({ page }) => {
    await page.goto("/colors.csv");
    // Filter before opening charts
    await page.locator(".csv-filter-col").selectOption({ label: "category" });
    await page.locator(".csv-filter-op").selectOption("contains");
    await page.locator(".csv-filter-value").fill("warm");
    await page.locator(".csv-filter-add").click();
    await page.locator(".view-toggle button", { hasText: "Charts" }).click();

    await expect(page.locator(".csv-chart-note")).toHaveText(/plotting 11 of 30 rows/);
    // The 11 warm rows map to 11 buckets on the default X column (id).
    await expect(page.locator("svg.csv-chart rect.chart-rect")).toHaveCount(11);

    // Removing the filter while the chart is open refreshes it live
    await page.locator(".csv-filter-chip", { hasText: "category" }).click();
    await expect(page.locator(".csv-chart-note")).toHaveText(/plotting 30 of 30 rows/);
  });

  test("URL updates with ?view=code when switching to code view", async ({ page }) => {
    await page.goto("/");
    await page.locator(".tree-item .label", { hasText: "hello.md" }).click();
    await expect(page.locator(".view-toggle")).toBeVisible();

    await page.locator(".view-toggle button", { hasText: "Code" }).click();
    expect(page.url()).toContain("?view=code");

    // Switch back — param should be gone
    await page.locator(".view-toggle button", { hasText: "Preview" }).click();
    expect(page.url()).not.toContain("view=code");
  });

  test("direct navigation with ?view=code loads code view", async ({ page }) => {
    await page.goto("/hello.md?view=code");
    await expect(page.locator("#content-area .source-code")).toBeVisible();
    await expect(page.locator("#content-area .markdown-body")).not.toBeVisible();
    // Toggle should show Code as active
    await expect(page.locator(".view-toggle button.active", { hasText: "Code" })).toBeVisible();
  });
});

test.describe("XML viewer", () => {
  test("tree view renders the element structure", async ({ page }) => {
    await page.goto("/sample.xml");
    await expect(page.locator(".xml-view")).toBeVisible();
    // 1 catalog + 4 books + 2 magazines + 4 children each = 31 elements
    await expect(page.locator(".xml-tree .xml-node")).toHaveCount(31);
    await expect(page.locator(".xml-attr", { hasText: 'id="bk103"' }).first()).toBeVisible();
  });

  test("table view lists every element with attributes", async ({ page }) => {
    await page.goto("/sample.xml");
    await page.locator(".view-toggle button", { hasText: "Table" }).click();
    await expect(page.locator(".xml-table")).toBeVisible();
    await expect(page.locator(".xml-table tbody tr")).toHaveCount(31);
    await expect(page.locator(".xml-table th")).toHaveCount(4);
    await expect(page.locator(".xml-table th", { hasText: "Attributes" })).toBeVisible();
    // The book element row carries its attributes and tag
    // Book element row: tag + attributes. Title element row: direct text.
    const row = page.locator(".xml-table tbody tr", { hasText: 'id="bk103"' }).first();
    await expect(row).toContainText("book");
    await expect(row).toContainText('genre="web"');
    const titleRow = page.locator(".xml-table tbody tr", { hasText: "XQuery Kick Start" }).first();
    await expect(titleRow).toContainText("title");
  });

  test("tag glob filter narrows tree and count", async ({ page }) => {
    await page.goto("/sample.xml");
    await page.locator(".csv-filter-col").fill("b*");
    // matched entries with a tag starting "b" = the 4 book elements
    await expect(page.locator(".csv-filter-count", { hasText: "Showing 4 of 31 elements" })).toBeVisible();
    await expect(page.locator(".xml-attr", { hasText: 'id="bk102"' }).first()).toBeVisible();
    await expect(page.locator(".xml-attr", { hasText: 'id="mg201"' })).toHaveCount(0);
  });

  test("attribute filter matches id=bk103", async ({ page }) => {
    await page.goto("/sample.xml");
    await page.locator(".csv-filter-op").fill("id=bk103");
    await expect(page.locator(".csv-filter-count", { hasText: "Showing 1 of 31 elements" })).toBeVisible();
    await expect(page.locator(".xml-attr", { hasText: 'id="bk103"' }).first()).toBeVisible();
  });

  test("xpath filter selects //book[@genre='web']", async ({ page }) => {
    await page.goto("/sample.xml");
    await page.locator(".csv-filter-xpath").fill("//book[@genre='web']");
    await expect(page.locator(".csv-filter-count", { hasText: "Showing 2 of 31 elements" })).toBeVisible();
    await expect(page.locator(".xml-attr", { hasText: 'id="bk103"' }).first()).toBeVisible();
    await expect(page.locator(".xml-attr", { hasText: 'id="bk104"' }).first()).toBeVisible();
  });

  test("text filter and clear", async ({ page }) => {
    await page.goto("/sample.xml");
    await page.locator(".csv-filter-value").fill("Everyday Italian");
    await expect(page.locator(".csv-filter-count", { hasText: "Showing 1 of 31 elements" })).toBeVisible();
    await page.locator(".csv-filter-clear").click();
    await expect(page.locator(".csv-filter-count")).not.toBeVisible();
    await expect(page.locator(".xml-attr", { hasText: 'id="mg202"' }).first()).toBeVisible();
  });

  test("invalid xpath shows a message and empty tree", async ({ page }) => {
    await page.goto("/sample.xml");
    await page.locator(".csv-filter-xpath").fill("[(unclosed");
    await expect(page.locator(".csv-filter-invalid", { hasText: "invalid xpath" })).toBeVisible();
  });

  test("code view shows the highlighted source", async ({ page }) => {
    await page.goto("/sample.xml");
    await page.locator(".view-toggle button", { hasText: "Code" }).click();
    await expect(page.locator("#content-area .source-code")).toBeVisible();
    await expect(page.locator(".view-toggle button.active", { hasText: "Code" })).toBeVisible();
  });

  test("read as XML viewer from a plain text file", async ({ page }) => {
    await page.goto("/");
    await page.locator(".tree-item .label", { hasText: "example.txt" }).click();
    await expect(page.locator(".source-code pre.plain-text")).toBeVisible();
    await page.locator(".edit-dropdown-btn", { hasText: "Read file as" }).click();
    await page.locator(".edit-dropdown-item", { hasText: "XML viewer" }).click();
    await expect(page.locator(".xml-view")).toBeVisible();
    await expect(page.locator(".csv-filter-invalid", { hasText: "XML parse error" })).toBeVisible();
  });

  test("read as Wiki Markdown from a plain text file", async ({ page }) => {
    await page.goto("/wiki-notes.txt");
    await expect(page.locator(".source-code pre.plain-text")).toBeVisible();

    // The Read-as menu offers a Wiki Markdown entry
    await page.locator(".edit-dropdown-btn", { hasText: "Read file as" }).click();
    await page.locator(".edit-dropdown-item", { hasText: "Wiki Markdown" }).click();

    // Wiki placeholders render as anchors resolved by the client
    const body = page.locator("#content-area .markdown-body");
    await expect(body).toBeVisible();
    await expect(body.locator("a.wiki-link")).toHaveCount(4);
    const hello = body.locator("a.wiki-link").first();
    await expect(hello).toHaveAttribute("href", "/hello.md");

    // The dangling target stays clickable but is marked broken
    const broken = body.locator("a.wiki-link-broken");
    await expect(broken).toHaveCount(1);
    await expect(broken).toContainText("no-such-note-anywhere");

    // The resolved link navigates to the note it targets
    await hello.click();
    await expect(page).toHaveURL(/hello\.md/);
    await expect(
      page.locator(".markdown-body", { hasText: "Hello World" }),
    ).toBeVisible();
  });

  test("wiki read-as restores from a link and marks the menu item", async ({
    page,
  }) => {
    await page.goto("/wiki-notes.txt?as=wiki");
    const body = page.locator("#content-area .markdown-body");
    await expect(body).toBeVisible();
    await expect(body.locator("a.wiki-link").first()).toBeVisible();

    await page.locator(".edit-dropdown-btn", { hasText: "Read file as" }).click();
    await expect(
      page.locator(".edit-dropdown-item.preferred", { hasText: "Wiki Markdown" }),
    ).toBeVisible();
  });
});

test.describe("Binary file handling", () => {
  test("binary image shows inline img with correct src", async ({ page }) => {
    await page.goto("/");
    await page.locator(".tree-item .label", { hasText: "pixel.png" }).click();
    const content = page.locator("#content-area");
    await expect(content.locator(".binary-preview img")).toBeVisible();
    const src = await content.locator(".binary-preview img").getAttribute("src");
    expect(src).toContain("/_raw/pixel.png");
    await expect(content.locator(".binary-download")).toBeVisible();
  });

  test("SVG shows inline preview with toggle to code view", async ({ page }) => {
    await page.goto("/");
    await page.locator(".tree-item .label", { hasText: "icon.svg" }).click();
    const content = page.locator("#content-area");
    // Preview mode: rendered as an <img>, so scripts and event handlers
    // inside the SVG never run with the viewer's session.
    await expect(content.locator(".svg-preview img")).toBeVisible();
    await expect(content.locator(".svg-preview svg")).toHaveCount(0);
    // Toggle should be visible
    await expect(page.locator(".view-toggle")).toBeVisible();
    await expect(page.locator(".view-toggle button", { hasText: "Preview" })).toBeVisible();
    await expect(page.locator(".view-toggle button", { hasText: "Code" })).toBeVisible();

    // Switch to code view
    await page.locator(".view-toggle button", { hasText: "Code" }).click();
    await expect(content.locator(".source-code")).toBeVisible();
    await expect(content.locator(".svg-preview")).not.toBeVisible();

    // Switch back to preview
    await page.locator(".view-toggle button", { hasText: "Preview" }).click();
    await expect(content.locator(".svg-preview img")).toBeVisible();
    await expect(content.locator(".source-code")).not.toBeVisible();
  });

  test("HTML shows rendered preview iframe with toggle to code view", async ({ page }) => {
    await page.goto("/");
    await page.locator(".tree-item .label", { hasText: "sample.html" }).click();
    const content = page.locator("#content-area");
    // Preview mode: rendered page inside a sandboxed iframe
    await expect(content.locator("iframe.html-preview")).toBeVisible();
    const frame = page.frameLocator("iframe.html-preview");
    await expect(frame.locator("h1")).toHaveText("Hello from HTML");

    // Switch to code view
    await page.locator(".view-toggle button", { hasText: "Code" }).click();
    await expect(content.locator(".source-code")).toBeVisible();
    await expect(content.locator(".source-code")).toContainText("<h1>Hello from HTML</h1>");
    await expect(content.locator("iframe.html-preview")).toHaveCount(0);

    // Switch back to preview
    await page.locator(".view-toggle button", { hasText: "Preview" }).click();
    await expect(page.frameLocator("iframe.html-preview").locator("h1")).toHaveText("Hello from HTML");
  });

  test("HTML preview loads its own relative image and stylesheet", async ({ page }) => {
    await page.goto("/site/index.html");
    const iframe = page.locator("#content-area iframe.html-preview");
    await expect(iframe).toHaveAttribute("src", "/_raw/site/index.html");
    const frame = page.frameLocator("iframe.html-preview");
    await expect(frame.locator("h1")).toHaveText("Site with relative assets");
    // Relative img/dot.png resolves to /_raw/site/img/dot.png and loads.
    await expect
      .poll(() =>
        frame.locator("#rel-img").evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)
      )
      .toBe(true);
    // Relative css/style.css applies.
    await expect(frame.locator("h1")).toHaveCSS("color", "rgb(255, 0, 0)");
  });

  test("non-image binary shows 'Binary file not displayed' with download link", async ({ page }) => {
    await page.goto("/");
    await page.locator(".tree-item .label", { hasText: "tiny.bin" }).click();
    const content = page.locator("#content-area");
    await expect(content.locator(".binary-info")).toBeVisible();
    await expect(content.locator("text=Binary file not displayed")).toBeVisible();
    await expect(content.locator(".binary-download")).toBeVisible();
    const href = await content.locator(".binary-download").getAttribute("href");
    expect(href).toContain("/_raw/tiny.bin");
  });
});

test.describe("README below directory listing", () => {
  test("renders README.md below the file listing in a directory", async ({ page }) => {
    await page.goto("/");
    await page.locator(".tree-item .label", { hasText: "subdir" }).click();
    const content = page.locator("#content-area");
    await expect(content.locator(".dir-listing")).toBeVisible();
    await expect(content.locator(".readme-container")).toBeVisible();
    await expect(content.locator(".readme-header")).toHaveText("README.md");
    await expect(content.locator(".readme-body h1", { hasText: "Subdir README" })).toBeVisible();
  });

  test("renders README.md on initial page load at root", async ({ page }) => {
    await page.goto("/");
    const content = page.locator("#content-area");
    await expect(content.locator(".dir-listing")).toBeVisible();
    await expect(content.locator(".readme-container")).toBeVisible();
    await expect(content.locator(".readme-header")).toHaveText("README.md");
    await expect(content.locator(".readme-body h1", { hasText: "Root README" })).toBeVisible();
  });

  test("renders README.md after browser back navigation", async ({ page }) => {
    // Navigate directly to subdir via URL
    await page.goto("/subdir");
    await expect(page.locator("#content-area .readme-body h1", { hasText: "Subdir README" })).toBeVisible();
    // Navigate to a file within the directory listing
    await page.locator(".dir-listing-row .name", { hasText: "nested.md" }).click();
    await expect(page.locator("#content-area .markdown-body h1", { hasText: "Nested" })).toBeVisible();
    // Go back to subdir using browser back
    await page.goBack();
    const content = page.locator("#content-area");
    await expect(content.locator(".dir-listing")).toBeVisible();
    await expect(content.locator(".readme-container")).toBeVisible();
    await expect(content.locator(".readme-body h1", { hasText: "Subdir README" })).toBeVisible();
  });

  test("renders README.md on direct URL navigation to directory", async ({ page }) => {
    await page.goto("/subdir");
    const content = page.locator("#content-area");
    await expect(content.locator(".dir-listing")).toBeVisible();
    await expect(content.locator(".readme-container")).toBeVisible();
    await expect(content.locator(".readme-header")).toHaveText("README.md");
    await expect(content.locator(".readme-body h1", { hasText: "Subdir README" })).toBeVisible();
  });
});

test.describe("Markdown image rewriting", () => {
  test("local image src is rewritten to /_raw", async ({ page }) => {
    await page.goto("/images.md");
    const content = page.locator("#content-area .markdown-body");
    await expect(content).toBeVisible();

    // Relative image (pixel.png) should be rewritten
    const relImg = content.locator('img[alt="pixel"]');
    await expect(relImg).toBeVisible();
    const relSrc = await relImg.getAttribute("src");
    expect(relSrc).toContain("/_raw/pixel.png");

    // Dot-relative image (./pixel.png) should also be rewritten
    const dotImg = content.locator('img[alt="pixel dot"]');
    await expect(dotImg).toBeVisible();
    const dotSrc = await dotImg.getAttribute("src");
    expect(dotSrc).toContain("/_raw/pixel.png");

    // External image should NOT be rewritten
    const extImg = content.locator('img[alt="external"]');
    await expect(extImg).toBeVisible();
    const extSrc = await extImg.getAttribute("src");
    expect(extSrc).toBe("https://example.com/logo.png");
  });

  test("rewritten image actually loads via /_raw", async ({ page }) => {
    await page.goto("/images.md");
    const content = page.locator("#content-area .markdown-body");
    await expect(content).toBeVisible();

    const img = content.locator('img[alt="pixel"]');
    await expect(img).toBeVisible();
    // Verify the image loaded successfully (naturalWidth > 0)
    const loaded = await img.evaluate(
      (el: HTMLImageElement) => el.complete && el.naturalWidth > 0
    );
    expect(loaded).toBe(true);
  });
});

test.describe("URL routing", () => {
  test("direct navigation to a file URL loads the file", async ({ page }) => {
    await page.goto("/hello.md");
    const content = page.locator("#content-area");
    await expect(content.locator(".markdown-body")).toBeVisible();
    await expect(content.locator("h1", { hasText: "Hello World" })).toBeVisible();
  });
});

test.describe("Connection error handling", () => {
  test("connection banner is hidden by default", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#connection-banner")).not.toHaveClass(/show/);
  });

  test("connection banner exists with retry button", async ({ page }) => {
    await page.goto("/");
    // Banner element exists but is hidden
    await expect(page.locator("#connection-banner")).toBeAttached();
    await expect(page.locator("#connection-banner .retry-btn")).toBeAttached();
    await expect(page.locator("#connection-banner .banner-message")).toBeAttached();
  });

  test("failed file fetch shows connection error banner", async ({ page }) => {
    await page.goto("/");
    // Wait for initial load
    await expect(page.locator("#tree-container .tree-item")).not.toHaveCount(0);

    // Mock fetch to fail
    await page.evaluate(() => {
      (window as any).originalFetch = window.fetch;
      window.fetch = () => Promise.reject(new Error("Network error"));
    });

    // Try to load a file - should show error
    await page.locator(".tree-item .label", { hasText: "hello.md" }).click();
    await expect(page.locator("#connection-banner")).toHaveClass(/show/);
    await expect(page.locator("#content-area")).toContainText("Unable to load file");

    // Restore fetch
    await page.evaluate(() => {
      window.fetch = (window as any).originalFetch;
    });
  });

  test("failed tree fetch shows connection error banner", async ({ page }) => {
    await page.goto("/");
    // Wait for initial load
    await expect(page.locator("#tree-container .tree-item")).not.toHaveCount(0);

    // Mock fetch to fail
    await page.evaluate(() => {
      (window as any).originalFetch = window.fetch;
      window.fetch = () => Promise.reject(new Error("Network error"));
    });

    // Click a folder to trigger tree fetch - should show error
    await page.locator(".tree-item .label", { hasText: "subdir" }).click();
    await expect(page.locator("#connection-banner")).toHaveClass(/show/);

    // Restore fetch
    await page.evaluate(() => {
      window.fetch = (window as any).originalFetch;
    });
  });
});

test.describe("Wiki links", () => {
  test("wiki link with mixed-case heading navigates and scrolls to target", async ({ page }) => {
    await page.goto("/wiki-test.md");
    const content = page.locator("#content-area .markdown-body");
    await expect(content.locator("h1", { hasText: "Wiki Link Test" })).toBeVisible();

    // Find the wiki link with mixed case heading
    const wikiLink = content.locator('a.wiki-link', { hasText: "Jump to Code Block" });
    await expect(wikiLink).toBeVisible();

    // Verify the href is correctly slugified (lowercase, hyphenated)
    await expect(wikiLink).toHaveAttribute("href", "/hello.md#code-block");

    // Click the link
    await wikiLink.click();

    // Should navigate to hello.md and the Code Block heading should be visible
    await expect(page.locator("#content-area .markdown-body h2#code-block")).toBeVisible();

    // URL should include the hash
    expect(page.url()).toContain("/hello.md#code-block");
  });

  test("wiki link href is properly slugified", async ({ page }) => {
    await page.goto("/wiki-test.md");
    const content = page.locator("#content-area .markdown-body");
    await expect(content.locator("h1", { hasText: "Wiki Link Test" })).toBeVisible();

    // Check that heading anchors in hrefs are slugified (wait for resolution)
    const linkWithHeading = content.locator('a.wiki-link[data-wiki-heading="Code Block"]');
    // Wait for the link to be resolved (href changes from "#" to actual path)
    await expect(linkWithHeading).toHaveAttribute("href", /^\/hello\.md#/);

    const href = await linkWithHeading.getAttribute("href");
    // href should have lowercase, hyphenated anchor
    expect(href).toBe("/hello.md#code-block");
  });
});

test.describe("Theme menu", () => {
  // The menu drops from the breadcrumb bar; on short paths it used to be
  // painted under the sidebar column (bar sticky z-index 5 vs sidebar tree).
  test("opens clear of the sidebar on short paths", async ({ page }) => {
    await page.goto("/data.csv");
    await page.locator("#theme-toggle").click();
    await page.locator("#theme-menu .theme-menu-item").first().waitFor();

    const probe = await page.evaluate(() => {
      const r = (s) => document.querySelector(s).getBoundingClientRect();
      const menu = r("#theme-menu");
      const sidebar = r("#sidebar");
      const bar = r("#breadcrumb-bar");
      const hit = document.elementFromPoint(menu.left + 6, menu.top + menu.height / 2);
      return {
        clears: menu.left >= sidebar.right - 1,
        pinnedRight: Math.abs(bar.right - menu.right) < 48,
        clickable: !!hit && !!hit.closest("#theme-menu"),
      };
    });
    expect(probe.clears).toBe(true);
    expect(probe.pinnedRight).toBe(true);
    expect(probe.clickable).toBe(true);
  });

  test("stays clickable above a very wide sidebar", async ({ page }) => {
    await page.goto("/data.csv");
    await page.evaluate(() => {
      const sidebar = document.querySelector("#sidebar");
      sidebar.style.maxWidth = "none";
      sidebar.style.width = "1100px";
    });
    await page.locator("#theme-toggle").click();
    await page.locator("#theme-menu .theme-menu-item").first().waitFor();

    const clickable = await page.evaluate(() => {
      const menu = document.querySelector("#theme-menu").getBoundingClientRect();
      const hit = document.elementFromPoint(menu.left + 6, menu.top + menu.height / 2);
      return !!hit && !!hit.closest("#theme-menu");
    });
    expect(clickable).toBe(true);
  });
});

test.describe("Line-number gutter", () => {
  // The gutter keeps a gap between the number column and the code:
  // 1.25em at the 13px mono font = 16.25px, same rhythm as the
  // plain-text reading view's numbered gutter.
  const PAD = "16.25px";

  test("code views pad the number column", async ({ page }) => {
    for (const label of ["sample.py", "data.json", "sample.go", "config.yaml"]) {
      await page.goto("/");
      await page.locator(".tree-item .label", { hasText: label }).click();
      await page.locator("#content-area .ln").first().waitFor();
      const pad = await page.evaluate(
        () => getComputedStyle(document.querySelector("#content-area .ln")).paddingRight,
      );
      expect(pad).toBe(PAD);
    }
  });

  test("xml and html Code tabs use the same padded gutter", async ({ page }) => {
    await page.goto("/");
    await page.locator(".tree-item .label", { hasText: "sample.xml" }).click();
    await page.locator("button", { hasText: /^Code$/ }).first().click();
    await page.locator("#content-area .ln").first().waitFor();
    let pad = await page.evaluate(
      () => getComputedStyle(document.querySelector("#content-area .ln")).paddingRight,
    );
    expect(pad).toBe(PAD);

    await page.goto("/");
    await page.locator(".tree-item .label", { hasText: "sample.html" }).click();
    await page.locator("button", { hasText: /^Code$/ }).first().click();
    await page.locator("#content-area .ln").first().waitFor();
    pad = await page.evaluate(
      () => getComputedStyle(document.querySelector("#content-area .ln")).paddingRight,
    );
    expect(pad).toBe(PAD);
  });

  test("markdown fences render without numbered lines", async ({ page }) => {
    await page.goto("/hello.md");
    await page.locator(".markdown-body pre code").first().waitFor();
    const count = await page.evaluate(
      () => document.querySelectorAll("#content-area .ln").length,
    );
    expect(count).toBe(0);
  });

  test("reading view keeps its padded number gutter", async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("plainTextNumbers", "1"));
    await page.goto("/example.txt");
    await page.locator("pre.plain-text.show-numbers").waitFor();
    const margin = await page.evaluate(() => {
      const line = document.querySelector(".plain-text .plain-line");
      return line ? getComputedStyle(line, "::before").marginRight : null;
    });
    expect(margin).toBe(PAD);
  });
});

test.describe("Collapse & fold", () => {
  // Indent-based folds on chroma code views (functions, JSON keys, …).
  // The caret lives in the number gutter; the Collapse/Expand switch in
  // the file header toggles every range at once. Folds are session-only.
  test("python code folds collapse function bodies via the gutter caret", async ({
    page,
  }) => {
    await page.goto("/");
    await page.locator(".tree-item .label", { hasText: "sample.py" }).click();
    await page.locator("#content-area .line").first().waitFor();
    expect(
      await page.evaluate(
        () => document.querySelectorAll("#content-area .line.foldable").length,
      ),
    ).toBe(2);

    // Fold greet's body: the return line plus the blank separator hide.
    await page.locator("#content-area .line.foldable .ln").first().click();
    expect(
      await page.evaluate(
        () => document.querySelectorAll("#content-area .line.folded").length,
      ),
    ).toBe(2);
    const visible = await page.evaluate(
      () =>
        Array.from(document.querySelectorAll("#content-area .line")).filter(
          (el) => getComputedStyle(el).display !== "none",
        ).length,
    );
    expect(visible).toBe(3);

    // The collapsed fold keeps its ellipsis marker on the start line.
    expect(
      await page.evaluate(() => {
        const cl = document.querySelector(
          "#content-area .line.collapsed .cl",
        );
        return getComputedStyle(cl, "::after").content;
      }),
    ).toContain("⋯");

    await page.locator("#content-area .line.foldable .ln").first().click();
    expect(
      await page.evaluate(
        () => document.querySelectorAll("#content-area .line.folded").length,
      ),
    ).toBe(0);
  });

  test("the fold switch collapses and expands every range at once", async ({
    page,
  }) => {
    await page.goto("/");
    await page.locator(".tree-item .label", { hasText: "data.json" }).click();
    await page.locator("#content-area .line").first().waitFor();
    expect(
      await page.evaluate(
        () => document.querySelectorAll("#content-area .line.folded").length,
      ),
    ).toBe(0);

    const switchBtn = page.locator("#file-header-bar .fold-switch");
    await switchBtn.click();
    expect(
      await page.evaluate(
        () => document.querySelectorAll("#content-area .line.folded").length,
      ),
    ).toBeGreaterThan(0);
    await expect(switchBtn).toHaveText("Expand");

    await switchBtn.click();
    expect(
      await page.evaluate(
        () => document.querySelectorAll("#content-area .line.folded").length,
      ),
    ).toBe(0);
    await expect(switchBtn).toHaveText("Collapse");
  });

  test("xml tree nodes collapse child listings via carets", async ({ page }) => {
    await page.goto("/");
    await page.locator(".tree-item .label", { hasText: "sample.xml" }).click();
    await page.locator("#content-area li.xml-node").first().waitFor();
    expect(
      await page.evaluate(
        () => document.querySelectorAll("#content-area .xml-fold").length,
      ),
    ).toBeGreaterThan(0);

    await page.locator("#content-area .xml-fold").first().click();
    const first = await page.evaluate(() => {
      const li = document.querySelector("#content-area li.xml-node");
      const ul = li.querySelector(":scope > ul.xml-children");
      return {
        collapsed: li.classList.contains("collapsed"),
        hidden: ul ? getComputedStyle(ul).display === "none" : false,
      };
    });
    expect(first.collapsed).toBe(true);
    expect(first.hidden).toBe(true);

    await page.locator("#content-area .xml-fold").first().click();
    expect(
      await page.evaluate(
        () => !document.querySelector("#content-area li.xml-node").classList.contains("collapsed"),
      ),
    ).toBe(true);
  });

  test("the xml fold switch and Code tab fold their views", async ({ page }) => {
    await page.goto("/");
    await page.locator(".tree-item .label", { hasText: "sample.xml" }).click();
    await page.locator("#content-area li.xml-node").first().waitFor();

    // Tree tab: collapse-all hits every node that has children.
    const switchBtn = page.locator("#file-header-bar .fold-switch");
    await switchBtn.click();
    expect(
      await page.evaluate(
        () =>
          document.querySelectorAll("#content-area .xml-node.collapsed")
            .length,
      ),
    ).toBe(7);
    await expect(switchBtn).toHaveText("Expand");
    await switchBtn.click();
    expect(
      await page.evaluate(
        () =>
          document.querySelectorAll("#content-area .xml-node.collapsed")
            .length,
      ),
    ).toBe(0);

    // Code tab: the same switch drives the indent folds of the source.
    await page.locator("button", { hasText: /^Code$/ }).first().click();
    await page.locator("#content-area .line.foldable").first().waitFor();
    await switchBtn.click();
    expect(
      await page.evaluate(
        () => document.querySelectorAll("#content-area .line.folded").length,
      ),
    ).toBeGreaterThan(0);
    await expect(switchBtn).toHaveText("Expand");
  });
});

test.describe("Dark rose theme", () => {
  // The pink-shaded take on Dark: ships as a first-class picker entry
  // with the full 44-variable contract.
  test("opens from the menu and paints pink-shaded dark chrome", async ({
    page,
  }) => {
    await page.goto("/");
    await page.locator("#theme-toggle").click();
    const menu = page.locator("#theme-menu");
    await expect(menu).toBeVisible();
    await menu.locator(".theme-menu-item", { hasText: "Dark rose" }).click();
    await expect(menu).toBeHidden();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "rose");
    expect(
      await page.evaluate(() => localStorage.getItem("rv-theme")),
    ).toBe("rose");
    // --rv-bg #2a1f27 on the body, --rv-link #f5a8c6 on the root.
    expect(
      await page.evaluate(
        () => getComputedStyle(document.body).backgroundColor,
      ),
    ).toBe("rgb(42, 31, 39)");
    expect(
      await page.evaluate(() =>
        getComputedStyle(document.documentElement)
          .getPropertyValue("--rv-link")
          .trim(),
      ),
    ).toBe("#f5a8c6");
  });

  test("persists across a reload", async ({ page }) => {
    await page.goto("/");
    await page.locator("#theme-toggle").click();
    await page
      .locator("#theme-menu .theme-menu-item", { hasText: "Dark rose" })
      .click();
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "rose");
  });

  test("code tokens follow the pink colorway", async ({ page }) => {
    await page.addInitScript(() =>
      localStorage.setItem("rv-theme", "rose"),
    );
    await page.goto("/");
    await page.locator(".tree-item .label", { hasText: "sample.py" }).click();
    await page.locator("#content-area .source-code").first().waitFor();
    const colors = await page.evaluate(() => {
      const token = document.querySelector(
        "#content-area .source-code .k, #content-area .source-code .kd",
      );
      return {
        token: token ? getComputedStyle(token).color : null,
        keyVar: getComputedStyle(document.documentElement)
          .getPropertyValue("--rv-code-key")
          .trim(),
      };
    });
    expect(colors.token).toBeTruthy();
    // The token color resolves through --rv-code-key (hex → rgb).
    expect(colors.token).toBe("rgb(245, 162, 200)");
    expect(colors.keyVar).toBe("#f5a2c8");
  });
});

test.describe("Fold switch styling", () => {
  // The Collapse/Expand switch shares the standalone header action-button
  // rule set (outline-btn / edit-dropdown-btn family): themed surfaces,
  // 6px radius, active state flips to --rv-bg-active + accent border.
  const probe = (page) =>
    page.evaluate(() => {
      const el = document.querySelector("#file-header-bar .fold-switch");
      const cs = getComputedStyle(el);
      const active = el.classList.contains("active");
      const resolve = (value) => {
        const d = document.createElement("div");
        d.style.background = value;
        document.body.appendChild(d);
        const c = getComputedStyle(d).backgroundColor;
        d.remove();
        return c;
      };
      return {
        active,
        text: el.textContent,
        radius: cs.borderRadius,
        bg: cs.backgroundColor,
        border: cs.borderColor,
        color: cs.color,
        expectBg: resolve(
          active ? "var(--rv-bg-active)" : "var(--rv-bg-secondary)",
        ),
        expectBorder: resolve(
          active ? "var(--rv-border-active)" : "var(--rv-border)",
        ),
        expectColor: resolve(active ? "var(--rv-link)" : "var(--rv-text)"),
      };
    });

  test("matches the header action-button look at rest and when active", async ({
    page,
  }) => {
    await page.goto("/");
    await page.locator(".tree-item .label", { hasText: "sample.py" }).click();
    const btn = page.locator("#file-header-bar .fold-switch");
    await btn.waitFor();

    const resting = await probe(page);
    expect(resting.active).toBe(false);
    expect(resting.text).toBe("Collapse");
    expect(resting.radius).toBe("6px");
    expect(resting.bg).toBe(resting.expectBg);
    expect(resting.border).toBe(resting.expectBorder);
    expect(resting.color).toBe(resting.expectColor);

    // Collapsing everything flips the switch into its active state.
    await btn.click();
    const active = await probe(page);
    expect(active.active).toBe(true);
    expect(active.text).toBe("Expand");
    expect(active.bg).toBe(active.expectBg);
    expect(active.border).toBe(active.expectBorder);
    expect(active.color).toBe(active.expectColor);
  });

  test("is styled in the rose theme too (no hardcoded colors)", async ({
    page,
  }) => {
    await page.addInitScript(() => localStorage.setItem("rv-theme", "rose"));
    await page.goto("/");
    await page.locator(".tree-item .label", { hasText: "data.json" }).click();
    await page.locator("#file-header-bar .fold-switch").waitFor();
    const s = await probe(page);
    expect(s.bg).toBe(s.expectBg);
    expect(s.border).toBe(s.expectBorder);
  });
});

test.describe("PWA (Add to Home Screen)", () => {
  test("manifest is linked and lists icons that load", async ({ page, request }) => {
    await page.goto("/");
    const href = await page.locator('link[rel="manifest"]').getAttribute("href");
    expect(href).toBe("/api/manifest.webmanifest");

    const res = await request.get(href!);
    expect(res.ok()).toBeTruthy();
    const manifest = await res.json();
    expect(manifest.display).toBe("standalone");
    expect(manifest.short_name).toBe("testdata");
    for (const icon of manifest.icons) {
      const iconRes = await request.get(icon.src);
      expect(iconRes.ok()).toBeTruthy();
      expect(iconRes.headers()["content-type"]).toBe("image/png");
    }

    const touchIcon = await page.locator('link[rel="apple-touch-icon"]').getAttribute("href");
    expect((await request.get(touchIcon!)).ok()).toBeTruthy();
  });

  test("theme-color meta follows the active theme", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto("/");
    await page.evaluate(() => localStorage.removeItem("rv-theme"));
    await page.reload();
    const meta = page.locator('meta[name="theme-color"]');
    await expect(meta).toHaveAttribute("content", "#ffffff");

    await page.locator("#theme-toggle").click();
    await page
      .locator("#theme-menu .theme-menu-item", { hasText: /^Dark(✓)?$/ })
      .click();
    await expect(meta).toHaveAttribute("content", "#1e1e2e");

    // Persisted dark theme is applied on load, before any pick.
    await page.reload();
    await expect(meta).toHaveAttribute("content", "#1e1e2e");

    await page.locator("#theme-toggle").click();
    await page
      .locator("#theme-menu .theme-menu-item", { hasText: /^Light(✓)?$/ })
      .click();
    await expect(meta).toHaveAttribute("content", "#ffffff");
  });

  test("an unrelated user file is still routed to the SPA, not shadowed", async ({ page }) => {
    await page.goto("/hello.md");
    await expect(page.locator("#content-area")).toContainText("Hello");
  });
});

test.describe("Desktop sidebar toggle", () => {
  test("menu button collapses and expands the sidebar", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");
    const sidebar = page.locator("#sidebar");
    await expect(page.locator("#menu-toggle")).toBeVisible();
    await page.locator("#menu-toggle").click();
    await expect(sidebar).toHaveClass(/collapsed/);
    await expect.poll(() => sidebar.evaluate((el) => el.getBoundingClientRect().width)).toBe(0);
    await page.locator("#menu-toggle").click();
    await expect(sidebar).not.toHaveClass(/collapsed/);
    await expect.poll(() => sidebar.evaluate((el) => el.getBoundingClientRect().width)).toBeGreaterThan(100);
  });

  test("Cmd/Ctrl+Backslash toggles, works in inputs, and persists", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");
    const sidebar = page.locator("#sidebar");
    await page.keyboard.press("Meta+Backslash");
    await expect(sidebar).toHaveClass(/collapsed/);
    await page.reload();
    await expect(sidebar).toHaveClass(/collapsed/);
    // Works while typing in the search input
    await page.keyboard.press("t");
    await expect(page.locator("#search-input")).toBeFocused();
    await page.keyboard.press("Control+Backslash");
    await expect(sidebar).not.toHaveClass(/collapsed/);
    await page.reload();
    await expect(sidebar).not.toHaveClass(/collapsed/);
  });

  test("shortcut opens the drawer on narrow screens", async ({ page }) => {
    await page.setViewportSize({ width: 600, height: 800 });
    await page.goto("/");
    await expect(page.locator("#tree-container .tree-item").first()).toBeAttached();
    await expect(page.locator(".dir-listing-row").first()).toBeAttached();
    await page.keyboard.press("Control+Backslash");
    await expect(page.locator("#sidebar")).toHaveClass(/open/);
    await expect(page.locator("#sidebar")).not.toHaveClass(/collapsed/);
  });
});

test.describe("Rendering safety", () => {
  // Serve a crafted markdown file without touching the fixtures.
  async function serveMarkdown(page, html: string) {
    await page.route("**/api/file?path=evil.md", (route) =>
      route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({ name: "evil.md", path: "evil.md", isMarkdown: true, content: html, rawContent: "" }),
      }),
    );
  }

  test("mermaid source is never re-inserted as HTML on theme change", async ({ page }) => {
    await serveMarkdown(
      page,
      '<pre><code class="language-mermaid">graph TD\n  A--&gt;B\n%% &lt;img src=x onerror="window.__pwned=1"&gt;</code></pre>',
    );
    await page.goto("/evil.md");
    await expect(page.locator("#content-area .mermaid")).toHaveCount(1);
    await page.locator("#theme-toggle").click();
    await page
      .locator("#theme-menu .theme-menu-item", { hasText: /^Nord(✓)?$/ })
      .click();
    await page.emulateMedia({ colorScheme: "dark" });
    await page.waitForTimeout(500);
    expect(await page.evaluate(() => (window as any).__pwned)).toBeUndefined();
    await expect(page.locator("#content-area .mermaid img")).toHaveCount(0);
  });

  test("files too large to render offer a download", async ({ page }) => {
    await page.route("**/api/file?path=huge.log", (route) =>
      route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({ name: "huge.log", path: "huge.log", isTooLarge: true, size: 50 << 20 }),
      }),
    );
    await page.goto("/huge.log");
    await expect(page.locator("#content-area")).toContainText("Text file too large to preview");
    await expect(page.locator("#content-area .binary-download")).toHaveAttribute("href", "/_raw/huge.log");
  });

  test("script URLs are stripped from rendered links", async ({ page }) => {
    await serveMarkdown(
      page,
      '<p><a id="a1" href="javascript:window.__pwned=1">a</a> <a id="a2" href="java&#9;script:window.__pwned=2">b</a> ' +
        '<a id="a3" href="VBScript:x">c</a> <a id="a4" href="data:text/html,x">d</a> <a id="ok" href="https://example.com/">ok</a></p>',
    );
    await page.goto("/evil.md");
    await expect(page.locator("#content-area #ok")).toHaveAttribute("href", "https://example.com/");
    for (const id of ["a1", "a2", "a3", "a4"]) {
      await expect(page.locator(`#content-area #${id}`)).not.toHaveAttribute("href", /.*/);
    }
  });
});
