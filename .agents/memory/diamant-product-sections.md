---
name: DIAMANT product sections
description: Product type assignments for the three existing storefront sections and the compatibility rule for unclassified products.
---

Products can be assigned to Stability, Wellness, or Activity. Keep the storefront sections aligned with the admin product-type selector. Existing products without a deliberate assignment should remain visible in every section until an admin classifies them; newly created products should require a concrete section.

**Why:** Adding category filtering without a safe legacy default would arbitrarily hide existing products or place all of them in a section chosen by the code.

**How to apply:** Preserve the legacy “all sections” behavior when migrating old products, and let admins assign each existing product to a specific section through its edit form.