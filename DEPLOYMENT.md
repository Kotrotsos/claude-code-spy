# Deployment Guide

## Publishing to NPM

### Step 1: Create GitHub Repository

```bash
# Initialize git (if not already done)
git init
git add .
git commit -m "Initial commit: Claude Code History CLI"

# Create repo on GitHub, then:
git remote add origin https://github.com/yourusername/claude-code-history.git
git branch -M main
git push -u origin main
```

### Step 2: Update package.json

Edit `package.json` and update:
- `"author"` - Your name/email
- `"repository.url"` - Your GitHub repo URL
- `"bugs.url"` - Your GitHub issues URL
- `"homepage"` - Your GitHub repo URL + #readme

```json
{
  "author": "Your Name <your.email@example.com>",
  "repository": {
    "type": "git",
    "url": "https://github.com/yourusername/claude-code-history"
  }
}
```

### Step 3: Create NPM Account

1. Go to https://www.npmjs.com/signup
2. Create an account
3. Verify your email

### Step 4: Login to NPM

```bash
npm login
# Enter your npm username, password, and email
```

### Step 5: Publish to NPM

```bash
# First time publishing
npm publish

# Publishing updates
# 1. Update version in package.json
npm version patch    # for bug fixes (2.0.0 -> 2.0.1)
npm version minor    # for new features (2.0.0 -> 2.1.0)
npm version major    # for breaking changes (2.0.0 -> 3.0.0)

# 2. Publish
npm publish

# 3. Push changes to GitHub
git push
git push --tags
```

### Step 6: Verify Publication

```bash
# Check on npm
npm view claude-code-history

# Install globally
npm install -g claude-code-history

# Or use with npx (no install needed)
npx claude-code-history --help
```

---

## Usage After Publishing

### Install Globally
```bash
npm install -g claude-code-history
claude-history --watch
```

### Use with npx (No Installation)
```bash
# One-time use without installation
npx claude-code-history --watch

# Or with short alias
npx claude-code-history --archer
```

### Install as Dev Dependency
```bash
npm install --save-dev claude-code-history
npx claude-history --current
```

---

## Version Management

Update version before each publish:

```bash
# Patch version (bug fixes)
npm version patch

# Minor version (new features)
npm version minor

# Major version (breaking changes)
npm version major
```

Then publish:
```bash
npm publish
```

---

## Files Included in Package

The npm package includes:
- `claude-history` - Bash wrapper script
- `claude-history-cli.js` - Main CLI application
- `README-claude-history.md` - Full documentation
- `LICENSE` - MIT license

Excluded from package (`.npmignore`):
- `.claude/` - Local history files
- `.git/` - Git history
- `node_modules/` - Dependencies
- `.env` - Environment variables

---

## After Publishing

### Update README with NPM Badge

Add to your README:
```markdown
# Claude Code History

[![npm version](https://badge.fury.io/js/claude-code-history.svg)](https://badge.fury.io/js/claude-code-history)
[![npm downloads](https://img.shields.io/npm/dm/claude-code-history.svg)](https://www.npmjs.com/package/claude-code-history)

## Quick Install

```bash
npm install -g claude-code-history
```

Or use with npx:
```bash
npx claude-code-history --watch
```
```

### Promote

- Post on Twitter/X
- Share on Dev.to
- Post in Claude/AI communities
- Add to awesome-lists

---

## Troubleshooting

### "npm ERR! 403 Forbidden"
- Check package name isn't already taken: `npm view package-name`
- Login check: `npm whoami`

### "npm ERR! 404 Not Found"
- Make sure you've logged in: `npm login`
- Check package.json exists and is valid

### Package Not Found After Publishing
- Wait a few minutes for NPM registry to update
- Check: `npm view claude-code-history`

### bin Script Not Working
- Verify shebang in `claude-history`: `#!/bin/bash`
- Verify file is executable: `chmod +x claude-history`

---

## Example: Full Publishing Workflow

```bash
# 1. Make sure everything is committed
git status

# 2. Update version
npm version minor

# 3. Publish to npm
npm publish

# 4. Verify
npm view claude-code-history version

# 5. Push to github
git push
git push --tags

# 6. Test with npx
npx claude-code-history --help
```

---

## Maintaining Your Package

### Handle Updates
```bash
# Make changes
vim claude-history-cli.js

# Update version
npm version patch

# Test locally
npm install -g ./

# Publish
npm publish

# Push code
git push && git push --tags
```

### Security Updates
Always publish security fixes immediately with `npm version patch`

### Monitor Issues
Check npm page at: https://www.npmjs.com/package/claude-code-history
