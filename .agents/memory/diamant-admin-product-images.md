---
name: DIAMANT admin-managed product images
description: Keep catalog product images editable in the administration panel and out of hardcoded source mappings.
---

Catalog images and optional card colors belong to each product record. Administrators must be able to add, replace, and remove product images, choose a distinct card color, or reset to the original appearance; do not map visuals to product IDs or categories in client code. Homepage “Popular Products” must use the same product card as the catalog, including its configured color, image, details, and overall layout.

**Why:** the user explicitly requires product visuals to be editable in administration rather than hardcoded, including a per-product card color with the original appearance as an option, and clarified that homepage popular products must display the same card as the catalog.

**How to apply:** Reuse the shared catalog card component on the homepage and catalog, routing the homepage card action to the catalog. Keep neutral placeholders and original styling when values are unset; ensure uploaded image URLs remain publicly served after production builds.
