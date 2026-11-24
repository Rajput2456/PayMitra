# Splitwise public-surface analysis

**Inspected:** 24 November 2026  
**Method:** REA MCP Playwright scenarios in Chromium 157.0.8103.80; empty browser profile; desktop and mobile viewports; `en-IN` locale and `Asia/Kolkata` timezone. No credentials, account data, or payment information were supplied.

## REA verification

REA successfully launched Chromium, loaded `https://example.com/`, and captured its accessibility tree. It also loaded Splitwise’s public homepage and captured page evidence. A public rent fairness calculator was exercised with demo values ($1,800, two bedrooms, default room factors); it returned $900 per room.

## What was directly observable

- The homepage has a two-column desktop hero and a vertically stacked mobile layout. It uses a pale geometric background, a large faceted illustration, teal and charcoal feature sections, and prominent Log in / Sign up actions.
- Public Login, Sign up, and password reset screens are reachable. Login asks for email/password or Google sign-in; signup begins with a name field or Google signup; reset asks for email or phone. No forms were submitted.
- Public marketing pages describe balances, groups, expenses, settlements, and Pro. Public calculators and product pages for Pro, Splitwise Pay, and Splitwise Card are accessible.
- The signed-in expense dashboard and its live controls were not accessible without authentication.

## Workflows described in the public Help Center

These are documentation findings, not direct observations of the authenticated application.

- Groups can be created from the web account menu and populated through group settings. Friends can be invited by email/phone; a web group can also include a name-only placeholder. Non-group expenses are supported.
- Expense entry includes description, amount, payer, and date. Documented splits include equal, exact amount, percentage, shares, adjustment, reimbursement, and itemized. Receipt scanning/itemization and saved defaults are Pro features. [Split options](https://kb.splitwise.com/balances-and-expenses/what-are-different-ways-i-can-split-an-expense)
- The dashboard summarizes total owed/owed-to and per-friend balances. The Totals screen is a spending report, not current balance. Its net change is paid amount minus personal share plus payments made minus payments received. Simplify Debts can reduce payment paths without changing net balances. [Dashboard balances](https://kb.splitwise.com/balances-and-expenses/can-you-help-me-understand-my-dashboard-balances-on-the-web-app) · [Simplify Debts](https://kb.splitwise.com/balances-and-expenses/what-is-simplify-debts)
- Settle Up can record an external payment or start a supported payment method. The help page describes Splitwise Pay and Venmo/PayPal in the US, Pay by Bank in selected European countries, and recording an off-app payment elsewhere. Splitwise Pay is US-resident/USD only and subject to eligibility and verification. [Settlement options](https://kb.splitwise.com/payment-integrations/how-do-i-send-money-to-someone-on-splitwise) · [Splitwise Pay](https://www.splitwise.com/pay)
- The Help Center describes expense search, currency conversion, receipt scanning, charts, default splits, and unlimited expenses as Pro benefits; it says free accounts can add up to four expenses daily. Public pages reviewed did not show current subscription prices. [Pro details](https://kb.splitwise.com/pro/what-is-splitwise-pro)

## Limits and implications for PayMitra

No login, group, friend, expense, balance, search, or real settlement workflow could be exercised in Splitwise itself. PayMitra therefore implements the requested flows independently with demo data and local storage, rather than presenting them as reverse-engineered internals. Payment flows are simulated only. Browser locale/timezone were set to India, but IP location and account-specific regional eligibility were not determined.
