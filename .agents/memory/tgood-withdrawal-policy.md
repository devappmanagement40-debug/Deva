---
name: DIAMANT withdrawal policy
description: Withdrawal fee calculations, gross-to-net accounting, and supported payout methods
---

Withdrawals use the earnings balance only and the current minimum is 1,200 XOF. The amount entered is the gross debit; the configured percentage fee is withheld from it before payout. The current fee is 12%: a 10,000 XOF request debits 10,000, retains 1,200 in fees, and pays 8,800. Round fees to the nearest whole XOF for consistency across the form and payout. A rejected or failed request refunds the gross amount once. Users may withdraw through active Mobile Money operators configured for their country or USDT BEP20. Côte d’Ivoire uses Wave; Togo uses TMoney and Moov. These withdrawal options are separate from deposit channels and receiving numbers. Mobile Money wallet options use operator names only and are processed manually; NOWPayments payouts remain USDT BEP20 only.

**Why:** On 2026-10-06, the user set the current minimum withdrawal to 1,200 XOF and explicitly replaced the previous no-fee rule with a 12% fee withheld from the amount entered. Keeping gross debit, stored fee, displayed net payout, and payout-provider amount aligned prevents overcharging or paying the wrong amount. Mobile Money operators are country-configured, while NOWPayments payout support is specific to USDT BEP20.

**How to apply:** Keep the admin setting, server calculation, one-time gross balance debit, displayed fees and net amount, receipts, withdrawal instructions, and payout amount aligned. Never debit both gross and fees separately. Keep country-configured withdrawal operators separate from deposit channels and receiving numbers; route Mobile Money requests through manual admin processing.