---
name: DIAMANT web presentation
description: Approved browser presentation and boundaries for PWA changes.
---

Treat the DIAMANT member experience as mobile-first: keep its four-item bottom navigation fixed in DIAMANT colors and prioritize stable touch scrolling. Do not re-add the removed red floating chat shortcut or floating wheel shortcut without approval.

**Why:** The user describes DIAMANT as a large mobile application in development and wants the product list to remain steady while scrolling; they also explicitly requested the bottom navigation and removal of the red chat and wheel floaters.

**How to apply:** Keep the member navigation fixed to the bottom edge with safe-area support. Prefer one natural document scroll and avoid fixed-background effects, scroll-time card transforms, or heavy backdrop filters on scrolling pages. Retain the support-avatar button and normal links to service and wheel pages. Do not convert the web implementation to native/PWA or expand the app shell elsewhere without separate approval.