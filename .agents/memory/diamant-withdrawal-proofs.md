---
name: DIAMANT withdrawal proofs
description: Rules for member-submitted withdrawal proof posts and their displayed sharing bonuses.
---

Approved withdrawal proofs are shown to other members with the submitter's phone number masked. The admin-entered XOF sharing bonus is real earnings credit, applied once on approval, and must not be exposed in the public feed. A separate admin-entered display amount may appear only as “Montant indicatif (non crédité)” and must never affect balances or ledger entries.

**Why:** The user wants the public amount to be configurable independently from the actual bonus credited, while making clear that the displayed amount is not credited.

**How to apply:** Keep submissions out of the member feed until approved, mask phone numbers in public responses, return only the separate indicative amount to the feed, and credit positive bonuses to `totalEarnings` with a transaction in the same atomic approval. A zero amount adds no credit. Existing proofs default to no public indicative amount; do not infer one from their past credits.