---
name: Supabase account migration
description: User-confirmed source and target for preserving account records while moving the project to Supabase.
---

The user confirmed the existing Replit PostgreSQL database (`DATABASE_URL`) as the legacy source and the newly supplied Supabase database (`SUPABASE_DATABASE_URL`) as the database to use going forward. Keep the legacy source unchanged during account-data transfers. The user later confirmed that an administrator password reset in the Replit-configured Supabase immediately restored sign-in on the Plesk-hosted site; treat those as the same current account database unless a future mismatch suggests otherwise.

The requested account migration includes account-linked records and the reference data needed to interpret them. Global platform settings, raw webhook logs, company content, and active sessions are separate; do not assume they have been migrated. In particular, platform settings may contain payment-provider secrets and should not be copied without an explicit, separately scoped request.

**Why:** The user wants to continue on Supabase without losing existing accounts, balances, purchases, and history, while avoiding accidental transfer of unrelated settings or payment secrets. Successful Plesk sign-in after a Supabase password reset confirms that account changes in the configured Supabase are visible to the live site.

**How to apply:** Keep future account transfers non-destructive and source-preserving. For Plesk account/login issues, first check the Replit-configured Supabase account data; if changes stop appearing on Plesk, verify both environments still target the same Supabase project before making another write. If the user requests a complete application-state migration, scope global settings and credentials separately and move secrets only through the approved secrets flow.