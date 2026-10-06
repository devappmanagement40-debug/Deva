---
name: DIAMANT referral commissions
description: Required default rates and admin-editable referral commission behavior.
---

DIAMANT referral commissions default to 30% for level 1, 3% for level 2, and 2% for level 3. The admin panel must remain the source of truth so all three rates can be changed without code edits. Pay commission on every paid product purchase made by a referred user, not only their first.

**Why:** The user specified these rates and explicitly required that they not be locked in code. The user later confirmed commissions should apply to every paid purchase.

**How to apply:** Read the stored settings for commission calculations and user-facing rate displays. Apply the stored rates on each paid purchase, while excluding free products and admin-assigned products. Startup upgrades may change only untouched legacy defaults; preserve administrator-customized rates.