---
name: Global country selection
description: Country selection behavior, default phone country, and monetary display rules.
---

Treat the country picker as global: it must expose worldwide country names and calling codes, while US/+1 remains the default selection for new forms. Product prices and product earnings are entered directly as XOF and displayed as XOF without conversion. Team/referral summaries, member totals, and other visible amount labels throughout the site use XOF without conversion; stored numbers and transaction logic remain unchanged. On the « Moi » profile card only, the raw balance number is labeled FCFA without conversion. Actual deposit, withdrawal, and provider payment flows remain USDT, and real method/network names such as USDT BEP20 must stay accurate.

**Why:** the user requested a worldwide searchable country selector and then specified that the +1 country should be the default. They explicitly require XOF display labels without conversion, including where the actual stored/payment unit remains USDT. They also chose to show the « Moi » balance with an FCFA label only; no conversion rate was supplied.

**How to apply:** use the worldwide country list for selection and registration, default auth forms to US/+1, and show visible monetary amounts with XOF using stored numeric values unchanged. Apply FCFA only to the « Moi » profile display; never change calculations, storage, provider amounts, payment methods, or network identifiers for a display-label request.