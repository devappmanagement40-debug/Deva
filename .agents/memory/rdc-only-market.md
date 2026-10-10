---
name: Market-specific currencies and catalogs
description: Keep CI/Togo's existing XOF flows separate from other countries' USDT catalog and deposit experience.
---

Registration and login offer the complete phone-country catalog with international calling prefixes; valid accounts may use any listed country code. Default new registrations and logins without a saved country to the United States (`US`, +1); retain a saved login country. Côte d’Ivoire and Togo keep their existing XOF plans, deposit flows, and withdrawal configuration. All other countries use a separate admin-managed plan catalog with USDT values and a separate crypto deposit flow; reuse existing product image assets without coupling the two catalogs. International deposits credit only the deposit balance, with no choice of wallet destination. Preserve all historical records and do not convert existing international XOF balances or active purchases without an explicitly approved conversion rule.

**Why:** The user wants global registration, +1 as the default, and two parallel markets: leave Côte d’Ivoire and Togo unchanged while configuring other countries' plans in USDT with the same images. They also chose automatic crypto processing and deposit-balance-only credits for the international deposit page.

**How to apply:** Resolve the account country to the legacy CI/TG market or the international USDT market at every catalog, payment, balance, and purchase boundary. Keep existing CI/TG records and rules untouched. Store international plans separately, reuse image URLs rather than hardcoding visuals, and enforce USDT units in server-side purchase and reward logic. Do not reinterpret old XOF amounts as USDT; wait for an approved migration rule before converting existing international balances or active purchases.

Registration and login use the full authentication phone-country catalog, independent of market activation; do not block sign-up or sign-in by payment-market activation. Do not delete a country while accounts or financial records reference it. Keep all historic financial amounts tied to their original currency and snapshots; do not share mutable prices between the CI/TG and international catalogs. Preserve the current CI/TG Mobile Money and withdrawal configuration. For international users, show only the separate USDT-priced plans and credit new crypto deposits to the deposit balance.

**Why:** Country selection now determines which independent plan and currency experience applies; global authentication and historical data must remain intact.

**How to apply:** Keep account-country market resolution centralized. Preserve CI/TG XOF operations and historical records; international values must be explicitly marked and processed as USDT. Never silently convert XOF balances, rewards, or purchases.