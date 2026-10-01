---
name: DIAMANT web presentation
description: Approved browser presentation and boundaries for PWA changes.
---

Treat DIAMANT as mobile-first: keep its four-item bottom navigation fixed in DIAMANT colors and use a viewport-locked scroll frame across routed screens so page headers remain anchored while content scrolls inside the screen. Preserve the Products page's internal list scroll and other flow-specific scroll areas. Do not re-add the removed red floating chat shortcut or floating wheel shortcut without approval.

**Why:** The user chose the Products page's full-screen layout and internal scrolling behavior for all pages, with stable headers; they also explicitly requested the bottom navigation and removal of the red chat and wheel floaters.

**How to apply:** Keep page scrolling inside the viewport frame, anchor each page's top header, and preserve the member navigation's fixed bottom placement with safe-area support. Keep the Products page header and category tabs stationary while only its product list scrolls. Avoid fixed-background effects, scroll-time card transforms, or heavy backdrop filters on scrolling pages. Retain the support-avatar button and normal links to service and wheel pages. Preserve existing page palettes and payment-flow scroll behavior.

## Account-banner photo sourcing

Use real photos with an explicit free reuse license for the DIAMANT account banner; do not generate images.

**Why:** The user explicitly requested freely reusable diamond photos instead of generated imagery for the account banner.

**How to apply:** Prefer CC0 or public-domain sources, download them locally, and record each source and license.