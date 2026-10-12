# Security

Only the latest release is supported. Please report suspected vulnerabilities privately through [GitHub private vulnerability reporting](https://github.com/solosenkov/karmdown/security/advisories/new). Do not post sensitive documents, exploit details or local file paths in public issues.

KarmDown treats Markdown as untrusted input: rendered HTML is sanitized with DOMPurify, Mermaid uses strict security, KaTeX disables trusted commands, metadata is inserted as text, and remote images are opt-in. Libraries are bundled locally and checksummed. File auto-reload never overwrites a modified draft automatically.

Drafts are local browser-profile data, not encrypted storage. A manually activated web preview shares the page's DOM; do not treat viewing a remote site as an isolated document sandbox. File URLs require the browser's explicit access switch.
