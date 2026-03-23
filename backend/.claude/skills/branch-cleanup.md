# Branch Cleanup Helper

## Purpose
Identify and safely remove stale Git branches to keep repository clean and maintainable. Prevent accumulation of outdated feature branches.

## When to Use
- Monthly maintenance
- Before major releases
- After feature merges
- When repository feels cluttered

## Safety Rules

**NEVER DELETE**:
- main/master branch
- develop branch
- Current branch (checked out)
- Branches with unmerged changes
- Branches modified in last 7 days (configurable)

**ALWAYS CONFIRM**:
- Show branch details before deletion
- Require explicit user confirmation
- Offer dry-run mode

## Task Execution

### 1. List All Branches

```bash
# Local branches
git branch --format='%(refname:short)|%(committerdate:relative)|%(upstream:track)' | column -t -s'|'

# Remote branches
git branch -r --format='%(refname:short)|%(committerdate:relative)' | column -t -s'|'
```

### 2. Identify Merged Branches

```bash
# Branches merged to main
git branch --merged main | grep -v "main\|develop\|\*"

# Branches merged to current branch
git branch --merged | grep -v "\*"
```

### 3. Find Stale Branches

```bash
# Branches with no commits in last 30 days
git for-each-ref --sort=-committerdate refs/heads/ \
  --format='%(refname:short)|%(committerdate:relative)|%(authorname)' | \
  awk -F'|' '$2 ~ /(month|year)/ {print}'
```

### 4. Check Unmerged Changes

```bash
# Branches with unique commits
git branch --no-merged main | grep -v "develop"
```

### 5. Categorize Branches

- **Safe to delete**: Merged + >30 days old
- **Review needed**: Merged but recent (<30 days)
- **Keep**: Unmerged with recent activity
- **Investigate**: Unmerged + >60 days old (forgotten?)

## Example Output

```
🌿 BRANCH CLEANUP ANALYSIS

CURRENT BRANCH: feature/docker-ci ⚠️  (will not delete)
PROTECTED BRANCHES: main, develop

LOCAL BRANCHES (12 total):

✅ SAFE TO DELETE (merged to main, >30 days old):
1. feature/auth-system
   - Last commit: 2 months ago by Carol Bonk
   - Merged to main: Yes (commit 61f7a05)
   - Commits unique to branch: 0
   
2. feature/deployment
   - Last commit: 3 months ago by Carol Bonk
   - Merged to main: Yes (commit 2efbe85)
   - Commits unique to branch: 0
   
3. hotfix/security-patch
   - Last commit: 6 weeks ago by Carol Bonk
   - Merged to main: Yes (commit d18b182)
   - Commits unique to branch: 0

⚠️  REVIEW NEEDED (merged but recent):
4. feature/monitoring
   - Last commit: 5 days ago by Carol Bonk
   - Merged to main: Yes (commit 6d66b66)
   - Note: Recently merged, consider keeping for reference

⭐ KEEP (active development):
5. feature/docker-ci (current)
   - Last commit: 2 hours ago by Carol Bonk
   - Status: In progress

6. feature/premium-features
   - Last commit: 1 week ago by Carol Bonk
   - Unmerged commits: 15
   - Status: Active feature branch

🔍 INVESTIGATE (stale, unmerged):
7. feature/subscription-system
   - Last commit: 4 months ago by Carol Bonk
   - Unmerged commits: 23
   - ⚠️  Long-inactive, has unmerged work - abandoned?

REMOTE BRANCHES:
✅ origin/feature/auth-system - Can delete (already merged)
✅ origin/feature/deployment - Can delete (already merged)

RECOMMENDATIONS:
- Delete 3 safe branches (saves git clutter)
- Keep 4 for recent activity/review
- Investigate 1 stale branch (possibly abandoned)

SAFE DELETE COMMANDS:
git branch -d feature/auth-system
git branch -d feature/deployment
git branch -d hotfix/security-patch

DELETE REMOTE BRANCHES:
git push origin --delete feature/auth-system
git push origin --delete feature/deployment
```

## Interactive Mode

```
Would you like to:
1. Delete all safe branches (3 branches)
2. Delete specific branches (choose interactively)
3. Dry run only (show what would be deleted)
4. Cancel

Your choice [1-4]:
```

## Execution Commands

### Delete Local Branch
```bash
# Safe delete (only if merged)
git branch -d branch-name

# Force delete (even if unmerged) - requires confirmation
git branch -D branch-name
```

### Delete Remote Branch
```bash
git push origin --delete branch-name
```

### Bulk Delete
```bash
# Delete multiple branches
git branch --merged main | grep "feature/" | xargs git branch -d
```

## Safety Checks Before Deletion

For each branch to delete:
```bash
# 1. Check if merged
git branch --merged main | grep -q "^  branch-name$" || echo "NOT MERGED - UNSAFE"

# 2. Check if pushed to remote
git branch -r | grep -q "origin/branch-name" && echo "EXISTS ON REMOTE"

# 3. Check last commit date
git log -1 --format="%cr" branch-name

# 4. Show unique commits
git log main..branch-name --oneline | wc -l
```

## Example Dry Run Output

```
🌿 DRY RUN MODE (no branches will be deleted)

WOULD DELETE:
✓ feature/auth-system (local)
✓ feature/deployment (local)
✓ hotfix/security-patch (local)
✓ origin/feature/auth-system (remote)
✓ origin/feature/deployment (remote)

COMMANDS THAT WOULD RUN:
git branch -d feature/auth-system
git branch -d feature/deployment
git branch -d hotfix/security-patch
git push origin --delete feature/auth-system
git push origin --delete feature/deployment

Total branches to delete: 3 local, 2 remote

Run without --dry-run to actually delete these branches.
```

## Exit Codes
- 0: Cleanup completed successfully
- 1: No branches to clean up
- 2: User cancelled operation
- 3: Error during deletion
