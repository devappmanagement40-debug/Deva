import test from "node:test";
import assert from "node:assert/strict";
import { errorMessageFromResponse } from "./queryClient";

const htmlError = `<!DOCTYPE html><html lang="en"><head><title>500 Internal Server Error</title></head><body>Internal Server Error</body></html>`;

test("hides a proxy HTML error page even when it claims to be JSON", () => {
  const message = errorMessageFromResponse(
    htmlError,
    "application/json",
    500,
    "Internal Server Error",
  );

  assert.equal(
    message,
    "Le serveur a renvoyé une erreur (500). Réessayez dans quelques instants.",
  );
  assert.equal(message.includes("<html"), false);
});

test("hides HTML error pages when the proxy omits its content type", () => {
  assert.equal(
    errorMessageFromResponse(htmlError, "", 500),
    "Le serveur a renvoyé une erreur (500). Réessayez dans quelques instants.",
  );
});

test("keeps useful JSON API validation messages", () => {
  assert.equal(
    errorMessageFromResponse(
      JSON.stringify({ message: "Vous devez atteindre le niveau VIP 2." }),
      "application/json",
      400,
    ),
    "Vous devez atteindre le niveau VIP 2.",
  );
});
