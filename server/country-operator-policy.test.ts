import assert from "node:assert/strict";
import test from "node:test";
import {
  parseCountryOperators,
  resolveCountryOperator,
  serializeCountryOperators,
} from "./country-operator-policy";

test("parses, trims, and deduplicates country operator names", () => {
  assert.deepEqual(
    parseCountryOperators('[" Wave ", "Moov", "wave", null, 7]'),
    ["Wave", "Moov"],
  );
});

test("fails closed for invalid country operator configuration", () => {
  assert.deepEqual(parseCountryOperators("not-json"), []);
  assert.deepEqual(parseCountryOperators('{"name":"Wave"}'), []);
});

test("resolves an operator case-insensitively to its configured display name", () => {
  const operators = '["Wave", "Togocel", "Moov"]';
  assert.equal(resolveCountryOperator(operators, "mOoV"), "Moov");
  assert.equal(resolveCountryOperator(operators, "Orange"), undefined);
});

test("serializes country operators from admin arrays or JSON text", () => {
  assert.equal(serializeCountryOperators([" Wave ", "Moov", "wave"]), '["Wave","Moov"]');
  assert.equal(serializeCountryOperators('["Wave","Moov"]'), '["Wave","Moov"]');
  assert.equal(serializeCountryOperators(""), "[]");
  assert.throws(() => serializeCountryOperators("not-json"), /tableau JSON valide/);
  assert.throws(() => serializeCountryOperators({ name: "Wave" }), /doit être un tableau/);
});