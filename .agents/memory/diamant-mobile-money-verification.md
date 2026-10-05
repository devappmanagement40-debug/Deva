---
name: DIAMANT Mobile Money verification
description: Shared post-submission verification behavior for Mobile Money deposits.
---

After any Mobile Money deposit is submitted, show the shared verification page with the selected operator, amount, and transaction ID. Start a six-minute countdown and display the deposit's actual server status. If it is still pending at timeout, « Réessayer » rechecks the same created deposit and restarts the countdown; never create another deposit just to retry verification. Approval and rejection come only from the server status; approval turns the status icon pure green and stops the countdown. Keep country-specific payment steps unchanged and match the Mobile Money checkout's navy backdrop, white card, orange controls, and blue status-panel styling; do not add CI-only imagery to the shared screen or mention administrator/manual-payment handling in customer copy.

**Why:** The user provided the CI Mobile Money checkout screen as the visual reference for the following verification page and specified that approval turns the icon green and stops the countdown. The verification view is shared across markets, so reuse its visual system without copying country-specific imagery or payment steps. Rechecking the existing deposit avoids duplicate submissions or credits.

**How to apply:** Connect the verification view to the authenticated status endpoint for the deposit returned by the original submission. Poll while pending, refresh the user's balance after approval, and preserve the same deposit identifier when retrying.
