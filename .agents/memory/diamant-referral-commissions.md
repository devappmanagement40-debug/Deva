---
name: DIAMANT referral commissions
description: Required default rates and admin-editable referral commission behavior.
---

DIAMANT referral commissions default to 12% for level 1, 3% for level 2, and 2% for level 3. The admin panel must remain the source of truth so all three rates can be changed without code edits. Pay commission on every paid product purchase made by a referred user, not only their first.

**Why:** The user most recently set these rates and requires that they remain editable in the admin panel. Commissions apply to every paid purchase.

**How to apply:** Read the stored settings for commission calculations and user-facing rate displays. Apply the stored rates on each paid purchase, while excluding free products and admin-assigned products. Startup upgrades may change only untouched legacy defaults; preserve administrator-customized rates.