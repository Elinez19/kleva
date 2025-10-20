# 🌿 Kleva Backend - Git Workflow Guide

## 📋 Branch Structure

- **`main`** - Production-ready code (protected)
- **`development`** - Integration branch for features (protected)
- **`feature/*`** - Feature development branches
- **`bugfix/*`** - Bug fix branches
- **`hotfix/*`** - Urgent production fixes

## 🚀 Daily Development Workflow

### Starting a New Feature

```bash
# 1. Update development branch
git checkout development
git pull origin development

# 2. Create your feature branch
git checkout -b feature/your-feature-name

# Example:
# git checkout -b feature/add-payment-gateway
# git checkout -b feature/update-user-profile
```

### Daily Work on Feature

```bash
# Start of day - Sync with development
git checkout development
git pull origin development
git checkout feature/your-feature-name
git merge development

# Make your changes...

# Commit your work
git add .
git commit -m "feat: add detailed description of your changes"
git push origin feature/your-feature-name
```

## 🔄 Handling Conflicts

### When Merge Shows Conflicts

```bash
# 1. Check which files have conflicts
git status

# 2. Open conflicting files and look for markers:
#    <<<<<<< HEAD
#    your changes
#    =======
#    incoming changes
#    >>>>>>> development

# 3. After resolving all conflicts
git add .
git commit -m "fix: resolved conflicts with development branch"
git push origin feature/your-feature-name
```

## 🚨 Commit Message Format

Use these prefixes for clear commit history:

```bash
feat: add new feature
fix: bug fix
docs: documentation updates
style: styling changes (CSS, formatting)
refactor: code refactoring
test: adding tests
chore: maintenance tasks
perf: performance improvements
```

### Examples:
```bash
git commit -m "feat: add Paystack webhook integration"
git commit -m "fix: resolve email verification token expiry issue"
git commit -m "docs: update API documentation with new endpoints"
git commit -m "style: improve profile page layout"
git commit -m "refactor: optimize session management logic"
```

## 📝 Pull Request Process

### Before Creating PR

```bash
# 1. Make sure your feature branch is up to date
git checkout development
git pull origin development
git checkout feature/your-feature-name
git merge development

# 2. Resolve any conflicts
# 3. Run tests (if available)
npm test

# 4. Push your changes
git push origin feature/your-feature-name
```

### Creating the PR

1. Go to GitHub repository
2. Click "Pull Requests" → "New Pull Request"
3. Base: `development` ← Compare: `feature/your-feature-name`
4. Fill in PR template:
   - **Title**: Clear description of changes
   - **Description**: What, why, and how
   - **Screenshots**: If UI changes
   - **Testing**: How you tested
5. Request review from team lead
6. Address review comments
7. Wait for approval and merge

## 🚫 Common Issues & Solutions

### 1. Accidentally Committed to Wrong Branch

```bash
# Save your changes
git stash

# Switch to correct branch
git checkout correct-branch

# Apply your changes
git stash pop
```

### 2. Need to Discard All Local Changes

```bash
# Discard all uncommitted changes
git checkout -- .

# Or reset to last commit
git reset --hard HEAD
```

### 3. Bad Merge - Need to Undo

```bash
# Undo last merge (use carefully!)
git reset --hard HEAD~1
```

### 4. Need to Update PR After Review Comments

```bash
# Make the requested changes
# Then commit and push
git add .
git commit -m "fix: address PR review comments"
git push origin feature/your-feature-name
```

### 5. Feature Branch is Too Old

```bash
# If your branch is significantly behind development
git checkout development
git pull origin development
git checkout feature/your-feature-name
git rebase development

# If conflicts occur, resolve them
# Then continue
git rebase --continue

# Force push (only for your feature branch!)
git push -f origin feature/your-feature-name
```

## 🔐 Protected Branch Rules

### ⚠️ NEVER PUSH DIRECTLY TO:
- ❌ `main` branch
- ❌ `development` branch

### ✅ ALWAYS:
- Create feature branches
- Make Pull Requests
- Get code review
- Let team lead merge

## 📊 Branch Naming Conventions

### Features
```bash
feature/add-payment-integration
feature/implement-2fa
feature/update-user-dashboard
```

### Bug Fixes
```bash
bugfix/fix-login-error
bugfix/resolve-email-delivery
bugfix/correct-payment-calculation
```

### Hotfixes
```bash
hotfix/critical-security-patch
hotfix/payment-gateway-down
hotfix/database-connection-issue
```

## 🎯 Quick Command Reference

```bash
# Check current branch and status
git status

# List all branches
git branch -a

# Switch branches
git checkout branch-name

# Create and switch to new branch
git checkout -b feature/new-feature

# Pull latest changes
git pull origin development

# Push your changes
git push origin feature/your-branch

# View commit history
git log --oneline -10

# See what changed
git diff

# Stash changes temporarily
git stash
git stash pop

# Discard changes to a file
git checkout -- filename

# Delete local branch
git branch -d feature/old-feature

# Delete remote branch
git push origin --delete feature/old-feature
```

## 📞 Need Help?

If you're stuck:
1. Check this guide first
2. Ask team lead
3. Don't force push to shared branches
4. When in doubt, create a backup branch first:
   ```bash
   git checkout -b backup-branch-name
   ```

---

**Remember**: 
- Commit often
- Write clear messages  
- Test before pushing
- Keep PRs focused and small
- Communicate with your team

