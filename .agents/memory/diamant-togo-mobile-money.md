---
name: DIAMANT Togo Mobile Money
description: Togo-specific manual Mobile Money checkout and admin-managed payment instructions.
---

The Togo manual deposit flow has two steps. First collect an eight-digit national phone number with a +228 prefix and require the customer to choose an active operator. Then show that operator’s configured name/logo, recipient label, badge, destination number, account holder, and USSD template. Never guess or hardcode an operator’s USSD instructions. Templates may use `{amount}`, `{number}` for the receiving account, `{phone}` or `{payerPhone}` for the customer, `{currency}`, and `{operator}`.

Require the Togo customer’s transaction ID on the second instruction screen, below the payer phone/edit area, before submission. Store it as the deposit reference and keep the deposit pending. Keep the Côte d’Ivoire Wave checkout and other country flows separate.

**Why:** The user requested a required transaction ID after payment so the pending deposit can be identified, while retaining the admin-managed Togo instructions and the existing CI and other-country flows. Guessing a USSD code could send a payment incorrectly.

**How to apply:** Keep the transaction-ID field and server validation scoped to country code `TG`; do not alter CI Wave validation or other-country requirements.
