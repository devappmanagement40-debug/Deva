---
name: DIAMANT product sections
description: Product type assignments for the three existing storefront sections and the compatibility rule for unclassified products.
---

Internal product categories remain Stability, Wellness, and Activity, while their French storefront labels are Explore, Parcours, and Offres respectively. Products belong to exactly one category; legacy products marked “all” belong in Stability. Buying Parcours or Offres requires at least one active Explore (Stability) holding, including an active admin-assigned holding. Historical purchase snapshots remain unchanged. The FAQ explanations for all three labels and the access rule must be editable in the admin content panel.

**Why:** The user confirmed legacy “all” products should move to Stability, selected Explore/Parcours/Offres as the French storefront labels, and asked for the product ranges and access rule to be explained in the FAQ. Purchase snapshots preserve the terms that applied at the time of purchase.

**How to apply:** Keep internal category values and purchase logic unchanged when changing French display labels. Normalize legacy “all” or missing catalog types to Stability, require a concrete category for new and edited products, make FAQ text admin-editable, and enforce the active-Explore prerequisite in both the interface and purchase storage logic.