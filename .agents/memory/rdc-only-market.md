---
name: Global USDT currency migration
description: All countries share an admin-configured USDT catalog; crypto-only deposits, BEP20 withdrawals, and manual handling of legacy XOF balances.
---

Registration and login offer the complete phone-country catalog with international calling prefixes; valid accounts may use any listed country code. Default new registrations and logins without a saved country to the United States (`US`, +1); retain a saved login country. The user wants every country, including Côte d’Ivoire and Togo, to use USDT and the same admin-configured investment products. Remove Mobile Money deposit methods and the automatic XOF/USDT conversion rate; deposits use crypto USDT only. Withdrawals in every country use USDT BEP20 only. Legacy XOF balances must be handled through admin-entered USDT credits per account, never an automatic rate.

**Why:** The user changed from separate CI/Togo XOF and international USDT markets to one global USDT product and account currency, and later explicitly removed local Mobile Money and the conversion-rate mechanism.

**How to apply:** Use one investment product catalog and USDT-denominated values across all countries, with the administrator configuring the plans. Remove Mobile Money deposit methods and automatic XOF/USDT conversion; accept USDT crypto deposits and allow withdrawals only to USDT BEP20 addresses. On current customer-facing screens, show only records explicitly denominated in USDT; never relabel old amounts as USDT. Preserve original historical amounts for audit and manual migration. Do not change legacy balances until the administrator enters and confirms an exact USDT credit for each account.

Registration and login use the full authentication phone-country catalog, independent of market activation; do not block sign-up or sign-in by payment-market activation. Do not delete a country while accounts or financial records reference it. Keep historic financial amounts tied to their original currency and snapshots. The user wants all currently purchased product positions removed from active portfolios while the catalog remains for manual USDT reconfiguration; close/archive positions and preserve their audit rows rather than hard-deleting financial records.

**Why:** Country selection remains necessary for authentication and historical records, while products and the account currency are global.

**How to apply:** Keep country metadata for account identity, but apply USDT units consistently to new balances, rewards, deposits, withdrawals, and the shared product catalog. Never silently convert or delete legacy balances, purchases, or transaction history.