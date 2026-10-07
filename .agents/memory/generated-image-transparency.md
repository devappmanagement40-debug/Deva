---
name: Generated-image transparency
description: Detect and handle generated PNGs with baked checkerboard backgrounds before using them as icons or overlays.
---

An image-generation request for transparency can still produce an opaque PNG with a checkerboard pattern baked into its RGB pixels. A checkerboard in an image preview is not proof that the file has an alpha channel.

**Why:** A faux transparency grid remains visible when the image is composited into an app icon or illustration.

**How to apply:** Inspect the PNG's alpha channel and sample its edge pixels before importing it. If a pattern is baked into RGB, do not color-key metallic or reflective subjects because matching highlights may disappear. If precise background removal is unavailable, regenerate with an intentional solid background and use it as a full image tile; inspect the result at its actual display size.

Reflective gold product photos can blend into dark shadows or other foreground context. Automated masks may leave halos, cut highlights, or retain a hand as part of the subject.

**Why:** A technically transparent PNG can still look unfinished when the mask damages reflective edges or preserves unwanted context.

**How to apply:** Keep the source photo unchanged, inspect cutouts over the product card's actual background at display size, and update the admin-managed product image only when the result is clean. Do not compensate with hardcoded product-to-image mappings.