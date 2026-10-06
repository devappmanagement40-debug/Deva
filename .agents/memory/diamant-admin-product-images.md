---
name: DIAMANT admin-managed product images
description: Keep catalog product images editable in the administration panel and out of hardcoded source mappings.
---

Catalog images belong to each product record. Administrators must be able to add, replace, and remove a product image in the admin panel; do not map photos to product IDs or categories in client code.

**Why:** the user explicitly requires every product image to be visible and editable in administration, with no hardcoded image assignments.

**How to apply:** Render the stored product image URL in the catalog and admin preview. Keep a neutral placeholder for products with no image; ensure uploaded image URLs remain publicly served after production builds.
