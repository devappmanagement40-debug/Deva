---
name: DIAMANT Mobile Money verification
description: Shared post-submission verification behavior for Mobile Money deposits.
---

After any Mobile Money deposit is submitted, show the shared verification page with the selected operator, amount, and transaction ID. Start a six-minute countdown and display the deposit's actual server status. If it is still pending at timeout, « Réessayer » rechecks the same created deposit and restarts the countdown; never create another deposit just to retry verification. Approval and rejection come only from the server status. Keep country-specific payment steps unchanged, use the DIAMANT payment colors, and do not mention administrator or manual-payment handling in customer copy.

**Why:** The user requested a common Mobile Money verification screen based on a supplied structural example, using DIAMANT payment colors. Rechecking the existing deposit avoids duplicate submissions or credits.

**How to apply:** Connect the verification view to the authenticated status endpoint for the deposit returned by the original submission. Poll while pending, refresh the user's balance after approval, and preserve the same deposit identifier when retrying.
