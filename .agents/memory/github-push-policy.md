---
name: GitHub push policy
description: Keep verified project changes synchronized to the connected GitHub repository.
---

Push all project code changes, including future modifications, to the connected GitHub repository after verifying them.

**Why:** The user explicitly asked for all project code and future changes to be pushed.

**How to apply:** After completing and verifying each project change, push it to the connected repository.

If GitHub's integration connection remains `not_added` or a Git push is rejected despite the connection claiming it is active, keep the verified commit locally and ask the user to reconnect GitHub in Replit before retrying. Do not request or expose a personal token.

**Why:** An integration can report that it is already attached while the workspace Git CLI still has no valid GitHub authentication; repeated pushes will not repair that mismatch.

**How to apply:** Check the current integration status after a failed push. Retry only after the GitHub connection is actually available to the workspace.
