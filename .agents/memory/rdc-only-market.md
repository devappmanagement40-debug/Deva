---
name: Global country selection
description: Country selection behavior, default phone country, and monetary display rules.
---

Treat the country picker as global: it must expose worldwide country names and calling codes, while US/+1 remains the default selection for new forms. Product prices and product earnings are entered directly as XOF and displayed as XOF without conversion. Deposit, withdrawal, and provider payment flows remain USDT unless explicitly changed.

**Why:** the user requested a worldwide searchable country selector and then specified that the +1 country should be the default. They later explicitly scoped XOF to product prices and gains, with values entered by the administrator and no conversion.

**How to apply:** use the worldwide country list for selection and registration, default auth forms to US/+1, show product prices and gains in XOF using the stored numeric values unchanged, and retain USDT for deposit/withdrawal and provider payment flows.