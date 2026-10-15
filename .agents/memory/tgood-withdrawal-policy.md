---
name: DIAMANT withdrawal policy
description: Withdrawal fee calculations, gross-to-net accounting, and supported payout methods
---

Withdrawals use the earnings balance only and the current minimum is 0.50 USDT. Withdrawals are sent only in USDT over BEP20. The admin manually sends the net amount externally, then confirms the withdrawal; NOWPayments is required only in semi-automatic mode. The amount entered is the gross debit; the configured 3% fee is withheld from it before payout, so a 10 USDT request debits 10, retains 0.30 in fees, and pays 9.70. A rejected or failed request refunds the gross amount once. The minimum and fee remain admin-configurable.

**Why:** The user set the site-wide minimum withdrawal to 0.50 USDT, specified USDT BEP20 only, and confirmed that withdrawals must be validated manually by the admin. Keeping gross debit, stored fee, displayed net payout, and the actual external transfer aligned prevents overcharging or approving an unsent payment.

**How to apply:** Require NOWPayments credentials only for semi-automatic payouts. In manual mode, keep the withdrawal request pending until an admin sends the displayed net USDT over BEP20, then allow manual confirmation. Keep the admin setting, server validation, popup/rules text, one-time gross balance debit, displayed fees and net amount, receipts, and refund behavior aligned. Render fractional USDT values without truncating cents. Never debit both gross and fees separately.