---
name: DIAMANT admin configurability
description: Business settings and their customer-facing explanations stay editable in the administration panel
---

For DIAMANT, operational business values and the live customer-facing text that explains them must come from admin-managed settings. Keep initial defaults centralized, seed or migrate them only when missing, and preserve existing admin-configured values during startup. When a setting changes, all affected calculations, previews, FAQs, popups, and instructions must reflect the stored value.

The user scoped admin configurability to operational settings and business content only; do not turn every static interface label into a CMS field.

Product and staking catalog rows are database-owned. Preserve existing rows and let the admin panel create, edit, and delete them; startup code must not seed or delete catalog entries.

**Why:** On 2026-10-07, the user explicitly said to keep all current products, make them editable in the admin panel, and not hardcode catalog entries.

**How to apply:** Before adding a business rule or its explanatory copy, verify the admin field, persisted value, server-side behavior, and every live UI surface all use the same setting. Preserve operational settings, existing product rows, and intentional deletions; keep only essential centralized fallback defaults. Hardcoded examples in tests are fine; fixed operational values and catalog entries in startup code are not.
