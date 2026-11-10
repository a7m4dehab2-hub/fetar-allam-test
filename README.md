# فطار علام — Booking simulator

**For shared seats using Google Sheets, follow [GOOGLE-SHEETS-SETUP.md](GOOGLE-SHEETS-SETUP.md).** Leave `js/config.js` empty to keep local-only mode, or configure your deployed Apps Script `/exec` URL for shared mode. APK v6 supports either mode.

Independent, clearly labeled practice site. It reproduces the inspected public page’s group cards and reservation contract using new code. It has no connection to the real service and never asks for real credentials.

## Upload and publish on GitHub Pages

1. Create a GitHub repository, for example `fetar-allam-test`.
2. Upload the **contents** of this folder to the repository root. Keep `index.html`, `style.css`, `icon.png`, `.nojekyll` and `js/` together.
3. In the repository: **Settings → Pages → Deploy from a branch → main → /(root) → Save**.
4. When GitHub finishes publishing, open the HTTPS Pages URL, such as `https://YOURNAME.github.io/fetar-allam-test/`.
5. In APK version 6 or later, paste that Pages URL, including the repository path. A repository URL on `github.com` is not the published website URL.

No build step, tokens, or passwords are required. Node.js is only needed for local preview/tests: `npm start` and `npm test`.

## Test in the app

1. Open your published test link inside the app. The demo account is already signed in.
2. Set the opening delay to 60 seconds or longer and press **Reset & start countdown**.
3. For fallback testing, check **Fill the first listed group at opening**, then reset. Select the first listed group as first choice and any other as second choice.
4. Tap the app’s **Choose group**, select both preferences, then **Arm booking**. Leave the app visible.
5. Observe the result panel, My reservation, and request log. Expected fallback: `SLOT_NOT_OPEN` before opening, `SLOT_FULL` for the first group at opening, then `CONFIRMED` for the backup.
6. To repeat, reset the simulator, then use the app’s **Enter link** to reopen the same Pages URL and choose groups again. A stopped helper is not silently restarted.

The next-request rate-limit checkbox simulates HTTP 429. Response delay simulates slow responses; the app should keep only one request in progress.

## Scope and limits

GitHub Pages serves static files and cannot run a reservation backend. This demo therefore implements the API **locally in JavaScript**, with `localStorage` persistence scoped to that browser/app and site. The `api`, `serverNow`, `syncClock` exports and endpoint shapes match the APK’s expected contract. This tests group detection, timing, response handling and fallback. It does **not** test real server latency, distributed contention, authentication, or shared seats across devices. Each person has an independent simulator. Its clock is the device clock, rather than an independent server clock.

The APK remains able to accept the original service’s lesson URLs. Test only on the simulator when experimenting. No real booking was created during development.

The included icon was supplied by the user. Confirm you have the rights needed before making the repository public.
