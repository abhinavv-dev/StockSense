# Git Push Error - Solutions

## Common Git Push Errors and Fixes

### Error 1: SSL Certificate Verification Failed

**Error Message:**
```
fatal: unable to access 'https://github.com/...': error setting certificate verify locations
```

**Solution 1: Fix SSL Certificates (Recommended)**
```bash
# On macOS, install/update certificates
brew install ca-certificates

# Or update git to use system certificates
git config --global http.sslCAInfo /etc/ssl/cert.pem
```

**Solution 2: Temporary Workaround (Not Recommended)**
```bash
# Disable SSL verification temporarily (only for testing)
GIT_SSL_NO_VERIFY=true git push -u origin main
```

### Error 2: No Upstream Branch Set

**Error Message:**
```
fatal: The current branch main has no upstream branch.
```

**Solution:**
```bash
# Set upstream and push
git push -u origin main
```

### Error 3: Authentication Failed

**Error Message:**
```
remote: Support for password authentication was removed on August 13, 2021
fatal: Authentication failed
```

**Solution: Use Personal Access Token**

1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token with `repo` scope
3. Use token as password when pushing:
   ```bash
   git push -u origin main
   # Username: abhinavv-dev
   # Password: <your-personal-access-token>
   ```

**Alternative: Switch to SSH**
```bash
# Change remote URL to SSH
git remote set-url origin git@github.com:abhinavv-dev/StockSense.git

# Push using SSH
git push -u origin main
```

### Error 4: Push Rejected (Non-fast-forward)

**Error Message:**
```
! [rejected]        main -> main (non-fast-forward)
```

**Solution: Pull and Merge First**
```bash
# Pull remote changes
git pull origin main --rebase

# Resolve any conflicts, then push
git push -u origin main
```

### Error 5: Remote Branch Doesn't Exist

**Error Message:**
```
fatal: The current branch main has no upstream branch.
```

**Solution:**
```bash
# First push - create remote branch
git push -u origin main
```

## Quick Fix Script

Run the automated fix script:

```bash
./fix_git_push.sh
```

This script will:
1. Detect the type of error
2. Try multiple solutions automatically
3. Provide specific instructions based on the error

## Manual Push Commands

### Standard Push (First Time)
```bash
git push -u origin main
```

### Subsequent Pushes
```bash
git push
```

### Force Push (Use with Caution!)
```bash
# Only use if you're sure you want to overwrite remote
git push -u origin main --force
```

## Verify Setup

```bash
# Check remote URL
git remote -v

# Check current branch
git branch

# Check status
git status

# Check if there are commits to push
git log origin/main..HEAD --oneline
```

## Recommended Setup

### 1. Use SSH (Most Secure)

```bash
# Generate SSH key (if you don't have one)
ssh-keygen -t ed25519 -C "abhiiiinavv@gmail.com"

# Add to SSH agent
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519

# Copy public key to clipboard
pbcopy < ~/.ssh/id_ed25519.pub

# Add key to GitHub: Settings → SSH and GPG keys → New SSH key

# Change remote to SSH
git remote set-url origin git@github.com:abhinavv-dev/StockSense.git

# Test connection
ssh -T git@github.com

# Push
git push -u origin main
```

### 2. Use Personal Access Token

```bash
# Keep using HTTPS, but use token as password
git push -u origin main
# When prompted for password, use your Personal Access Token
```

### 3. Use GitHub CLI

```bash
# Install GitHub CLI
brew install gh

# Authenticate
gh auth login

# Push
git push -u origin main
```

## Current Repository Info

- **Remote URL:** https://github.com/abhinavv-dev/StockSense.git
- **Current Branch:** main
- **Git User:** abhinavv-dev (abhiiiinavv@gmail.com)

## Still Having Issues?

1. Check your internet connection
2. Verify GitHub is accessible: `curl https://github.com`
3. Check git version: `git --version`
4. Try from a different network (in case of firewall issues)
5. Check GitHub status: https://www.githubstatus.com/
