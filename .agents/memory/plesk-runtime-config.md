---
name: Plesk runtime configuration
description: Production public URLs and payment callbacks prefer Plesk variables with a verified repository fallback.
---

The user designated `https://enpaseenergy.cc` as the next public domain. As of 2026-10-12, its HTTPS certificate does not match the hostname, and `/`, `/api/health`, and `/api/auth/countries` return web-server 404 responses instead of reaching the application. Do not change the repository callback fallback or Plesk `APP_URL`/`PUBLIC_URL` until HTTPS is valid and the app routes reach Passenger.

**Why:** Payment providers need a valid HTTPS endpoint that reaches the app; switching callbacks to an unconfigured domain can prevent deposit confirmations.

**How to apply:** The code fallback is `DEFAULT_PUBLIC_APP_URL` in `server/nowpayments.ts`; Plesk `APP_URL` then `PUBLIC_URL` override it and must be changed in Plesk, not by editing repository files. Verify the domain certificate plus `/api/health` JSON status and `/api/auth/countries` before switching callback URLs.

Plesk previously used Node 21.7.3 with pnpm and startup file `index.cjs`; the user reported the old site's Application root was its `dist` directory and document root was `dist/public`. Confirm the new domain's actual Plesk roots before assuming they are unchanged. With `dist` as root, Passenger runs the compiled `dist/index.cjs`; the root-level `index.cjs` wrapper is bypassed. The repo has both npm and pnpm lockfiles, so runtime dependencies used by the server must be in the selected pnpm lock and available from the deployed bundle or an ancestor `node_modules`.

**Why:** Plesk roots and the startup file must match the deployed build; guessing a new root can prevent Passenger from launching the app.

**How to apply:** Keep Plesk's selected package manager lockfile synchronized with `package.json`. For direct `dist` startup, bundle newly imported pure-JavaScript server dependencies that Plesk may not have installed; check external imports in `dist/index.cjs`. Keep schema migrations explicit, guard nonessential data migrations, and use Node/Passenger startup logs when `/api` returns Plesk HTML instead of JSON.