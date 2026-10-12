---
name: Plesk runtime configuration
description: Production public URLs and payment callbacks prefer Plesk variables with a verified repository fallback.
---

The user designated `https://enpaseenergy.cc` as the next public domain. As of 2026-10-12, its HTTPS certificate does not match the hostname, and `/`, `/api/health`, and `/api/auth/countries` return web-server 404 responses instead of reaching the application. Do not change the repository callback fallback or Plesk `APP_URL`/`PUBLIC_URL` until HTTPS is valid and the app routes reach Passenger.

**Why:** Payment providers need a valid HTTPS endpoint that reaches the app; switching callbacks to an unconfigured domain can prevent deposit confirmations.

**How to apply:** The code fallback is `DEFAULT_PUBLIC_APP_URL` in `server/nowpayments.ts`; Plesk `APP_URL` then `PUBLIC_URL` override it and must be changed in Plesk, not by editing repository files. Verify the domain certificate plus `/api/health` JSON status and `/api/auth/countries` before switching callback URLs.

Plesk uses Node 21.7.3 and pnpm. The new-domain panel showed Application root `/enpaseenergy.cc/dist`, document root `/enpaseenergy.cc/dist/public`, and startup `index.cjs`; Plesk reported `/enpaseenergy.cc/dist/index.cjs` missing. The repository has a root `index.cjs` wrapper that loads `dist/index.cjs`, and the compiled bundle is tracked. Prefer Application root `/enpaseenergy.cc` with startup `index.cjs` and document root `/enpaseenergy.cc/dist/public`, after the full project and build output are deployed.

**Why:** The configured `dist` root makes Passenger look for the compiled entry file in the new domain folder, where it is currently absent; the root wrapper is the intended entry when the whole project is present.

**How to apply:** Deploy the full project, run `pnpm run build` from the project root, then set Application root to the project root and startup file to `index.cjs`; keep document root at `dist/public`. If using `dist` as root instead, first verify `dist/index.cjs` exists in that Plesk directory. Keep the pnpm lock synchronized with `package.json`, and verify `/api/health` and `/api/auth/countries` after restart.