---
name: Global USDT currency migration
description: All countries share an admin-configured USDT product catalog; CI/Togo keep XOF Mobile Money deposits that credit USDT, and withdrawals use BEP20.
---

Registration and login offer the complete phone-country catalog with international calling prefixes; valid accounts may use any listed country code. Default new registrations and logins without a saved country to the United States (`US`, +1); retain a saved login country. The user wants every country, including Côte d’Ivoire and Togo, to use USDT and the same admin-configured investment products. CI/Togo Mobile Money deposits remain paid in XOF but credit USDT using the configured XOF/USDT rate. Withdrawals in every country use USDT BEP20 only. The treatment of existing XOF balances is still pending; do not convert them without explicit approval.

**Why:** The user changed from separate CI/Togo XOF and international USDT markets to one global USDT product currency while retaining CI/Togo's local XOF deposit rails.

**How to apply:** Use one investment product catalog and USDT-denominated values across all countries, with the administrator configuring the plans. Keep CI/Togo Mobile Money as a local payment option, convert confirmed XOF deposits to USDT at the configured rate, and allow withdrawals only to USDT BEP20 addresses. Keep country-based eligibility for local payment methods. Preserve historical transaction amounts in their original currency. Do not convert existing XOF balances until the user explicitly chooses a migration rule.

Registration and login use the full authentication phone-country catalog, independent of market activation; do not block sign-up or sign-in by payment-market activation. Do not delete a country while accounts or financial records reference it. Keep historic financial amounts tied to their original currency and snapshots until an explicit conversion/display rule is approved. Payment-method eligibility may still vary by country, but investment products and account currency are global USDT.

**Why:** Country selection still matters for local payment methods, while products and the account currency are global.

**How to apply:** Keep account-country checks for local payment-method availability, but apply USDT units consistently to new balances, rewards, deposits, withdrawals, and the shared product catalog. Never silently convert existing XOF balances or historical records.