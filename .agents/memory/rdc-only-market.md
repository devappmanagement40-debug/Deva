---
name: Global country selection
description: Country selection behavior, default phone country, and monetary display rules.
---

Treat the country picker as global: it must expose worldwide country names and calling codes, while US/+1 remains the default selection for new forms. Product prices and product earnings are entered directly as XOF and displayed as XOF without conversion. Team/referral monetary summaries and member-level totals are also displayed directly as XOF without conversion. Deposit, withdrawal, and provider payment flows remain USDT unless explicitly changed.

**Why:** the user requested a worldwide searchable country selector and then specified that the +1 country should be the default. They explicitly require product prices/gains and team/referral amounts to use XOF directly, without an exchange conversion.

**How to apply:** use the worldwide country list for selection and registration, default auth forms to US/+1, and show product and team/referral amounts in XOF using stored numeric values unchanged. Keep provider-specific deposit/withdrawal payment units separate unless the user requests a payment-flow migration.