---
name: DIAMANT spin-wheel rewards
description: Business rules for crediting spin-wheel turns after paid product purchases.
---

The buyer receives one spin for each paid product purchased. The direct referrer receives one spin for each paid product purchased by their referral. Do not award a spin for registration alone.

Wheel prizes are USDT. Credit them to the USDT earnings balance and store the transaction with `currency = USDT`; legacy XOF fields are only for historical records. Preserve prize amounts when normalizing old XOF/FCFA labels.

The public wheel ranking shows each member once, using the cumulative total of that member's visible real spin rewards and sorting from highest total to lowest. Keep phone numbers masked; pinned rewards only break ties, and hidden rewards are excluded from the public total.

**Why:** The user clarified that referral spins come from each paid purchase, rankings aggregate each member's total, and all new account activity uses USDT without converting old values.

**How to apply:** Credit spins only on successful paid purchases, use the direct referrer, and multiply by purchased units. Credit prizes to USDT earnings exactly once; aggregate ranking by member, preserve masked phones, and rank by cumulative USDT prizes.
