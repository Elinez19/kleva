#!/bin/bash

# 🌿 KLEVA BACKEND - GIT WORKFLOW QUICK COMMANDS
# Copy and paste these commands as needed

echo "==================================="
echo "🌿 Kleva Backend Git Workflow"
echo "==================================="

# ============================================
# 🚀 STARTING A NEW FEATURE
# ============================================
echo ""
echo "📦 Starting a New Feature:"
echo "------------------------"
cat << 'EOF'
git checkout development
git pull origin development
git checkout -b feature/your-feature-name

Example:
git checkout -b feature/add-payment-webhook
EOF

# ============================================
# 📅 DAILY WORKFLOW
# ============================================
echo ""
echo "📅 Daily Workflow:"
echo "------------------------"
cat << 'EOF'
# Update your feature branch with latest development
git checkout development
git pull origin development
git checkout feature/your-feature-name
git merge development

# Work on your changes...
# Then commit
git add .
git commit -m "feat: your descriptive message"
git push origin feature/your-feature-name
EOF

# ============================================
# 🔄 BEFORE CREATING PULL REQUEST
# ============================================
echo ""
echo "🔄 Before Creating Pull Request:"
echo "------------------------"
cat << 'EOF'
git checkout development
git pull origin development
git checkout feature/your-feature-name
git merge development

# Fix any conflicts if they occur
# Test your changes
# Then push
git push origin feature/your-feature-name

# Go to GitHub and create PR: development ← feature/your-branch
EOF

# ============================================
# ⚠️ HANDLING CONFLICTS
# ============================================
echo ""
echo "⚠️ Handling Conflicts:"
echo "------------------------"
cat << 'EOF'
# When you see conflict errors:
git status  # Check which files have conflicts

# Open each file and look for:
# <<<<<<< HEAD
# =======
# >>>>>>> development

# After fixing all conflicts:
git add .
git commit -m "fix: resolved conflicts with development"
git push origin feature/your-feature-name
EOF

# ============================================
# 🚨 EMERGENCY FIXES
# ============================================
echo ""
echo "🚨 Emergency Situations:"
echo "------------------------"
cat << 'EOF'
# Discard all uncommitted changes:
git checkout -- .

# Undo last commit (keeps changes):
git reset --soft HEAD~1

# Undo last commit (discards changes):
git reset --hard HEAD~1

# Save changes for later:
git stash
git checkout other-branch
git stash pop
EOF

# ============================================
# 📝 COMMIT MESSAGE TEMPLATES
# ============================================
echo ""
echo "📝 Commit Message Examples:"
echo "------------------------"
cat << 'EOF'
git commit -m "feat: add Paystack webhook handler"
git commit -m "fix: resolve email verification bug"
git commit -m "docs: update API documentation"
git commit -m "style: improve dashboard UI"
git commit -m "refactor: optimize database queries"
git commit -m "test: add unit tests for auth service"
git commit -m "chore: update dependencies"
EOF

# ============================================
# 🔍 CHECKING STATUS
# ============================================
echo ""
echo "🔍 Checking Status:"
echo "------------------------"
cat << 'EOF'
git status              # Current branch and changes
git branch -a           # List all branches
git log --oneline -10   # Recent commits
git diff                # See what changed
EOF

echo ""
echo "==================================="
echo "✅ Copy the commands you need!"
echo "==================================="

