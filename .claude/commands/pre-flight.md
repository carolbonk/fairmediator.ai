# Pre-Flight Command

Run pre-commit checks and create a validated commit message.

## Steps

1. Run `git status` to see current changes
2. Run `git diff` to review staged and unstaged changes
3. Invoke the `commit-validator` skill to draft a RULE 8 compliant commit message
4. Present commit message to user for approval
5. If approved, stage all relevant files and create the commit
6. Run `git status` after commit to verify

## Important

- Commit message MUST follow RULE 8 (max 3 sentences, no emojis, imperative mood)
- Do NOT include "Generated with Claude Code" footer
- Do NOT include "Co-Authored-By: Claude" footer
- Stage only relevant files (exclude test files, temp files if appropriate)
