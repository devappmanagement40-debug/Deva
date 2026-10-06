---
name: DIAMANT admin-managed product images
description: Keep catalog product images editable in the administration panel and out of hardcoded source mappings.
---

Catalog images and optional card colors belong to each product record. Administrators must be able to add, replace, and remove product images, choose a distinct card color, or reset to the original appearance; do not map visuals to product IDs or categories in client code. Homepage “Popular Products” cards must reflect each product’s configured color while keeping their existing layout.

**Why:** the user explicitly requires product visuals to be editable in administration rather than hardcoded, including a per-product card color with the original appearance as an option, and clarified that homepage popular-product cards should match their product’s chosen color.

**How to apply:** Render stored image URLs and optional card colors in the catalog, admin preview, and homepage popular-products cards. Keep neutral placeholders and original styling when values are unset; ensure uploaded image URLs remain publicly served after production builds.
