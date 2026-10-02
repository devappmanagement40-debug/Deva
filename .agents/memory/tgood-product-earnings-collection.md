---
name: TGOOD product earnings collection
description: Product earnings accrue into a pending per-product amount and enter the withdrawable ledger only after manual collection.
---

Product earnings must become available after each completed 24-hour cycle without automatically increasing the user's withdrawable balance. The Solde page shows only balance and earnings aggregates, never product cards or an empty-product message; product cards and daily manual collection belong in « Commande ». Users collect pending earnings per product; collection credits `totalEarnings` and creates the earning transaction, while the deposit balance is never used for this payout. In « Commande », show a purchased product as « Actif » only while it is active and has days remaining; expired products belong in « Terminés », and both categories remain in purchase history.

**Why:** The product revenue flow was changed from automatic daily crediting to an explicit collection action, and the user specified that the « Commande » section must separate ongoing products from expired purchases.

**How to apply:** Preserve the pending-versus-collected split, accumulate missed full cycles, make collection idempotent, and keep completed products collectible when they still have pending earnings. Keep product-specific details and collection controls in « Commande »; show only the pending total on Solde. Classify a product as active only when its active flag is true and its remaining days are positive; return completed purchases too.