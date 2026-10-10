---
name: Global USDT deposit policy
description: Deposits are crypto USDT only; remove Mobile Money and automatic XOF/USDT conversion while preserving historical records.
---

All countries use USDT for new account activity. The user explicitly wants Mobile Money deposit methods removed and the automatic XOF/USDT conversion rate no longer used. Keep USDT crypto deposits as the deposit method. Do not delete old Mobile Money records or historical XOF transactions; preserve them for audit. Legacy XOF account balances require an exact admin-entered USDT credit per account, with explicit confirmation before applying it.

**Why:** the user now wants a site-wide USDT account currency and later superseded the earlier request to keep CI/Togo Mobile Money, explicitly asking to remove Mobile Money and the conversion rate.

**How to apply:** Disable Mobile Money deposits in both UI and server routes; accept deposits in USDT crypto only. Keep legacy Mobile Money deposit records unchanged. Add a protected admin workflow for manual legacy-balance credits; never infer an exchange rate or silently map an XOF amount to USDT.