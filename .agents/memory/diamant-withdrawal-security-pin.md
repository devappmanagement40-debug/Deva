---
name: DIAMANT withdrawal security PIN
description: Per-account withdrawal PIN verification and administrator-triggered resets.
---

Each DIAMANT account uses its own withdrawal PIN; never use a shared admin PIN. Store only the hash. Administrators may require a reset for one account but must not view or set the replacement PIN. The account holder verifies their login password and chooses the new PIN.

**Why:** the user chose a personal PIN with targeted reset so each account holder controls their own replacement.

**How to apply:** verify the PIN on the server before creating a withdrawal. A requested reset must block withdrawals until the user verifies their account password and saves a replacement PIN.