---
name: DIAMANT withdrawal proofs
description: Rules for member-submitted withdrawal proof posts and their displayed sharing bonuses.
---

Approved withdrawal proofs are shown to other members with the submitter's phone number masked. An admin-entered XOF sharing bonus is credited once to the submitter's earnings balance when approval is recorded, and the amount is shown on the published proof.

**Why:** The user clarified that approving a member's shared withdrawal proof can include a bonus credited to that member's account.

**How to apply:** Keep submissions out of the member feed until approved, mask phone numbers in public responses, and credit positive bonuses to `totalEarnings` with a transaction in the same atomic approval. A zero amount adds no credit. Do not backfill older approved proofs without explicit direction because their credit history cannot be inferred safely.