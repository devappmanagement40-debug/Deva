import assert from "node:assert/strict";
import test from "node:test";
import {
  maskPhoneForWithdrawalProof,
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

test("withdrawal proof submissions reject empty messages and unsupported image types", () => {
  assert.equal(withdrawalProofSubmissionSchema.safeParse({
    message: " ",
    proof: "data:image/png;base64,aGVsbG8=",
  }).success, false);

  assert.equal(withdrawalProofSubmissionSchema.safeParse({
    message: "Preuve de retrait",
    proof: "data:image/svg+xml;base64,PHN2Zz4=",
  }).success, false);
});

test("review amounts must be non-negative whole XOF values", () => {
  assert.equal(withdrawalProofReviewSchema.safeParse({ action: "approve", shareBonusXof: 1200 }).success, true);
  assert.equal(withdrawalProofReviewSchema.safeParse({ action: "approve", shareBonusXof: 0 }).success, true);
  assert.equal(withdrawalProofReviewSchema.safeParse({ action: "approve", shareBonusXof: -1 }).success, false);
  assert.equal(withdrawalProofReviewSchema.safeParse({ action: "approve", shareBonusXof: 1.5 }).success, false);
  assert.equal(withdrawalProofReviewSchema.safeParse({ action: "reject" }).success, true);
});

test("public proof phone numbers keep a short prefix and suffix only", () => {
  assert.equal(maskPhoneForWithdrawalProof("+2250701234960"), "+225070••••960");
  assert.equal(maskPhoneForWithdrawalProof("07012345"), "070••345");
});