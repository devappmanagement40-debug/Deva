---
name: DIAMANT withdrawal policy
description: Withdrawal fee calculations, gross-to-net accounting, and supported payout methods
---

Withdrawals use the earnings balance only and the current minimum is 0.50 USDT. Withdrawals are sent only in USDT over BEP20. The amount entered is the gross debit; the configured 3% fee is withheld from it before payout, so a 10 USDT request debits 10, retains 0.30 in fees, and pays 9.70. A rejected or failed request refunds the gross amount once. The minimum and fee remain admin-configurable.

**Why:** The user set the site-wide minimum withdrawal to 0.50 USDT and specified USDT BEP20 withdrawals only. Keeping gross debit, stored fee, displayed net payout, and payout-provider amount aligned prevents overcharging or paying the wrong amount.

**How to apply:** Keep the admin setting, server validation, popup/rules text, one-time gross balance debit, displayed fees and net amount, receipts, withdrawal instructions, and payout amount aligned. Render fractional USDT values without truncating cents. Never debit both gross and fees separately.