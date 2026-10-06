---
name: DIAMANT USDT deposit conversion
description: How XOF amounts are paid through USDT BEP20 without changing wallet credits or exposing the rate.
---

USDT BEP20 deposits are requested, stored, and credited in XOF. Calculate each new NOWPayments quote using the admin-managed XOF-per-USDT setting, whose default is 500. The deposit page may show the USDT amount the user must send, but must not display the conversion rate or a conversion breakdown. Mobile Money deposits are unchanged. Existing pending deposit quotes keep their stored amount. The minimum deposit and explanatory text on the deposit page must follow admin settings, and method guidance must include the active Mobile Money options as well as USDT BEP20.

**Why:** the user specified that crypto payment should be converted from the FCFA amount at 500 per USDT, while the member account still receives the requested FCFA amount and the deposit page hides conversion details. They also require business values to remain configurable in the admin panel.

**How to apply:** read the admin-managed rate for new NOWPayments requests, validate it as a positive integer, and use 500 only as the missing-setting default. Do not expose the rate through public settings. Persist the original XOF amount and the provider quote so balance credit and pending-payment checks remain tied to that deposit. Keep payment instructions limited to the amount to send and network. Render the current minimum from admin settings; read admin-managed deposit copy from public settings and derive available methods from the active channel list and supported crypto methods.