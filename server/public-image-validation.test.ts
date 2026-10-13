import assert from "node:assert/strict";
import test from "node:test";
import { getSafeRasterImageExtension } from "./public-image-validation";

test("accepts supported raster image signatures that match their MIME type", () => {
  assert.equal(
    getSafeRasterImageExtension(
      "image/png",
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    ),
    ".png",
  );
  assert.equal(
    getSafeRasterImageExtension("image/jpeg", Buffer.from([0xff, 0xd8, 0xff])),
    ".jpg",
  );
  assert.equal(
    getSafeRasterImageExtension("image/gif", Buffer.from("GIF89a")),
    ".gif",
  );
  assert.equal(
    getSafeRasterImageExtension(
      "image/webp",
      Buffer.from("RIFF0000WEBP"),
    ),
    ".webp",
  );
});

test("rejects SVG, unknown image MIME types, and MIME/signature mismatches", () => {
  assert.equal(
    getSafeRasterImageExtension(
      "image/svg+xml",
      Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'),
    ),
    null,
  );
  assert.equal(
    getSafeRasterImageExtension("image/png", Buffer.from("<html>not an image</html>")),
    null,
  );
  assert.equal(
    getSafeRasterImageExtension("image/jpeg", Buffer.from("GIF89a")),
    null,
  );
});
