---
name: TGOOD customer service hours
description: Customer-support availability is derived from the configured service-hour window.
---

The customer-service screen uses the configured start and end hours to show the current online/offline state and refreshes it every minute. Show the online state on pure green and the offline state on pure red. Configured support links remain clickable even when the displayed status is offline.

**Why:** The owner requires the support buttons to keep working outside service hours while still showing the configured offline status.

**How to apply:** Keep the displayed hours and online/offline calculation driven by the same settings. Preserve overnight-window handling, but do not gate configured support-link activation on that status. Keep the status colors pure green online and pure red offline.