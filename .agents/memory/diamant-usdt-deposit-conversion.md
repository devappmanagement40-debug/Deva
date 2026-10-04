---
name: DIAMANT USDT deposit conversion
description: How XOF amounts are paid through USDT BEP20 without changing wallet credits or exposing the rate.
---

USDT BEP20 deposits are requested, stored, and credited in XOF. For NOWPayments, calculate the USDT payment as the requested XOF amount divided by 650 (1 USDT = 650 FCFA/XOF). The deposit page may show the USDT amount the user must send, but must not display the conversion rate or a conversion breakdown. Mobile Money deposits are unchanged. The minimum deposit and explanatory text on the deposit page must follow admin settings, and method guidance must include the active Mobile Money options as well as USDT BEP20.

**Why:** the user specified that crypto payment should be converted from the FCFA amount at 650 per USDT, while the member account still receives the requested FCFA amount and the deposit page hides conversion details. They also require the displayed minimum and guidance to stay aligned with admin-managed settings and the platform's enabled deposit methods.

**How to apply:** convert on the server before creating the NOWPayments request; persist the original XOF amount on the deposit and use it for the once-only balance credit. Compare signed provider IPNs against the quoted USDT amount and currency. Keep payment instructions limited to the amount to send and network. Render the current minimum from admin settings; read admin-managed deposit copy from public settings and derive available methods from the active channel list and supported crypto methods.