---
name: DIAMANT withdrawal security PIN
description: Per-account withdrawal PIN verification and administrator-triggered resets.
---

Each DIAMANT account uses its own withdrawal PIN; never use a shared admin PIN. Store only the hash. Users can change an active PIN from their account by verifying the current PIN and confirming a replacement. Administrators may require a reset for one account but must not view or set the replacement PIN; the account holder verifies their login password and chooses it.

**Why:** the user chose a personal PIN with targeted reset and asked for self-service changes from the account, so each account holder controls their PIN.

**How to apply:** verify the PIN on the server before creating a withdrawal. Ordinary changes require the current PIN; a requested reset blocks withdrawals until the user verifies their account password and saves a replacement PIN.