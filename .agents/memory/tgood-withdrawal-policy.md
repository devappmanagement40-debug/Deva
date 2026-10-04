---
name: TGOOD withdrawal policy
description: Withdrawal thresholds, supported payout methods, processing routes, and the no-fee payout rule
---

TGOOD accepts deposits from 18 USDT and withdrawals from 1 USDT. Withdrawals are paid in full: no withdrawal fee is deducted, and a new withdrawal must store the requested amount as both gross and net with zero fees. Users may withdraw through active Mobile Money operators configured for their country or USDT BEP20. Mobile Money is the first and default withdrawal type. Mobile Money wallet options use operator names only, never deposit receiving numbers, and are processed manually; NOWPayments payouts remain USDT BEP20 only.

**Why:** The platform policy was explicitly changed from the older high thresholds and percentage-based deductions; leaving any old fallback or multiple-of-100 rule would make the displayed policy differ from actual behavior. The user requested Mobile Money before USDT BEP20 in the withdrawal type selector. Mobile Money operators are country-configured, while NOWPayments payout support is specific to USDT BEP20.

**How to apply:** Keep the database values, seed/migration defaults, server validation, payout amount, rules, instructions, and withdrawal screens aligned whenever withdrawal behavior changes. Keep Mobile Money selection limited to the active country operator names, and route those requests through manual admin processing.