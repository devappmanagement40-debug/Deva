---
name: DIAMANT production reliability
description: General quality expectation for feature work in DIAMANT.
---

Treat DIAMANT features as production-grade work for a large application. Prioritize reliability, data integrity, and resilience rather than only the visual happy path.

**Why:** The user emphasized that DIAMANT is a large application under development and asked for robust feature work.

**How to apply:** Inspect the complete user and data flow for new features, guard failure and concurrency paths, and preserve existing business rules.

For deposit screens, keep layout positions stable as loading and payment statuses change, and apply the DIAMANT navy, blue, and violet palette consistently.

**Why:** The user asked for polished, stable deposit pages without visual jumping and with consistent colors.

**How to apply:** Reserve space for changing status/action labels, avoid layout-changing button effects, and keep each deposit step responsive without changing payment rules.

For remote PostgreSQL, a cold connection may fail briefly and then recover on a warm request. Set connection timeouts with the hosting proxy's request limit in mind, and make authorization checks return a safe service-unavailable response rather than an uncaught 500 when a database lookup fails.

**Why:** Health checks on 2026-10-09 alternated between database timeout errors and fast successful responses; checking only warm requests would have missed the failure mode.

**How to apply:** When diagnosing Plesk database incidents, compare cold and warm requests through the app's pool and keep recovery time within Passenger/proxy limits.