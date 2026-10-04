---
name: TGOOD earnings ledger
description: Business rule for separating the deposit balance from the withdrawable earnings balance.
---

User gains must credit `totalEarnings`, including product earnings, referral commissions, daily check-in rewards, task rewards, gift-code rewards, and spin rewards. The signup bonus is the explicit exception: it credits `balance` so it can be used as starting deposit credit. Withdrawals use `totalEarnings` only.

**Why:** The user requires the revenue balance to include operational rewards while keeping the signup bonus available as starting deposit credit; small check-in rewards were previously invisible when credited or displayed through the deposit-balance path.

**How to apply:** New reward or gain transactions should update `totalEarnings` and refresh the authenticated user state after success. Keep the signup bonus on `balance`; do not treat it as withdrawable earnings.