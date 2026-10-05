---
name: DIAMANT transaction receipts
description: Scope, palette, and status rules for DIAMANT deposit and withdrawal receipt cards.
---

**Rule:** Withdrawals use the receipt mockup with solid green for approved/completed, solid red for rejected/failed, and a distinct brand treatment for pending. Deposits use the same receipt structure in DIAMANT violet/blue, showing amount, method, internal deposit ID, date, and status only—not raw provider error details. Keep earnings in their existing layout and preserve all transaction amounts and business logic. A rejected withdrawal must not be labeled as received; show its expected net amount instead.

**Why:** The user initially scoped the supplied mockup to withdrawals, then requested a matching deposit receipt in DIAMANT colors and chose a simple status instead of an error message. Raw provider errors remain intentionally hidden by the API. Status wording must not imply that a rejected payout reached the user.

**How to apply:** Use the withdrawal styling only on withdrawal rows and deposit styling only on deposit rows across history pages and modals. Do not apply either receipt card to earnings history.
