---
name: DIAMANT product sections
description: Product type assignments for the three existing storefront sections and the compatibility rule for unclassified products.
---

Products belong to exactly one of Stability, Wellness, or Activity; category filters and admin assignment must stay aligned. Legacy products marked “all” belong in Stability, while Wellness and Activity remain empty until assigned. Paid purchases in Wellness or Activity require an active Stability holding; an active admin-assigned Stability holding counts. Historical purchase snapshots remain unchanged.

**Why:** The user confirmed legacy “all” products should move to Stability and that an active Stability product is a prerequisite for buying in the other categories. Purchase snapshots preserve the terms that applied at the time of purchase.

**How to apply:** Normalize legacy “all” or missing catalog types to Stability, require a concrete category for new and edited products, and enforce the active-Stability prerequisite in both the interface and purchase storage logic.