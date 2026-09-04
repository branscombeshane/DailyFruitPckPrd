# Daily Fruit — Packing & Production System (v1: Packing)

Same pattern as the procurement app: a single static HTML file hosted on GitHub Pages,
talking to a Google Apps Script Web App backed by a Google Sheet.

This first version covers the **Packing** side end-to-end:

- Live packing board on a touch-screen device, auto-refreshing.
- Orders are timestamped when they come in, and flagged yellow/red the longer they
  sit unassigned (defaults: 10 min / 20 min, editable in Settings).
- A packer taps their name once (pre-set-up in Admin), then taps an order to assign
  it to themselves — that's timestamped too.
- Assigning an order immediately opens the print dialog for a packing slip.
- An Admin area (gear icon, PIN-gated) to import orders from a Sage CSV export,
  manage the list of packers, and tune settings.

Every order shows **all** of its line items, including Production items (e.g.
"Butternut - diced kg") — those are just visually muted since packing doesn't
action them. The same Google Sheet/Apps Script backend already tags each item's
department (`Packing` vs `Production`), so building the Production touch-screen
board next is mostly a second view on the same data — no data model changes needed.

## 1. Google Sheet + Apps Script setup

1. Create a new Google Sheet (e.g. "Daily Fruit - Pack & Prod").
2. Extensions → Apps Script. Delete the starter code and paste in the full
   contents of `apps-script/Code.gs`.
3. In the Apps Script toolbar, select the function **`setupSheets`** and click
   **Run**. Approve the permissions prompt (first run only). This creates the
   `Orders`, `OrderItems`, `Packers`, `Settings` and `ImportLog` tabs with headers
   and sensible defaults for you — you don't need to build the sheet by hand.
4. **Deploy → New deployment → Type: Web app.**
   - Execute as: **Me**
   - Who has access: **Anyone**
   - Click Deploy, authorize again if prompted, and copy the **Web app URL**
     (looks like `https://script.google.com/macros/s/XXXXXXXX/exec`).

Whenever you change `Code.gs` later, go to **Deploy → Manage deployments →
(pencil icon) → New version → Deploy** so the live URL picks up the change —
just saving the script isn't enough.

## 2. Point the app at your Apps Script

Open `index.html` and find, near the top of the `<script>` block:

```js
const APP_CONFIG = {
  API_URL: 'PASTE_YOUR_APPS_SCRIPT_WEB_APP_URL_HERE'
};
```

Paste in the Web app URL from step 1.4.

## 3. Publish to GitHub Pages

1. Create a new GitHub repo (e.g. `daily-fruit-pack`) and push these files
   (`index.html`, `apps-script/Code.gs`, this `README.md`).
2. In the repo: **Settings → Pages → Deploy from a branch → main / (root)**.
3. GitHub gives you a URL like `https://<you>.github.io/daily-fruit-pack/`.
   If you want a subdomain like `pack.dailyfruit.co.za` (matching
   `procure.dailyfruit.co.za`), add a `CNAME` DNS record pointing at
   `<you>.github.io` and a `CNAME` file in the repo containing just the
   subdomain — happy to set that up once you tell me the domain provider.
4. Open the published URL on the packing floor touch-screen device and pin it
   (Chrome "Add to Home screen" / kiosk mode works well for an always-on board).

## 4. Set up your packers

Open the app → tap the ⚙ gear icon (top right) → enter the Admin PIN
(default **1234** — change it under the Settings tab immediately) → **Packers**
tab → add each packer's name. They'll appear as tap tiles on the login screen.
Toggle a packer off instead of deleting them if they might come back later —
deleting rows from the sheet directly also works.

## 5. Import your first orders

Because the live Sage push isn't wired up yet, use **Admin → Import orders**:

1. In Sage, export your order/invoice list to CSV.
2. Either upload the file or paste its contents into the text box, then hit
   **Import**.
3. Rows are grouped into one order per order/invoice number. Orders that were
   already imported (same order number) are automatically skipped, so you can
   re-export and re-paste safely without creating duplicates.

The importer auto-detects common Sage column headings (Order/Invoice number,
Customer, Code, Description, Category, Qty, Unit — case-insensitive, several
synonyms accepted for each). **You mentioned production items sit in a
"Prepped" category in Sage** — that's set as the default in
`Admin → Settings → "Sage categories that mean Production"`. Add more category
names there (comma-separated) if other categories should also count as
Production.

Once you send over a real Sage export, I'll tighten the column mapping to match
it exactly and we can wire up the CSV export as a real automated push instead of
a manual paste.

### Sample CSV shape (for testing before you have a real export)

```csv
Order,Customer,Code,Description,Category,Qty,Unit
SO-1001,ABC Foods,BUT001,Butternut - kg,Fresh,20,kg
SO-1001,ABC Foods,BUT002,Butternut - diced kg,Prepped,10,kg
SO-1002,Green Grocer,ONI001,Onion - kg,Fresh,15,kg
```

A ready-to-use copy of this is in `sample-orders.csv` in this repo.

## How the flagging works

- **Created timestamp**: set the moment an order is imported into the sheet
  (this will become "the moment Sage pushes it" once that's wired up).
- **Assigned timestamp**: set the moment a packer taps "Assign to me".
- An unassigned order turns **yellow** once it's been sitting for the
  "warning" minutes (default 10) and **red** (with a pulsing highlight) past
  the "critical" minutes (default 20). Both are editable in Admin → Settings.
- Once assigned, an order moves to the "In progress" section. Once the packing
  slip has actually finished printing (the browser's print dialog closes), it
  moves to "Printed today" so the board doesn't get cluttered — there's no
  separate "mark as packed" step yet; that's a natural next addition once
  you're ready to build on this.

## What's intentionally *not* built yet (next steps)

- The live Sage → order push (replacing the manual CSV import).
- A separate Production touch-screen board (same data, different screen/users
  — the backend already tags every item `Packing` or `Production` so this is
  additive, not a rework).
- A "mark as packed / complete" step to close out an order after printing.
- Any accounting for reprints or reassigning an order to a different packer.

## Files

- `index.html` — the entire front end (packing board, admin, print slip).
  Single file, no build step, just edit and re-push to GitHub.
- `apps-script/Code.gs` — the entire backend. Paste into Apps Script as-is.
- `sample-orders.csv` — a few test rows to import so you can see the board
  working before you export anything real from Sage.
