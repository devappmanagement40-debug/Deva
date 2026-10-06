---
name: DIAMANT admin configurability
description: Business settings and their customer-facing explanations stay editable in the administration panel
---

For DIAMANT, operational business values and the live customer-facing text that explains them must come from admin-managed settings. Keep initial defaults centralized, seed or migrate them only when missing, and preserve existing admin-configured values during startup. When a setting changes, all affected calculations, previews, FAQs, popups, and instructions must reflect the stored value.

**Why:** On 2026-10-06, the user reiterated that settings must remain configurable in the admin panel and not be hardcoded.

**How to apply:** Before adding a business rule or its explanatory copy, verify the admin field, persisted value, server-side behavior, and every live UI surface all use the same setting. Hardcoded examples in tests are fine; fixed operational values in live UI are not.
