---
name: DIAMANT purchase snapshots
description: Preserve purchased product terms and history independently from the current catalog.
---

Every purchase must keep a snapshot of the product definition used for that purchase. Later catalog edits must affect only future purchases. An admin may revoke an active user purchase; first process all full 24-hour periods already elapsed, then stop future accrual while preserving the purchase record and progress, and show it in the completed list. Explore pays only completed daily periods and any accrued-but-unpaid amount once, never unearned future days; Parcours and Offres do not receive an early cycle-end payout on revocation. Removing a catalog product with purchases must preserve the product record and purchase history.

Purchased-product cards on the orders page should reuse the product's admin-selected catalog color, with the same visible tint and border treatment as the catalog card. Color is presentation-only and must not rewrite purchase terms.

For existing purchases without a stored snapshot, use the currently linked catalog values as the baseline. Earlier values cannot be reconstructed unless they were recorded elsewhere.

**Why:** The user requires purchases to retain their original data despite product edits or removal, and later clarified that admins must be able to revoke a purchase and have it appear as completed. The user also wants each order card to visually match its product's selected color. On October 10, 2026, they changed Explore payout timing for active and future purchases to each completed 24-hour period while keeping Parcours and Offres at cycle end.

**How to apply:** Preserve purchase snapshots in history views and earning calculations. Resolve card color from the catalog for presentation and keep the orders card tint consistent with the catalog card. Apply the current category-specific payout cadence from the snapshot. Revoking a purchase changes its active status but does not delete its record or rewrite its progress; first process elapsed full-day earnings, then stop accrual. Catalog removal with purchases archives the catalog row.