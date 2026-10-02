---
name: Generated-image transparency
description: Detect and handle generated PNGs with baked checkerboard backgrounds before using them as icons or overlays.
---

An image-generation request for transparency can still produce an opaque PNG with a checkerboard pattern baked into its RGB pixels. A checkerboard in an image preview is not proof that the file has an alpha channel.

**Why:** A faux transparency grid remains visible when the image is composited into an app icon or illustration.

**How to apply:** Inspect the PNG's alpha channel and sample its edge pixels before importing it. If the background is an edge-connected, nearly uniform pattern, create transparency and review the result at its actual display size.