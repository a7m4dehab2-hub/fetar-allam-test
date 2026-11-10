# Run فطار علام with GitHub Pages and Google Sheets

Use the NEW ZIP containing this guide. The old ZIP was local-only. APK v6 accepts GitHub Pages links and does not need another update for this backend.

## 1. Prepare a Google Sheet

1. Create a new, empty Google spreadsheet. Call it `Fetar Allam Test Bookings`.
2. Keep the spreadsheet private. Do not publish it or put its edit link in your website.
3. In that spreadsheet, select **Extensions → Apps Script**.
4. Replace the starter code in `Code.gs` with the contents of `google-sheets/Code.gs` from the extracted ZIP. Save.
5. Select `setup` from the function selector and click **Run**. Review the requested Google permissions and authorize your own script. If your organization prevents authorization, contact its administrator rather than changing security settings.
6. Return to the spreadsheet. You should see four new tabs: **Settings**, **Groups**, **Bookings**, and **Requests**. The existing empty default tab can stay.

Run `setup` only once. It refuses to overwrite existing backend tabs.

## 2. Deploy the backend

1. In Apps Script: **Deploy → New deployment**.
2. Select the gear icon, then **Web app**.
3. Set **Execute as: Me**.
4. Set **Who has access: Anyone**. This is the public demo API, not public edit access to the spreadsheet. If this option is unavailable on your managed account, this deployment method will not work there.
5. Click **Deploy**. Copy the **Web app URL** ending in `/exec`.
6. Open that URL in a new browser tab. It should return a small JSON message naming the test backend. This confirms the deployment opens, but does not yet prove the GitHub connection works.

This endpoint accepts pseudonymous demo bookings. It is not a production login system; use only test data. Never put real student details, passwords or personal records in these tabs.

## 3. Connect the website

1. In the extracted website folder, open `js/config.js` in a text editor.
2. Replace the empty value with your Web app URL, keeping quotation marks:

```js
export const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec';
```

Use the Apps Script `/exec` URL, not the spreadsheet URL or a `/dev` testing URL. No API key or spreadsheet ID belongs in this public file.

## 4. Upload to GitHub and turn on Pages

1. Create a new GitHub repository, for example `fetar-allam-test`.
2. Choose **Add file → Upload files**. Upload the extracted ZIP's **contents**, with `index.html` at the repository root. Do not upload only the ZIP or an extra enclosing folder.
3. Keep the `js` folder together, including your edited `config.js`. Commit the files. The `google-sheets` folder is reference source; the backend actually runs in your deployed Apps Script.
4. Open **Settings → Pages**. Select **Deploy from a branch**, branch **main**, folder **/(root)**, then **Save**.
5. Wait until GitHub displays the published URL, usually `https://YOURNAME.github.io/fetar-allam-test/`.
6. Open that URL. It should display **SHARED TEST · GOOGLE SHEETS**, load the lesson groups, and show the opening countdown. If it still says local simulator, check `js/config.js` was committed and reload.

## 5. Start a shared test round

1. In Apps Script, run **startTest**. This clears ONLY the demo **Bookings** and **Requests** rows and sets opening to two minutes from Google's current server time. Group capacities stay unchanged.
2. Open the GitHub Pages URL in APK v6 on each phone. The website creates a separate random demo identity for each browser/app automatically. No password is needed.
3. In the app, tap **Choose group**, select your first and second choices, and **Arm booking**. Keep the app open.
4. The configured attempt window is 10 seconds before through 10 seconds after opening, at up to five sequential attempts per second. Slow responses reduce the actual rate. Success, rate limiting and errors stop it early.
5. Check **Bookings** in the spreadsheet for the successful reservation and **Requests** for the server results. The website refreshes shared results about every five seconds.
6. For a new round, run `startTest` again, then reopen the link in the app before selecting choices. Use **No backup** or a different first choice if needed.

### Test the backup

The first group has one seat by default. Have two phones choose it as first choice and different available backups. At opening, one can win the first seat; the other receives `SLOT_FULL` and tries its backup. The backend serializes capacity checks and writes with Apps Script's script lock.

Alternatively, set a group's capacity to `0` in **Groups** before arming to test an already-full first choice. Edit only the capacity column or group labels before a round; preserve the `slt_demo...` IDs. Never modify Groups during pending reservations.

### Set a different opening time

Edit **Settings!B2** to an ISO timestamp including a timezone, for example `2026-11-20T21:00:00+02:00`. This example means 9 p.m. Cairo standard time on that date. Do not use an expired date for a new test. Run `startTest` for the easier relative two-minute countdown instead. Keep the setting as an ISO text value, not an ambiguous localized date.

## Troubleshooting

- **No groups / Google login page / HTML instead of JSON:** use the deployed `/exec` URL and access `Anyone`. An owner-only deployment cannot be used by anonymous test phones.
- **Google Sheets connection failed:** open the Apps Script **Executions** page to inspect errors. Verify the website endpoint URL, setup completion, Google permissions and public Web app deployment. If browser cross-origin access is blocked in your deployment/account, this connection needs a same-origin proxy; do not use `no-cors`, which hides the booking result.
- **Backend busy / RATE LIMITED:** stop the test and wait. Do not bypass the limit. Apps Script quotas and locks can make this backend slower than the real site.
- **After editing Apps Script code:** choose **Deploy → Manage deployments → Edit → New version → Deploy**. Reuse the same deployment URL. If you create a new deployment URL, update `js/config.js` and commit again.
- **App says a previous attempt needs review:** check the spreadsheet first. Run `startTest` only when a clean new round is intended, then close and reopen the lesson page in the app. Do not retry an uncertain real reservation.

## What this can test

Unlike the original local simulator, this backend shares capacity across devices and uses Google's server time. It tests reservation handling, first/second choices and competition for limited test seats. Google Apps Script latency, Google Sheets writes and execution quotas make it unsuitable for measuring millisecond timing or load-testing hundreds of users. Deployment and cross-origin connectivity must be verified in your own Google account; no deployment has been created for you here.

References: [GitHub Pages setup](https://docs.github.com/en/pages/quickstart), [Apps Script Web apps](https://developers.google.com/apps-script/guides/web), [Content Service](https://developers.google.com/apps-script/guides/content), [LockService](https://developers.google.com/apps-script/reference/lock/lock-service).
