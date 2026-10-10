---
name: Global USDT deposit crediting
description: CI/Togo Mobile Money accepts XOF but credits USDT using the configured XOF/USDT rate; preserve original payment history.
---

CI/Togo Mobile Money deposits remain paid in XOF, but confirmed payments must credit the account in USDT using the configured XOF-per-USDT rate. The admin-configured rate is the source of truth; do not display or use a hardcoded rate. All countries share the global USDT account currency. Preserve pending quotes and historical ledger entries in their original currency.

**Why:** the user now wants a site-wide USDT account currency while explicitly keeping CI/Togo Mobile Money payments in XOF.

**How to apply:** For confirmed CI/Togo Mobile Money payments, convert the credited account amount using the current configured XOF/USDT rate; never credit XOF as though it were USDT 1:1. Store the original paid XOF amount and the resulting USDT credit so the ledger remains auditable. Preserve pending deposits. Existing XOF balances require a separate user-approved conversion decision.