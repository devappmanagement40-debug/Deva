---
name: DIAMANT admin panel PIN
description: Security and lifecycle rules for the PIN that gates the admin panel.
---

The admin-panel access PIN is separate from the withdrawal security PIN. Store it as a hash, never include it in user/API response objects, and require reauthentication before a self-service change. Initial seed values must not overwrite a PIN that an administrator has changed.

**Why:** These are separate credentials for separate risks; returning or resetting the panel PIN can expose privileged access or silently lock out the administrator.

**How to apply:** Keep panel-PIN verification and rotation separate from withdrawal-PIN flows. Preserve old stored PIN compatibility only for verification and upgrade it to a hash after successful use.
