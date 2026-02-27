# Commit Validator Skill

## Purpose
Validate commit messages against RULE 8 before user commits. Works with pre-flight-check skill.

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

**Example interaction:**
```
User: "Commit these changes"
Assistant: [Calls commit-validator skill]
Assistant: "Here's a human-like commit message:

Add Axiom logging with free tier protection

Integrated Axiom cloud logging for critical logs. Added quota monitoring with 5,666/day limit.

Ready to commit?"
```

## Integration with Pre-Flight-Check

This skill is part of the validation chain:
```
pre-flight-check (before changes) →
Execute changes →
commit-validator (before commit) →
User commits
```

## Output Format

**PASS:**
```
✅ Commit message validated (RULE 8 compliant)

Suggested message:
Add Axiom logging with free tier protection

Integrated Axiom cloud logging for critical logs. Added quota monitoring with 5,666/day limit.
```

**FAIL:**
```
❌ Commit message violates RULE 8

Issues found:
- Contains emoji (🤖)
- Contains "Generated with Claude Code" footer

Revised message:
Add Axiom logging with free tier protection

Integrated Axiom cloud logging for critical logs. Added quota monitoring with 5,666/day limit.
```
