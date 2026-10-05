---
name: DIAMANT transaction receipts
description: Scope, palette, and status rules for DIAMANT deposit and withdrawal receipt cards.
---

**Rule:** Both deposit and withdrawal receipts use pure green (`#00ff00`) for approved/completed status badges and pure red (`#ff0000`) for rejected/failed badges; use black text on these bright colors and white text on violet pending badges. Deposits use the DIAMANT violet/blue receipt structure, showing amount, method, internal deposit ID, date, and status only—not raw provider error details. Keep the amount in a normal field row rather than an oversized feature block. Use white field text on a dark navy body so it remains legible. Keep earnings in their existing layout and preserve all transaction amounts and business logic. A rejected withdrawal must not be labeled as received; show its expected net amount instead.

**Why:** The user initially scoped the supplied mockup to withdrawals, then requested a matching deposit receipt in DIAMANT colors and chose a simple status instead of an error message. They selected a normal amount row, then asked for white field text, so the receipt body needs a dark background. They specified pure green for approved and pure red for rejected status mentions. Black text keeps both pure-color badges legible. Raw provider errors remain intentionally hidden by the API. Status wording must not imply that a rejected payout reached the user.

**How to apply:** Use the withdrawal styling only on withdrawal rows and deposit styling only on deposit rows across history pages and modals. Do not apply either receipt card to earnings history.
