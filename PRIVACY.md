# KarmDown Privacy Policy

Effective date: October 12, 2026.

KarmDown renders, edits, searches and exports Markdown documents in your browser. It has no accounts, analytics, advertising, telemetry or developer-operated backend. We do not collect or receive your documents, browsing history, drafts or personal information. No executable code is downloaded at runtime.

## Data on your device

Document text is processed locally. Edited drafts, document identifiers (file URLs or a selected file's name/content fingerprint), timestamps and reading positions are stored in `chrome.storage.local` in your browser profile. They persist until you discard a draft, use **Clear local drafts** in the popup, or remove the extension. They are accessible to someone with access to your browser profile; they are not encrypted by KarmDown.

Display settings, language and switches are saved in `chrome.storage.sync`. If Chrome Sync is enabled, Google may synchronize these preferences between your signed-in browsers under Google's privacy policy. Document text and drafts are never stored in sync storage.

## Network and file access

Automatic rendering is limited to local Markdown files and requires Chrome's **Allow access to file URLs** switch. Live reload reads only the currently opened local Markdown file. KarmDown never writes directly to your original files: saving creates a download.

On web pages, preview starts only when you invoke the keyboard command. The temporary `activeTab` permission allows the extension to read that page for preview. Normal HTML pages and restricted browser pages are not converted.

Remote images are blocked by default. If you enable **Remote images**, your browser requests image URLs contained in the document. Those image hosts receive ordinary network information, such as your IP address; KarmDown sets a no-referrer policy for viewer images. Clicking a document link may also contact the linked website. Local relative images are read from the opened file's location; choosing a file through the picker does not grant access to its neighboring files.

Exports and downloads are saved where you choose. Local images are embedded in HTML exports when readable; explicitly enabled remote images remain external URLs. KarmDown does not upload exports.

## Contact and changes

For privacy questions, contact the maintainer through [GitHub issues](https://github.com/solosenkov/karmdown/issues). Do not attach sensitive documents to public issues. Changes to these practices will be reflected in this policy.
