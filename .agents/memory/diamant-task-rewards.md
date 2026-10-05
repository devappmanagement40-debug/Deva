---
name: DIAMANT task rewards
description: Rules for administrator-managed referral reward tiers and claim history.
---

DIAMANT reward tiers are XOF amounts configured by administrators. Administrators can add, edit, reorder, deactivate, or delete tiers; startup seeds the default catalog only once so intentional deletions persist. Eligibility counts distinct direct referrals who are not banned and have an active purchase of a non-free product. Claims credit the configured amount to earnings atomically and save the claim-time tier values. Later edits affect future claims only; a tier with claims must be deactivated rather than hard-deleted. Existing claims without snapshots must not be assigned guessed historical values.

**Why:** The administrator must be able to manage the catalog without startup restoring deleted tiers or edits changing credits users already received.

**How to apply:** Keep tier creation, validation, ordering, eligibility, balance crediting, history display, and deletion safeguards consistent with these rules. Preserve transaction amounts as the ledger source of truth.
