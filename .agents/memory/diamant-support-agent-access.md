---
name: DIAMANT support-agent access
description: The account model and privilege boundary for member accounts appointed to answer support conversations.
---

Support agents are existing member accounts with a separate support-only role. They may view and answer support conversations, including their attachments, but must not gain access to other administrator tools. The ordinary member account remains available; the support inbox is a separate, limited workspace. Admins continue using the existing full support inbox.

**Why:** The user chose to appoint existing members and explicitly limited these people to replying to user messages, not to the full administrator panel.

**How to apply:** Grant or revoke the support flag from an administrator's member-management view. Keep every non-support admin API guarded by the admin role. A support-agent role must not overlap with administrator or banker privileges; clear it when promoting a member to either of those roles.
