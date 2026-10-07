---
name: DIAMANT admin configurability
description: Business settings and their customer-facing explanations stay editable in the administration panel
---

For DIAMANT, operational business values and the live customer-facing text that explains them must come from admin-managed settings. Keep initial defaults centralized, seed or migrate them only when missing, and preserve existing admin-configured values during startup. When a setting changes, all affected calculations, previews, FAQs, popups, and instructions must reflect the stored value.

The user scoped admin configurability to operational settings and business content only; do not turn every static interface label into a CMS field.

**Why:** On 2026-10-06 and 2026-10-07, the user reiterated that business values and explanations belong in the admin panel while the rest of the interface can stay static.

**How to apply:** Before adding a business rule or its explanatory copy, verify the admin field, persisted value, server-side behavior, and every live UI surface all use the same setting. Centralize defaults and seed only once or when missing; never overwrite admin edits or resurrect intentionally deleted catalog records. Hardcoded examples in tests are fine; fixed operational values in live UI are not.
