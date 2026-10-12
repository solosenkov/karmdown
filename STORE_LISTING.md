# Chrome Web Store submission

The owner submits the ZIP after reviewing it. This document is listing material, not part of the extension package.

## Name
KarmDown — Markdown Viewer & Editor

## Short description
Read and edit Markdown files. Live preview, diagrams, math, search and export. Local processing, no analytics.

## Detailed description
Your Markdown, beautifully clear.

KarmDown turns local Markdown files into readable documents with a clean outline and an editor beside the preview. It works without an account, subscription, analytics or document uploads.

READ AND EXPLORE
• Preview, Split, Editor and Raw views
• Document outline, reading progress and remembered position
• Light, dark and system themes; adjustable reading width and text size
• GFM tables, task lists and GitHub-style alerts
• Syntax-highlighted code with copy buttons
• Mermaid diagrams and KaTeX formulas, with all libraries bundled locally
• Simple frontmatter metadata and tag chips
• Search with highlighted matches, match counts and next/previous navigation

EDIT AND EXPORT
• Live preview while you type
• Drafts stored locally in your browser profile
• Download your Markdown with Ctrl/Cmd+S
• Automatic refresh when an opened local file changes
• Conflict protection: disk changes never silently overwrite an edited draft
• Export styled HTML with embedded math fonts and diagrams
• Print or save as PDF through Chrome's print dialog

PRIVATE BY DEFAULT
• No developer-operated backend, telemetry or document collection
• Remote images blocked by default; enable them explicitly if needed
• Preferences may sync through Chrome Sync; document drafts remain local
• English by default, with a Russian interface available

GET STARTED
Open a file through the popup, or enable “Allow access to file URLs” in the extension's Details for automatic file:// preview. For raw Markdown on HTTP/HTTPS, invoke Alt+Shift+M. Normal HTML pages are not converted. Adjust shortcuts at chrome://extensions/shortcuts.

Saving downloads a new file; it does not write directly to the source. Files chosen through the picker do not grant access to neighboring images. HTML exports embed local images when readable; remote images, if enabled, remain external URLs. Frontmatter support is a conservative metadata parser, not full YAML.

Free and open source: https://github.com/solosenkov/karmdown

## Single purpose
Render Markdown documents opened by the user into a readable local preview, with related editing, search, outline and export tools.

## Permission justifications
- storage: save display preferences using Chrome Sync; save drafts and reading positions locally. Document text is never placed in sync storage.
- scripting: inject packaged highlighting, diagram and formula libraries into the isolated extension context when needed; start preview on a plain-text web page after the user invokes the command.
- activeTab: temporarily access the active web page only after an explicit user keyboard command. No persistent HTTP/HTTPS host access is requested.
- file://*/*: automatically render supported local Markdown files, resolve their local images and read the current document for live reload. This requires the user's Allow access to file URLs switch. The content script has filename globs and a second URL/content-type check.

## Privacy fields
Privacy policy: https://github.com/solosenkov/karmdown/blob/main/PRIVACY.md
Support: https://github.com/solosenkov/karmdown/issues
Homepage: https://github.com/solosenkov/karmdown

No user data is collected by or transmitted to the developer. Declare this consistently in the dashboard. Preferences may be synchronized by Google; opt-in remote images contact their hosts. These behaviors are disclosed in the policy and interface. No remotely hosted executable code is used.

## Submission assets
- ZIP: dist/karmdown-1.3.0-chrome.zip (upload ZIP directly; manifest at root)
- Store icon: icons/icon128.png
- Screenshots: store-assets/01-light-preview.png, 02-dark-split.png, 03-frontmatter.png, 04-search.png — 1280×800 each
- Small promotional tile: store-assets/promo-440x280.png

## Owner review
1. Install the extracted ZIP in your usual Chrome profile.
2. Enable file URL access and open examples/welcome.md from the GitHub repository.
3. Check Mermaid, KaTeX, Split editing, search, local drafts, disk-change conflict, HTML export and Print / PDF.
4. Review the listing, permissions and privacy policy.
5. Upload the ZIP to the developer dashboard, attach the screenshots and tile, complete declarations, and submit when satisfied.

Browser automation verifies the extension in Chromium. It does not guarantee acceptance by Google or replace the owner's final test in their Chrome profile.
