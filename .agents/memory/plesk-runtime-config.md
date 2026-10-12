---
name: Plesk runtime configuration
description: Public URLs must come from Plesk configuration; never silently route payment callbacks to an old domain.
---

The user designated `https://enpaseenergy.cc` as the public domain and does not want domains hard-coded in application code. Google Safe Browsing and the user's Chrome warning classify both `enpaseenergy.cc` and the previous `golddiamant.site` as unsafe; the public warning does not identify the affected URL or exact cause.

**Why:** Changing domains alone did not clear the warning. A stale public-URL fallback could keep payment callbacks pointed at an unrelated host, but there is no evidence that this alone caused the Safe Browsing classification.

**How to apply:** Set Plesk `APP_URL` (preferred) or `PUBLIC_URL` to the public HTTPS origin. Do not add a hard-coded fallback; payment callbacks should fail explicitly until a valid origin is configured. The exact Safe Browsing issue and affected pages must be taken from Search Console before claiming it is fixed or requesting a review.

Plesk uses Node 21.7.3 and pnpm. The user's panel showed Application root `/enpaseenergy.cc/dist`, document root `/enpaseenergy.cc/dist/public`, and startup file `index.cjs`. The project build generates `dist/index.cjs`, so this layout works only when the compiled file is included in the deployed build. A project-root Application root instead uses the root `index.cjs` wrapper.

**Why:** Plesk resolves the startup file relative to Application root, and the full build output is required when using `dist` as that root.

**How to apply:** Deploy the complete project and build output, verify the configured startup file exists relative to Application root, then check `/api/health` and `/api/auth/countries` after restart. Confirm the health response reports the intended public URL source and database before accepting payments.