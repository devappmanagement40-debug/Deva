---
name: DIAMANT Togo Mobile Money
description: Togo-specific manual Mobile Money checkout and admin-managed payment instructions.
---

The Togo manual deposit flow has two steps. First collect an eight-digit national phone number with a +228 prefix and require the customer to choose an active operator. Then show that operator’s configured name/logo, recipient label, badge, destination number, account holder, and USSD template. Never guess or hardcode an operator’s USSD instructions. Templates may use `{amount}`, `{number}` for the receiving account, `{phone}` or `{payerPhone}` for the customer, `{currency}`, and `{operator}`.

Do not ask Togo customers for a transaction reference; the completion action submits a pending deposit without one. Keep the Côte d’Ivoire Wave checkout and other country flows separate.

**Why:** The user requested a two-screen Togo-specific flow, administrator control of all operator payment details, and preservation of the existing CI and other-country flows. The reference screen does not request a transaction reference, and guessing a USSD code could send a payment incorrectly.

**How to apply:** Keep Togo-specific presentation, template validation, and no-reference handling scoped to country code `TG`; do not alter CI Wave validation or generic country requirements.
