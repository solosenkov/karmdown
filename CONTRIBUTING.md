# Contributing

Use Node.js 22+ and Python 3. Install dependencies with `npm ci --ignore-scripts`.

Run `npm run check`, `npm audit`, and `npm run build` before submitting a change. Run `npm run verify:browser` with an installed Playwright Chromium (`npx playwright-core install chromium`); set `KARMDOWN_CHROMIUM` when using a custom Chrome for Testing executable. Tests use a fresh temporary profile and public synthetic fixtures.

Keep English and Russian UI keys in sync, preserve English defaults, and add behavioral regression tests. Avoid broad host access, remote scripts, telemetry, unsafe HTML sinks and document uploads.

`npm run vendor` regenerates browser libraries from locked packages. `vendor/checksums.json` and full dependency license notices are refreshed by the vendor script. Review both after a deliberate dependency update. Store ZIPs are built from an explicit runtime allowlist, not the entire repository. Private `docs/`, development tooling and screenshots must not enter the extension ZIP.

Please open an issue before proposing major features. Never include credentials or private documents in issues or pull requests.
