# Git Security Guidelines for Newsletter Application

## Pre-Push Security Checklist

Before pushing to the repository, ensure the following security measures are in place:

### 1. Verify .gitignore Configuration
- [x] Database export files (`.sql`) are excluded
- [x] Environment files (`.env*`) are excluded  
- [x] Password-related files are excluded
- [x] Only sanitized export files are allowed (e.g., `export-database-final.sql`)

### 2. Check for Sensitive Files in Git Index
Run the following command to verify no sensitive files are staged:
```bash
git ls-files | grep -E "\.(sql|env|password|secret|key)$"
```

### 3. Verify Sensitive Files Are Not Tracked
If any sensitive files are listed in the git index, remove them:
```bash
git rm --cached <filename>
```

## Current Security Configuration

### Files Excluded from Git
The following file types are excluded from version control:
- `*.sql` - Database export files
- `*.env*` - Environment configuration files
- `*.db` - Database files
- Password-related files (reset-passwords*.sql, verify-passwords.sql, etc.)

### Files Explicitly Allowed
- `export-database-final.sql` - Only sanitized database exports are allowed

## Secure Push Process

### 1. Clean Up Sensitive Files
```bash
# Remove any sensitive files from git tracking
git rm --cached export-database.sql 2>/dev/null || true
git rm --cached .env 2>/dev/null || true

# Commit the removal
git add .gitignore
git commit -m "Security: Remove sensitive files from tracking"
```

### 2. Verify Clean State
```bash
# Check that sensitive files are not in the index
git ls-files | grep -E "(export-database\.sql|\.env|password|secret)"
```

### 3. Push Securely
```bash
# Push to the repository using HTTPS (not SSH)
git push origin main
```

## Additional Security Measures

### Environment Configuration
- Use environment variables for sensitive data in production
- Never commit actual credentials to the repository
- Use different credentials for development and production

### Password Management
- Passwords are hashed using bcrypt with 12 rounds
- Never store passwords in plain text
- Use secure password reset mechanisms

### Database Security
- Database credentials are stored in environment variables
- Export files contain sensitive data and should not be committed
- Use parameterized queries to prevent SQL injection

## Verification Commands

To verify the security of your commit before pushing:
```bash
# Check for any sensitive files
git status

# Verify .gitignore is working properly
git check-ignore *.sql *.env

# Review changes before committing
git diff --cached
```

## Troubleshooting

### If Sensitive Data Was Accidentally Committed
If sensitive data has been committed to the repository, use the following:
```bash
# Remove the file from git history (replace <file> with actual filename)
git filter-branch --force --index-filter "git rm --cached --ignore-unmatch <file>" --prune-empty --tag-name-filter cat -- --all

# Or use git rm --cached for files that were recently added but not committed yet
git rm --cached <file>
```

### For Complete Repository Cleanup
If you need to completely clean sensitive data from the repository history:
```bash
# This is a more complex process and should be done carefully
# Consider using BFG Repo-Cleaner or git filter-branch for comprehensive cleanup
```

## Git Configuration Security

Ensure your git configuration is secure:
- Use HTTPS instead of SSH for remote access
- Configure git to use credential helpers appropriately
- Never store credentials in global git configuration

## Summary

Following these guidelines ensures that:
1. No sensitive data is pushed to the repository
2. Database exports with real data are excluded
3. Environment variables with secrets are not committed
4. Password-related files are properly excluded
5. The repository remains secure for collaborative development