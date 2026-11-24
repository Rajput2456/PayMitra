# PayMitra

A local-first demo for tracking shared expenses with friends and groups. The UI uses original PayMitra branding and sample data; it is not affiliated with Splitwise.

## Open it on Windows

Run PayMitra Locally on Windows

Prerequisites

- Install "Node.js" (https://nodejs.org/) (Node.js 20.19+ or 22.12+).
- npm is included with Node.js.

Setup and Run

1. Clone or download this repository.

2. Open Command Prompt or VS Code terminal in the project folder.

3. Install dependencies:
   
   npm install

4. Start the development server:
   
   npm run dev

5. Open the local URL displayed in your terminal, usually:
   
   http://localhost:5173/

Keep the terminal running while using PayMitra. Press "Ctrl + C" to stop the development server.

Build for Production

To create a production build:

npm run build

To preview the production build locally:

npm run preview 


## What is included

- Responsive overview, friends, groups, expense ledger, settle up, insights, trip planner, and settings.
- Add friends and groups, invite/remove group members, edit/delete expenses, and search/filter the ledger.
- Expense splits: equal with remainder pennies, exact paise amounts, and percentages with largest remainder allocation.
- Balance and debt simplification calculated from the expense ledger and simulated settlement history.
- Record settlements locally; no bank connection or money transfer.
- Monthly/group budgets, demo trip planning, and manual bill item entry. No OCR or bill upload is performed.
- Demo data persists in this browser's localStorage. Settings can reset the demo.

## Test

`npm run test:e2e` runs the Chromium Playwright suite. The config uses installed Chrome at `C:/Program Files/Google/Chrome/Application/chrome.exe` by default; set `CHROME_PATH` if Chrome is elsewhere. Six scenarios cover navigation/search, local persistence, friend and group creation, expense split modes, settlement recording, manual bill entry, and mobile layout.

## Scope and privacy

REA's publicly accessible Splitwise pages and help material were used as product research. Authenticated Splitwise account workflows were not accessed. PayMitra has no backend, login, cloud sync, real payment processing, OCR, or external API calls. All app state remains in this browser's localStorage. See [REA analysis](./REA-analysis.md) for source findings and access limits.
