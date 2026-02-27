# Commit Validator Skill

## Purpose
Validate commit messages against RULE 8 before user commits. Works with pre-flight command.

## When to Use
Call this skill when user is ready to commit changes and needs a commit message.

## Validation Rules (RULE 8)

### Requirements
- ✅ Maximum 3 sentences
- ✅ No emojis (❌ 🤖 ✨ 🎉 📝 etc.)
- ✅ No decorations or icons
- ✅ No "Generated with Claude Code" footer
- ✅ No "Co-Authored-By: Claude" footer
- ✅ Imperative mood ("Add feature" not "Added feature")
- ✅ Write like a human engineer

### Good Examples
```
Add Axiom logging with quota monitoring
Fix authentication bug in password reset flow
Refactor API service for better error handling
Update Docker build context for monorepo
```

### Bad Examples
```
✨ Add amazing new feature 🎉
🤖 Generated with Claude Code
Add Axiom logging integration

Integrated centralized logging with quota protection.

Co-Authored-By: Claude <noreply@anthropic.com>
```

## Usage Pattern

**When user requests commit:**
1. Draft commit message (max 3 sentences, imperative mood)
2. Validate against RULE 8 checklist
3. If valid → Present to user
4. If invalid → Revise and re-validate

## Task

Analyze the current git changes and create a valid RULE 8 compliant commit message.
