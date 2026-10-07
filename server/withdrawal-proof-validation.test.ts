import assert from "node:assert/strict";
import test from "node:test";
import {
  maskPhoneForWithdrawalProof,
  toPublicWithdrawalProofFeedItem,
  withdrawalProofReviewSchema,
  withdrawalProofSubmissionSchema,
} from "./withdrawal-proof-validation";

test("withdrawal proof submissions accept supported images and trim the message", () => {
  const result = withdrawalProofSubmissionSchema.safeParse({
    message: "  Retrait reçu  ",
    proof: "data:image/png;base64,aGVsbG8=",
  });

  assert.equal(result.success, true);
  if (result.success) assert.equal(result.data.message, "Retrait reçu");
});

test("withdrawal proof submissions accept an optional second screenshot", () => {
  const result = withdrawalProofSubmissionSchema.safeParse({
    message: "Retrait reçu",
    proof: "data:image/png;base64,aGVsbG8=",
    proof2: "data:image/webp;base64,aGVsbG8=",
  });

  assert.equal(result.success, true);
  if (result.success) assert.equal(result.data.proof2, "data:image/webp;base64,aGVsbG8=");
});

test("withdrawal proof submissions reject empty messages and unsupported image types", () => {
  assert.equal(withdrawalProofSubmissionSchema.safeParse({
    message: " ",
    proof: "data:image/png;base64,aGVsbG8=",
  }).success, false);

  assert.equal(withdrawalProofSubmissionSchema.safeParse({
    message: "Preuve de retrait",
    proof: "data:image/svg+xml;base64,PHN2Zz4=",
  }).success, false);

  assert.equal(withdrawalProofSubmissionSchema.safeParse({
    message: "Preuve de retrait",
    proof: "data:image/png;base64,aGVsbG8=",
    proof2: "data:image/svg+xml;base64,PHN2Zz4=",
  }).success, false);

  assert.equal(withdrawalProofSubmissionSchema.safeParse({
    message: "Preuve de retrait",
    proof: "data:image/png;base64,aGVsbG8=",
    proof3: "data:image/png;base64,aGVsbG8=",
  }).success, false);
});

test("review amounts must be non-negative whole XOF values", () => {
  assert.equal(withdrawalProofReviewSchema.safeParse({
    action: "approve",
    shareBonusXof: 500,
    displayAmountXof: 1500,
  }).success, true);
  assert.equal(withdrawalProofReviewSchema.safeParse({
    action: "approve",
    shareBonusXof: 0,
    displayAmountXof: 0,
  }).success, true);
  assert.equal(withdrawalProofReviewSchema.safeParse({
    action: "approve",
    shareBonusXof: 500,
  }).success, false);
  assert.equal(withdrawalProofReviewSchema.safeParse({
    action: "approve",
    shareBonusXof: -1,
    displayAmountXof: 1500,
  }).success, false);
  assert.equal(withdrawalProofReviewSchema.safeParse({
    action: "approve",
    shareBonusXof: 500,
    displayAmountXof: 1.5,
  }).success, false);
  assert.equal(withdrawalProofReviewSchema.safeParse({ action: "reject" }).success, true);
});

test("public proof phone numbers keep a short prefix and suffix only", () => {
  assert.equal(maskPhoneForWithdrawalProof("+2250701234960"), "+225070••••960");
  assert.equal(maskPhoneForWithdrawalProof("07012345"), "070••345");
});

test("public proof feed exposes only its distinct indicative amount, never the credited bonus", () => {
  const item = toPublicWithdrawalProofFeedItem({
    id: 12,
    message: "Retrait reçu",
    shareBonusXof: 500,
    displayAmountXof: 1500,
    createdAt: new Date("2026-10-07T12:00:00.000Z"),
    proofImage2: null,
    user: { phone: "+2250701234960" },
  });

  assert.equal(item.displayAmountXof, 1500);
  assert.equal("shareBonusXof" in item, false);
  assert.equal(item.maskedPhone, "+225070••••960");
  assert.equal(item.imageCount, 1);
});