---
name: Plesk runtime configuration
description: Production public URLs and payment callbacks prefer Plesk variables with a verified repository fallback.
---

The intended public production domain is `https://golddiamant.site`. Production public URLs, including payment callback origins, must prefer Plesk environment variables (`APP_URL`, then `PUBLIC_URL`). Do not change the default callback fallback to the new domain until its `/api/health` endpoint returns JSON `status: ok` and application routes reach Passenger; otherwise payment notifications may hit Plesk's 500 page.

**Why:** The user designated `golddiamant.site` as the domain to use, but its static page currently loads while `/api/health` and SPA routes return a generic Plesk 500; `zoksilll.online` still reaches the Node app. Switching payment callbacks before fixing that host would break confirmations.

**How to apply:** Configure the `golddiamant.site` Plesk Node.js/Passenger application to use the project root and `app.js`, then verify `/api/health` and an `/index/...` route. Only then update `DEFAULT_PUBLIC_APP_URL` and Plesk's `APP_URL`/`PUBLIC_URL`; keep HTTPS validation and environment overrides.