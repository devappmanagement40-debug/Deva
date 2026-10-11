---
name: Global USDT deposit policy
description: Deposits are crypto USDT only; remove Mobile Money and automatic XOF/USDT conversion while preserving historical records.
---

All countries use USDT for new account activity. The user explicitly wants Mobile Money deposit methods removed and the automatic XOF/USDT conversion rate no longer used. Keep USDT crypto deposits as the deposit method. Do not delete old Mobile Money records or historical XOF transactions; preserve them for audit. Legacy XOF account balances require an exact admin-entered USDT credit per account, with explicit confirmation before applying it. For new deposits, the USDT amount entered is the full amount credited to the member; DIAMANT absorbs NOWPayments processing fees. Quotes for other supported crypto assets must represent that entered USDT value. Disclose that wallet/network gas fees are separate and charged in the network's native asset.

**Why:** the user now wants a site-wide USDT account currency and later superseded the earlier request to keep CI/Togo Mobile Money, explicitly asking to remove Mobile Money and the conversion rate. The user also confirmed that a deposit amount such as 300 USDT must credit 300 USDT, with NOWPayments fees borne by DIAMANT.

**How to apply:** Disable Mobile Money deposits in both UI and server routes; accept deposits in USDT crypto only. Keep legacy Mobile Money deposit records unchanged. Add a protected admin workflow for manual legacy-balance credits; never infer an exchange rate or silently map an XOF amount to USDT. Keep provider fees off the member's payment amount; never promise that wallet network gas is included in the transfer amount.