---
name: TGOOD earnings ledger
description: Business rule for separating the deposit balance from the withdrawable earnings balance.
---

User gains must credit `totalEarnings`, including product earnings, referral commissions, daily check-in rewards, task rewards, gift-code rewards, and spin rewards. The signup bonus is the explicit exception: it credits `balance` so it can be used as starting deposit credit. Withdrawals use `totalEarnings` only.

**Why:** The user requires the revenue balance to include operational rewards while keeping the signup bonus available as starting deposit credit; small check-in rewards were previously invisible when credited or displayed through the deposit-balance path.

**How to apply:** New reward or gain transactions should update `totalEarnings` and refresh the authenticated user state after success. Keep the signup bonus on `balance`; do not treat it as withdrawable earnings.

On the profile, show the deposit balance and withdrawable earnings as two separate amounts; do not calculate or display a combined total.

**Why:** The user clarified that the existing profile balance area should show both amounts separately, not add them into a new total.

**How to apply:** Keep the profile display separate from transaction rules; withdrawal eligibility and payouts continue to use only the earnings balance.