---
name: Plesk runtime configuration
description: Production public URLs and payment callbacks prefer Plesk variables with a verified repository fallback.
---

The intended public production domain is `https://golddiamant.site`. Production public URLs, including payment callback origins, must prefer Plesk environment variables (`APP_URL`, then `PUBLIC_URL`). Do not change the default callback fallback to the new domain until its `/api/health` endpoint returns JSON `status: ok` and application routes reach Passenger; otherwise payment notifications may hit Plesk's 500 page.

**Why:** The user designated `golddiamant.site` as the domain to use, but its static page currently loads while `/api/health` and SPA routes return a generic Plesk 500; `zoksilll.online` still reaches the Node app. Switching payment callbacks before fixing that host would break confirmations.

**How to apply:** Configure the `golddiamant.site` Plesk Node.js/Passenger application to use the project root and the configured startup file `index.cjs`, then verify `/api/health` and an `/index/...` route. Only then update `DEFAULT_PUBLIC_APP_URL` and Plesk's `APP_URL`/`PUBLIC_URL`; keep HTTPS validation and environment overrides.

Plesk is configured to launch `index.cjs` (the user-confirmed startup file), which loads `dist/index.cjs`; do not diagnose this host as if Passenger launches `app.js`. This entry point must establish production mode and log safe startup diagnostics. Production startup must not run `drizzle-kit push` automatically. Optional startup migrations must log failures without preventing Passenger from listening, so a temporary database problem cannot turn every page and API into a server error.

**Why:** The user explicitly confirmed that Plesk's configured startup file is `index.cjs`; automatic schema changes can fail on production permissions, and an uncaught database migration before `listen()` can crash the entire web process.

**How to apply:** Set Plesk's Application root to the project directory containing `package.json` and the wrapper `index.cjs` (not the `dist` subdirectory, which has no `package.json`); keep the built `dist/index.cjs` and `dist/public` beneath it. Use Node 20+, confirm `SUPABASE_DATABASE_URL` or `DATABASE_URL` is configured in Plesk, and check the startup marker and `PORT` in the Node/Passenger error log. Build the bundle before deployment, keep schema migrations explicit, and guard nonessential startup data migrations with clear error logging.