#!/bin/bash

# Script to fix common git push errors

echo "=========================================="
echo "Git Push Error Fixer"
echo "=========================================="
echo ""

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo "❌ Not a git repository. Exiting."
    exit 1
fi

# Get current branch
CURRENT_BRANCH=$(git branch --show-current)
echo "Current branch: $CURRENT_BRANCH"
echo ""

# Check if there are commits to push
LOCAL_COMMITS=$(git log origin/$CURRENT_BRANCH..HEAD --oneline 2>/dev/null | wc -l)
if [ "$LOCAL_COMMITS" -eq 0 ] 2>/dev/null; then
    # Try to check if remote branch exists
    git fetch origin 2>/dev/null
    if [ $? -ne 0 ]; then
        echo "⚠️  Cannot fetch from remote. This might be your first push."
        echo ""
    else
        echo "✅ No local commits to push. Working tree is clean."
        exit 0
    fi
fi

echo "Attempting to push to origin/$CURRENT_BRANCH..."
echo ""

# Method 1: Try standard push with upstream
echo "[Method 1] Setting upstream and pushing..."
git push -u origin $CURRENT_BRANCH 2>&1 | tee /tmp/git_push_error.log

if [ ${PIPESTATUS[0]} -eq 0 ]; then
    echo ""
    echo "✅ Push successful!"
    exit 0
fi

# Check error type
ERROR=$(cat /tmp/git_push_error.log)

if echo "$ERROR" | grep -q "certificate"; then
    echo ""
    echo "⚠️  SSL Certificate Error Detected"
    echo ""
    echo "Trying to fix SSL certificate issue..."
    echo ""
    
    # Try with SSL verification disabled (temporary)
    echo "[Method 2] Attempting push with SSL verification disabled..."
    GIT_SSL_NO_VERIFY=true git push -u origin $CURRENT_BRANCH
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ Push successful (with SSL verification disabled)"
        echo ""
        echo "⚠️  NOTE: This is a temporary fix. For permanent solution:"
        echo "   git config --global http.sslVerify true"
        echo "   And ensure your system has proper SSL certificates installed."
        exit 0
    fi
fi

if echo "$ERROR" | grep -q "authentication\|unauthorized\|403\|401"; then
    echo ""
    echo "⚠️  Authentication Error Detected"
    echo ""
    echo "You need to authenticate with GitHub. Options:"
    echo ""
    echo "Option 1: Use Personal Access Token (Recommended)"
    echo "  1. Go to: https://github.com/settings/tokens"
    echo "  2. Generate new token with 'repo' scope"
    echo "  3. Use token as password when pushing"
    echo ""
    echo "Option 2: Switch to SSH"
    echo "  git remote set-url origin git@github.com:abhinavv-dev/StockSense.git"
    echo "  git push -u origin $CURRENT_BRANCH"
    echo ""
    echo "Option 3: Use GitHub CLI"
    echo "  gh auth login"
    echo "  git push -u origin $CURRENT_BRANCH"
    exit 1
fi

if echo "$ERROR" | grep -q "rejected\|non-fast-forward"; then
    echo ""
    echo "⚠️  Push Rejected - Remote has changes you don't have"
    echo ""
    echo "Solution: Pull and merge first"
    echo "  git pull origin $CURRENT_BRANCH --rebase"
    echo "  git push -u origin $CURRENT_BRANCH"
    exit 1
fi

echo ""
echo "❌ Push failed. Error details:"
echo "$ERROR"
echo ""
echo "Common solutions:"
echo "1. Check your internet connection"
echo "2. Verify GitHub credentials"
echo "3. Try: git push -u origin $CURRENT_BRANCH --force (if you're sure)"
echo "4. Check: git remote -v (verify remote URL is correct)"
exit 1
