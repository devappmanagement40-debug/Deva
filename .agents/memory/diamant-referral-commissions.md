---
name: DIAMANT referral commissions
description: Required default rates and admin-editable referral commission behavior.
---

DIAMANT referral commissions default to 30% for level 1, 3% for level 2, and 2% for level 3. The admin panel must remain the source of truth so all three rates can be changed without code edits.

**Why:** The user specified these rates and explicitly required that they not be locked in code.

**How to apply:** Read the stored settings for commission calculations and user-facing rate displays. Startup upgrades may change only untouched legacy defaults; preserve administrator-customized rates.