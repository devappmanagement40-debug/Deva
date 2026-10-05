---
name: DIAMANT transaction receipts
description: Status-color and transaction-truth rules for receipt-style history cards.
---

**Rule:** Use solid green for approved or completed receipts, solid red for rejected or failed receipts, and a distinct neutral brand treatment for pending states. Preserve transaction amounts and business logic. A rejected withdrawal must not be labeled as received; show its expected net amount instead.

**Why:** The user requested clear green/red receipt statuses without changing transaction values or behavior. Status wording must not imply that a rejected payout reached the user.

**How to apply:** Keep the same visual and data-integrity rules across deposit, withdrawal, and earnings history views, including any shared history modal.
