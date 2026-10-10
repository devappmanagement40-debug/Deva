---
name: Legacy XOF/USDT deposit conversion
description: Historical CI/Togo crypto deposits credited XOF; the new global USDT target requires an explicit migration rule.
---

This documents the legacy CI/Togo deposit behavior: USDT BEP20 deposits were requested and credited in XOF using the admin-managed XOF-per-USDT rate, while Mobile Money also credited XOF. The user's current target is USDT across every country, so this legacy behavior must not be treated as the future policy. Before changing local deposits, confirm whether XOF payment rails remain and at what approved rate confirmed XOF payments credit USDT. Preserve pending quotes and original historical records unless the user explicitly approves their conversion.

**Why:** the prior CI/Togo policy credited XOF from crypto deposits, but the user has since changed the target currency to USDT site-wide; silently carrying forward the old credit behavior would contradict the new request.

**How to apply:** Treat this as historical context until the user confirms the new local-deposit conversion rule. Do not credit XOF deposits as USDT 1:1 or convert them at a guessed rate. Keep original provider amounts and currency in the ledger for auditability and preserve pending deposits.