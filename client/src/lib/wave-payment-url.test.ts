import assert from "node:assert/strict";
import test from "node:test";
import { wavePaymentUrlForAmount } from "./wave-payment-url";

const WAVE_LINK = "https://pay.wave.com/m/M_ci_example/c/ci/";

test("adds the selected XOF amount to a Wave payment link", () => {
  assert.equal(
    wavePaymentUrlForAmount(WAVE_LINK, 3500),
    `${WAVE_LINK}?amount=3500`,
  );
});

test("replaces a configured amount and preserves other query values", () => {
  assert.equal(
    wavePaymentUrlForAmount(`${WAVE_LINK}?lang=fr&amount=2000#pay`, 7500),
    `${WAVE_LINK}?lang=fr&amount=7500#pay`,
  );
});

test("does not add the amount to unrelated payment URLs", () => {
  assert.equal(
    wavePaymentUrlForAmount("https://payments.example/merchant", 3500),
    "https://payments.example/merchant",
  );
  assert.equal(
    wavePaymentUrlForAmount("https://pay.wave.com.example/m/merchant", 3500),
    "https://pay.wave.com.example/m/merchant",
  );
});

test("rejects unsupported URLs and invalid amounts for Wave links", () => {
  assert.equal(wavePaymentUrlForAmount("javascript:alert(1)", 3500), null);
  assert.equal(wavePaymentUrlForAmount(WAVE_LINK, 0), null);
  assert.equal(wavePaymentUrlForAmount(WAVE_LINK, 12.5), null);
  assert.equal(wavePaymentUrlForAmount(WAVE_LINK, Number.NaN), null);
});
