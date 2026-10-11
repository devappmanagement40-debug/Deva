---
name: TGOOD earnings ledger
description: Business rule for separating the deposit balance from the withdrawable earnings balance.
---

All new account activity is USDT. Deposits credit `balanceUsdt`; product earnings, referral commissions, daily check-in rewards, task rewards, gift-code rewards, spin prizes, and other gains credit `totalEarningsUsdt`. Keep legacy `balance` and `totalEarnings` for historical XOF records only. Withdrawals use the earnings balance.

**Why:** The user requires one USDT-only experience across all countries and does not want old XOF values automatically converted. New rewards must therefore use the USDT ledger fields, not the retained legacy fields.

**How to apply:** Write new USDT rewards to `totalEarningsUsdt`, write new deposits to `balanceUsdt`, and record the currency explicitly. Refresh authenticated user state after success. Never route new rewards into legacy XOF balances.

The profile keeps a single “Mon solde” amount that combines the deposit balance and earnings balance, without a separate breakdown. This is display-only; withdrawal eligibility remains earnings-only.

**Why:** The user wants the existing profile presentation preserved while its one displayed amount includes both balances.

**How to apply:** Combine the values only for the profile display. Do not change purchase, withdrawal, or ledger rules.