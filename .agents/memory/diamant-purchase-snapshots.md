---
name: DIAMANT purchase snapshots
description: Preserve purchased product terms and history independently from the current catalog.
---

Every purchase must keep a snapshot of the product definition used for that purchase. Later catalog edits must affect only future purchases. Admin revocation of a recorded purchase is refused; removing a catalog product with purchases must preserve the product record and its purchase history.

For existing purchases without a stored snapshot, use the currently linked catalog values as the baseline. Earlier values cannot be reconstructed unless they were recorded elsewhere.

**Why:** The user requires purchases to retain their original data despite product edits or removal, selected blocking purchase revocation, and chose current linked values as the baseline for older purchases.

**How to apply:** Preserve purchase snapshots in history views, earning calculations, and any purchase-related rules; never let catalog CRUD rewrite or remove an existing purchase.