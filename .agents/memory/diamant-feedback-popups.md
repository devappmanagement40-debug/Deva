---
name: DIAMANT feedback popups
description: App-wide scope for popup-style feedback messages.
---

Use popup-style messages on every DIAMANT page, including sign-in, registration, deposit, and proof pages. Keep the existing notification behavior on the spin wheel and daily check-in pages.

**Why:** the user explicitly set this app-wide exception.

**How to apply:** route all other toast notifications through the shared popup and preserve the current wheel and check-in notification UI unless the user changes this rule.