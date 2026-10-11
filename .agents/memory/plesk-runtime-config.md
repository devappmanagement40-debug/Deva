---
name: Plesk runtime configuration
description: Production public URLs and payment callbacks prefer Plesk variables with a verified repository fallback.
---

The intended public production domain is `https://golddiamant.site`. Production public URLs, including payment callback origins, must prefer Plesk environment variables (`APP_URL`, then `PUBLIC_URL`). Do not change the default callback fallback to the new domain until its `/api/health` endpoint returns JSON `status: ok` and application routes reach Passenger; otherwise payment notifications may hit Plesk's 500 page.

**Why:** The user designated `golddiamant.site` as the domain to use, but its static page currently loads while `/api/health` and SPA routes return a generic Plesk 500; `zoksilll.online` still reaches the Node app. Switching payment callbacks before fixing that host would break confirmations.

**How to apply:** Treat the Plesk Application root and startup file as a pair: project-root plus root `index.cjs` invokes the wrapper, while `dist` plus `index.cjs` invokes the compiled server bundle. The user reports the latter layout (`dist` root, `dist/public` document root, `index.cjs` startup) worked previously; do not change it without startup-log evidence. Verify `/api/health` and `/api/auth/countries` after deployment before changing callback URLs.

Plesk uses Node 21.7.3 with pnpm and, per the user, has previously worked with Application root `/golddiamant.site/dist`, document root `/golddiamant.site/dist/public`, production mode, and startup file `index.cjs`. With that root, Passenger runs the compiled `dist/index.cjs`; the root-level `index.cjs` wrapper is bypassed. The repo has both npm and pnpm lockfiles, so runtime dependencies used by the server must be in the selected pnpm lock and available from the deployed bundle or an ancestor `node_modules`.

**Why:** The user says this Plesk configuration worked before. Changing its root based only on the word `dist` can break a valid compiled-bundle deployment; a stale pnpm lock or externalized runtime import can instead crash Passenger before any API route is reached.

**How to apply:** Keep Plesk's selected package manager lockfile synchronized with `package.json`. For direct `dist` startup, bundle newly imported pure-JavaScript server dependencies that Plesk may not have installed; check external imports in `dist/index.cjs`. Keep schema migrations explicit, guard nonessential data migrations, and use Node/Passenger startup logs when `/api` returns Plesk HTML instead of JSON.