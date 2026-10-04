---
name: DIAMANT purchase snapshots
description: Preserve purchased product terms and history independently from the current catalog.
---

Every purchase must keep a snapshot of the product definition used for that purchase. Later catalog edits must affect only future purchases. An admin may revoke an active user purchase; first process any full 24-hour periods already elapsed, then stop future accrual while preserving the purchase record and progress, and show it in the completed list. Revocation does not create an early payout for a cycle that has not completed. Removing a catalog product with purchases must preserve the product record and purchase history.

For existing purchases without a stored snapshot, use the currently linked catalog values as the baseline. Earlier values cannot be reconstructed unless they were recorded elsewhere.

**Why:** The user requires purchases to retain their original data despite product edits or removal, and later clarified that admins must be able to revoke a purchase and have it appear as completed. Existing earnings policy credits gains at full-cycle completion, so revocation must not invent an early payout.

**How to apply:** Preserve purchase snapshots in history views and earning calculations. Revoking a purchase changes its active status but does not delete its record or rewrite its progress; no more earnings accrue after revocation. Catalog removal with purchases archives the catalog row.