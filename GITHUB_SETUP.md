# 🚀 GitHub Repository Setup Instructions

## Quick Setup (Recommended)

### Option 1: Create Repository via GitHub CLI (if installed)
```bash
# Install GitHub CLI if not already installed
# brew install gh (macOS) or download from https://cli.github.com/

# Authenticate with GitHub
gh auth login

# Create repository and push
gh repo create r-factchecker --public --description "🔍 AI-powered fact-checking browser extension using AWS Lambda serverless architecture for the AWS Lambda Hackathon"
git remote add origin https://github.com/YOUR_USERNAME/r-factchecker.git
git push -u origin main
```

### Option 2: Manual GitHub Setup
1. **Go to GitHub.com**
2. **Click "New Repository" button**
3. **Repository Settings:**
   - Repository name: `r-factchecker`
   - Description: `🔍 AI-powered fact-checking browser extension using AWS Lambda serverless architecture for the AWS Lambda Hackathon`
   - Public repository ✅
   - Don't initialize with README (we already have one)
4. **Copy the repository URL**
5. **Run these commands:**

```bash
cd /Users/jlacanienta/Projects/r_checker
git remote add origin https://github.com/YOUR_USERNAME/r-factchecker.git
git branch -M main
git push -u origin main
```

## 📋 Repository Configuration

### Topics/Tags to Add
After creating the repository, add these topics in GitHub settings:
- `aws-lambda`
- `hackathon`
- `browser-extension`
- `fact-checking`
- `chrome-extension`
- `serverless`
- `javascript`
- `misinformation`
- `reddit`

### Repository Settings
1. **About Section:**
   - Website: `[Your demo URL or extension store link]`
   - Topics: Add the tags listed above
   - Check "Use your repository description"

2. **Issues:**
   - Enable issues for bug reports and feature requests

3. **Wiki:**
   - Optionally enable for extended documentation

4. **Pages:**
   - Can be used later for demo page or documentation

## 🎯 Post-Creation Checklist

After pushing to GitHub:

### Update URLs in Code
Update these files with your actual GitHub repository URL:
- [ ] `README.md` - Update repository links
- [ ] `package.json` - Update repository URL
- [ ] `DEVPOST.txt` - Add GitHub repository link

### Repository Maintenance
- [ ] Add repository description and topics
- [ ] Enable issues and discussions
- [ ] Create initial GitHub release/tag
- [ ] Add repository to your GitHub profile README (if desired)

### Hackathon Submission
- [ ] Copy GitHub repository URL for DEVPOST submission
- [ ] Ensure repository is public and accessible
- [ ] Verify all required files are present and up-to-date

## 🔗 Sample Repository URLs

After creation, your repository will be accessible at:
- **Repository**: `https://github.com/YOUR_USERNAME/r-factchecker`
- **Clone URL**: `https://github.com/YOUR_USERNAME/r-factchecker.git`
- **Raw files**: `https://raw.githubusercontent.com/YOUR_USERNAME/r-factchecker/main/`

## 🚀 Ready for Hackathon Submission!

Once your GitHub repository is live:
1. ✅ Public repository with complete source code
2. ✅ Comprehensive README with AWS Lambda usage
3. ✅ Working browser extension code
4. ✅ AWS Lambda deployment files
5. ✅ Clear installation and setup instructions
6. ✅ MIT License for open source compliance
7. ✅ Professional documentation and presentation

Your r/factchecker project is now ready for the AWS Lambda Hackathon submission! 🏆
