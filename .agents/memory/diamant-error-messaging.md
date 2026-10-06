---
name: DIAMANT withdrawal error messages
description: Customer-facing errors in the withdrawal flow must be specific without disclosing sensitive or technical details.
---

Withdrawal messages should name the user-safe cause, such as an insufficient earnings balance, an incorrect PIN, or a limit being reached. Do not use a generic error title or expose raw server, database, account, or credential details.

**Why:** The user explicitly asked for the withdrawal message title to explain the cause without exposing sensitive information.

**How to apply:** Map recognized failures to clear customer-facing messages. When the cause is unknown, give safe next-step guidance and never display the raw error.
