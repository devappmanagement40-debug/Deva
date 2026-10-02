---
name: DIAMANT web presentation
description: Approved browser presentation and boundaries for PWA changes.
---

Treat DIAMANT as mobile-first: keep its four-item bottom navigation fixed in DIAMANT colors and use a viewport-locked scroll frame across routed screens so page headers remain anchored while content scrolls inside the screen. Preserve the Products page's internal list scroll and other flow-specific scroll areas. Do not re-add the removed red floating chat shortcut. The floating wheel and check-in shortcuts are approved on the home page only.

**Why:** The user chose the Products page's full-screen layout and internal scrolling behavior for all pages, with stable headers; they also explicitly requested the bottom navigation and removal of the red chat and wheel floaters.

**How to apply:** Keep page scrolling inside the viewport frame, anchor each page's top header, and preserve the member navigation's fixed bottom placement with safe-area support. Keep the Products page header and category tabs stationary while only its product list scrolls. Avoid fixed-background effects, scroll-time card transforms, or heavy backdrop filters on scrolling pages. Keep the wheel and check-in floaters on the home page only, alongside the support-avatar button. Preserve existing page palettes and payment-flow scroll behavior.

## Home product carousel and information cards

The homepage carousel is manually curated by admins, with up to four paid products; the order selected in the admin panel is the display order. The homepage keeps the Invitation card, replaces the large Wheel and Check-in cards with floating shortcuts, and shows four information cards. Current information values are registered members, total production, the signed-in user's team members, and team commissions.

**Why:** The user requested manual product selection, four information cards, and floating Wheel/Check-in shortcuts only on the homepage. The four current metrics were chosen from existing APIs because no exact metric labels were specified.

**How to apply:** Reuse the existing `specialProductIds` setting without a schema migration, preserve selection order, and do not infer product popularity from sales. Keep the Wheel and Check-in shortcuts out of other screens. If changing the four metric labels or meaning, confirm the intended metrics with the user first.

## Horizontal navigation palette

Keep the member bottom navigation background at `linear-gradient(110deg, rgba(11, 18, 53, .98), rgba(35, 25, 82, .98))`.

**Why:** The user asked to restore this original horizontal navigation color after a brighter violet/navy treatment was applied.

**How to apply:** Preserve both gradient stops when updating the member bottom navigation; adjust icons or labels separately without changing its background.

## Existing home-card colors

Preserve the prior palettes of existing home cards, including the account/balance panel, quick-action strip, and invitation card. Do not recolor existing cards just to make them match the navigation; style newly introduced cards separately.

**Why:** The user asked to restore the previous colors of existing cards after a broader home-page recoloring.

**How to apply:** When adjusting the navigation or home theme, check existing card surfaces independently and retain their established palettes unless the user asks to change them.

## Account-banner photo sourcing

The DIAMANT profile carousel uses the user's real team photos; do not reintroduce the previously generated 3D diamond posters there unless the user asks. Preserve supplied photos as photographs and keep their original files unchanged.

**Why:** The user explicitly changed the profile-carousel direction to use the real uploaded team images and remove the 3D posters.

**How to apply:** Use optimized copies for the profile carousel, retain the source uploads, and preserve each photo's natural aspect ratio so people or groups are not cropped. Track any separately requested promotional artwork independently from this carousel.

## Profile VIP card

Keep the card's next-level amount tied to the configured price of the next active VIP product; do not hardcode the screenshot's example amount. Keep its white bar as a full decorative line, not a numerical progress claim.

**Why:** The VIP threshold is controlled by the product catalog and can change, while the screenshot's 3000 is only an example of the desired text and style. VIP is based on discrete product levels, so the card has no continuous progress value to show.

**How to apply:** Match the visible copy and visual treatment, but calculate the amount from the next product's configured price and keep the current VIP label dynamic.