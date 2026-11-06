# kipwell.co

The Kipwell marketing site: one landing page, a privacy page and an early-access form. Plain HTML, CSS and a little JavaScript, hosted free on GitHub Pages. No build step.

The product itself is a separate app (the Base44 prototype, later app.kipwell.co). Nothing here touches it.

## What's where

| Path | What it is |
|---|---|
| `index.html` | The landing page. All copy lives here. |
| `privacy/index.html` | The privacy page, at kipwell.co/privacy/ |
| `404.html` | Shown for any address that doesn't exist |
| `assets/css/site.css` | All styling. Brand colors are at the top. |
| `assets/js/site.js` | The join form and the fade-in on scroll |
| `assets/js/config.js` | The one setting: where signups are sent |
| `assets/img/` | Photos, product screens and the share image |
| `assets/fonts/` | Besley, Hanken Grotesk and Caveat, self-hosted (SIL Open Font License, in `OFL.txt`) |
| `backend/signups.gs` | Google Apps Script that saves signups to a Google Sheet. Not used by the site directly; paste it into Apps Script. |
| `.nojekyll` | Tells GitHub Pages to serve files as they are |

Links between pages are relative, so the site works both at `kipwell-app.github.io/kipwell-site/` and at `kipwell.co`. The 404 page is the exception: it only looks right on kipwell.co.

## Editing

Edit the file on github.com (pencil icon) or ask Claude to change it, then commit to `main`. GitHub Pages republishes in a minute or two.

To preview on your computer, open `index.html` in a browser. The form needs the site served over http to send, so test the form on the live site.

## Signups

The form sends each signup to a private Google Sheet through a small Google Apps Script. One row per email: signing up again updates the row. A hidden spam-trap field quietly drops bots.

One-time setup, about 10 minutes:
1. In Google Drive, make a new Google Sheet named "Kipwell signups". Use the Google account you want to own the list.
2. In the sheet: Extensions > Apps Script. Delete the starter code, paste in all of `backend/signups.gs`, and save.
3. Deploy > New deployment. Under "Select type", choose Web app. Set "Execute as" to Me and "Who has access" to Anyone. Deploy, then authorize when Google asks. ("Anyone" means anyone can send a signup to it. Only you can open the sheet.)
4. Copy the web app URL, which ends in `/exec`.
5. In `assets/js/config.js`, put the URL between the quotes: `window.KIPWELL_SIGNUP_URL = "https://script.google.com/macros/s/.../exec";` and commit.
6. On the live site, join with kipwell.test@gmail.com. A "Signups" tab appears in the sheet with one row. Join again with the same email in capitals: still one row, with a new Updated time.

Each signup also emails an alert to the address in `ALERT_TO` at the top of `signups.gs` (Reply goes straight to the person who signed up). Set it to `''` to turn alerts off.

If you change `signups.gs` later, use Deploy > Manage deployments > Edit (pencil) > Version: New version. A brand-new deployment gets a new URL, and the form would stop saving until config.js is updated.

Until step 5 is done, the form shows "We couldn't save that. Check your connection and try again."

## Going live on kipwell.co

kipwell.co is registered at Porkbun. GitHub's docs say to verify the domain and add it in GitHub before pointing DNS at it, so nobody else can claim it.

1. Verify the domain: github.com > the Kipwell-App organization > Settings > Pages > Add a domain > `kipwell.co`. GitHub shows a TXT record; add it at Porkbun (DNS for kipwell.co), then click Verify.
2. In this repo: Settings > Pages > Custom domain > `kipwell.co` > Save. (This adds a `CNAME` file to the repo.)
3. At Porkbun, for kipwell.co, delete any existing A, AAAA or ALIAS records on the bare domain (Porkbun's parking page), then add:
   - A records, host blank: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - AAAA records, host blank: `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153`, `2606:50c0:8003::153`
   - CNAME, host `www`, answer `kipwell-app.github.io`
   - Don't add a wildcard (`*`) record.
4. Wait for the DNS check in Settings > Pages to pass (minutes to a few hours), then tick "Enforce HTTPS".
5. Leave the `notify`, `hello` and future `app` records alone. They're separate subdomains and don't affect the site.

This repo is public, as GitHub Pages requires on a free organization. Keep anything private out of it: the signups live in the Google Sheet, never here.
