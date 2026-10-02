import assert from "node:assert/strict";
import test from "node:test";
import { supportChatEditMessageSchema, supportChatMessageSchema } from "./support-chat-validation";

test("accepts the private URL returned by a support-chat image upload", () => {
  const result = supportChatMessageSchema.safeParse({
    message: "",
    attachmentUrl: `/api/support-chat/files/support-${"a".repeat(32)}.png`,
    attachmentType: "image",
    attachmentName: "preuve.png",
  });

  assert.equal(result.success, true);
});

test("rejects public upload paths and malformed support-chat attachment URLs", () => {
  for (const attachmentUrl of [
    "/uploads/proof.png",
    "/api/support-chat/files/support-not-a-generated-name.png",
    "https://example.com/proof.png",
  ]) {
    const result = supportChatMessageSchema.safeParse({
      message: "",
      attachmentUrl,
      attachmentType: "image",
    });
    assert.equal(result.success, false, `${attachmentUrl} should be rejected`);
  }
});

test("requires edited support-chat messages to contain visible text", () => {
  assert.equal(supportChatEditMessageSchema.safeParse({ message: "  Réponse corrigée  " }).success, true);
  assert.equal(supportChatEditMessageSchema.safeParse({ message: "   " }).success, false);
});