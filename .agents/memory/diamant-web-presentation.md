---
name: DIAMANT web presentation
description: Approved browser presentation and boundaries for PWA changes.
---

Treat DIAMANT as mobile-first: keep its four-item bottom navigation fixed in DIAMANT colors and use a viewport-locked scroll frame across routed screens so page headers remain anchored while content scrolls inside the screen. Preserve the Products page's internal list scroll and other flow-specific scroll areas. Do not re-add the removed red floating chat shortcut or floating wheel shortcut without approval.

**Why:** The user chose the Products page's full-screen layout and internal scrolling behavior for all pages, with stable headers; they also explicitly requested the bottom navigation and removal of the red chat and wheel floaters.

**How to apply:** Keep page scrolling inside the viewport frame, anchor each page's top header, and preserve the member navigation's fixed bottom placement with safe-area support. Keep the Products page header and category tabs stationary while only its product list scrolls. Avoid fixed-background effects, scroll-time card transforms, or heavy backdrop filters on scrolling pages. Retain the support-avatar button and normal links to service and wheel pages. Preserve existing page palettes and payment-flow scroll behavior.

## Account-banner photo sourcing

The DIAMANT profile carousel uses the user's real team photos; do not reintroduce the previously generated 3D diamond posters there unless the user asks. Preserve supplied photos as photographs and keep their original files unchanged.

**Why:** The user explicitly changed the profile-carousel direction to use the real uploaded team images and remove the 3D posters.

**How to apply:** Use optimized copies for the profile carousel, retain the source uploads, and preserve each photo's natural aspect ratio so people or groups are not cropped. Track any separately requested promotional artwork independently from this carousel.