---
name: DIAMANT withdrawal policy
description: Withdrawal fee calculations, gross-to-net accounting, and supported payout methods
---

Withdrawals use the earnings balance only and the current minimum is 1,200 XOF. The amount entered is the gross debit; the configured percentage fee is withheld from it before payout. The current fee is 3%: a 10,000 XOF request debits 10,000, retains 300 in fees, and pays 9,700. Round fees to the nearest whole XOF for consistency across the form and payout. A rejected or failed request refunds the gross amount once. Users may withdraw through active Mobile Money operators configured for their country or USDT BEP20. Côte d’Ivoire uses Wave; Togo uses TMoney and Moov. These withdrawal options are separate from deposit channels and receiving numbers. Mobile Money wallet options use operator names only and are processed manually; NOWPayments payouts remain USDT BEP20 only.

**Why:** The user set the withdrawal minimum to 1,200 XOF and most recently changed the fee to 3% withheld from the amount entered. Keeping gross debit, stored fee, displayed net payout, and payout-provider amount aligned prevents overcharging or paying the wrong amount. Mobile Money operators are country-configured, while NOWPayments payout support is specific to USDT BEP20.

**How to apply:** Keep the admin setting, server calculation, one-time gross balance debit, displayed fees and net amount, receipts, withdrawal instructions, and payout amount aligned. Never debit both gross and fees separately. Keep country-configured withdrawal operators separate from deposit channels and receiving numbers; route Mobile Money requests through manual admin processing.