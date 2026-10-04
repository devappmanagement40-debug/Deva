---
name: DIAMANT web presentation
description: Approved browser presentation and boundaries for PWA changes.
---

Treat DIAMANT as mobile-first: keep its four-item bottom navigation fixed in DIAMANT colors and use a viewport-locked scroll frame across routed screens so page headers remain anchored while content scrolls inside the screen. Preserve the Products page's internal list scroll and other flow-specific scroll areas. Do not re-add the removed red floating chat shortcut. The floating wheel and check-in shortcuts are approved on the home page only.

**Why:** The user chose the Products page's full-screen layout and internal scrolling behavior for all pages, with stable headers; they also explicitly requested the bottom navigation and removal of the red chat and wheel floaters.

**How to apply:** Keep page scrolling inside the viewport frame, anchor each page's top header, and preserve the member navigation's fixed bottom placement with safe-area support. Keep the Products page header and category tabs stationary while only its product list scrolls. Avoid fixed-background effects, scroll-time card transforms, or heavy backdrop filters on scrolling pages. Keep the wheel and check-in floaters on the home page only, alongside the support-avatar button. Preserve existing page palettes and payment-flow scroll behavior.

## Home product carousel and information cards

The homepage uses horizontal product cards followed by vertically stacked Information article cards with an image, title, and excerpt. Admin-selected paid products appear in selection order, up to four; when no selection exists, show up to four active paid products by sort order. Popular-product cards open the Products page directly; do not show a “View all” link. Display all popular-product numeric text, including the return-percentage badge, in violet. Do not show the “Invite Friends” promotional card at the bottom; Wheel and Check-in remain floating shortcuts on the homepage only.

**Why:** The user clarified with a screenshot that “Information” means article previews, asked for popular products to be visible in the carousel, requested removal of the Invitation card, then specified that popular products open the Products page, the “View all” link be removed, and green metric text be violet. They also pointed out excessive blank space between the last Information card and the fixed bottom navigation.

**How to apply:** Reuse the existing admin product setting and keep its order; use catalog order only as the empty-selection default, never sales-based guesses. Keep product-card clicks directed to `/products`, use violet for green metric text, and omit the “View all” control. Reuse localized DIAMANT article content and images for Information cards rather than inventing external company news or returning to homepage statistics. Keep the Invitation card out of the home layout. Leave only a small safe-area-aware scroll gap between the last Information card and the fixed bottom navigation; avoid a large blank reserve on the homepage.

## Horizontal navigation palette

Keep the member bottom navigation background at `linear-gradient(110deg, rgba(11, 18, 53, .98), rgba(35, 25, 82, .98))`.

**Why:** The user asked to restore this original horizontal navigation color after a brighter violet/navy treatment was applied.

**How to apply:** Preserve both gradient stops when updating the member bottom navigation; adjust icons or labels separately without changing its background.

## Existing home-card colors

Preserve the prior palettes of existing home cards, including the account/balance panel and quick-action strip. The homepage popular-product and Information cards use the same blue-purple-red gradient as the VIP progression card.

**Why:** The user asked to restore the previous colors of existing cards after a broader home-page recoloring, then specified the VIP progression card as the color reference for the new homepage cards.

**How to apply:** Keep existing account/action card colors unchanged; use `linear-gradient(108deg, #16437e 0%, #5e3658 50%, #b92a2e 100%)` for the popular-product and Information card backgrounds.

## Account-banner photo sourcing

The DIAMANT account banner uses the four mining photographs supplied by the user. Do not restore the former profile/team photos there. Preserve the supplied photos and display their full natural aspect ratios without cropping.

**Why:** The user asked to replace the former banner images with the four supplied mining photos and remove the old images from the banner code.

**How to apply:** Keep the four supplied mining photos in the account banner, preserve their aspect ratios, and do not reintroduce the previous team-photo imports or carousel entries.

## Profile VIP card

Keep the card's next-level amount tied to the configured price of the next active VIP product; do not hardcode the screenshot's example amount. Keep its white bar as a full decorative line, not a numerical progress claim.

**Why:** The VIP threshold is controlled by the product catalog and can change, while the screenshot's 3000 is only an example of the desired text and style. VIP is based on discrete product levels, so the card has no continuous progress value to show.

**How to apply:** Match the visible copy and visual treatment, but calculate the amount from the next product's configured price and keep the current VIP label dynamic.