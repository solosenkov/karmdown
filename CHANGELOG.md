# Changelog

## 1.3.0 — 2026-10-12

The first public KarmDown release, based on the earlier private Markdown viewer.

### Added
- Document search with highlighted matches and keyboard navigation.
- Conservative frontmatter metadata panels and tag chips.
- File live reload with protection for modified drafts.
- Styled HTML export and clean browser Print / PDF.
- Extension-owned file viewer and Alt+Shift+M preview command.
- Remote-image opt-in and local draft cleanup.
- Public build checks, browser smoke tests, dependency checksums and a runtime-only ZIP packager.

### Fixed
- Highlighting, Mermaid and KaTeX now run in the correct extension context.
- Math parsing preserves code blocks and monetary amounts.
- Imported file drafts can be restored and are keyed by name and content fingerprint.
- English defaults, popup accessibility, narrow layouts and print overflow.
- HTML sanitization safely crosses isolated-world boundaries; no unsafe fallback rendering.

### Security and distribution
- Removed permanent HTTP/HTTPS host access; remote preview requires an explicit user command.
- Bundled dependencies are pinned; Mermaid includes the corrected KaTeX override.
- Local image export excludes non-image content.
- MIT source license and complete third-party notices included.
- Private documentation and development files excluded from publication bundles.
