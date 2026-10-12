---
name: GitHub push policy
description: The user handles GitHub pushes for this project.
---

Leave verified project changes in the workspace for the user to push.

**Why:** The user said they will perform the push themselves.

**How to apply:** Do not push project changes unless the user explicitly asks again.

If GitHub's integration connection remains `not_added` or a Git push is rejected despite the connection claiming it is active, keep the verified commit locally and ask the user to reconnect GitHub in Replit before retrying. Do not request or expose a personal token.

**Why:** An integration can report that it is already attached while the workspace Git CLI still has no valid GitHub authentication; repeated pushes will not repair that mismatch.

**How to apply:** Check the current integration status after a failed push. Retry only after the GitHub connection is actually available to the workspace.
