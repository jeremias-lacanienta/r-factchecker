#!/bin/bash

# r/factchecker GitHub Repository Setup Script
# Run this after creating the repository on GitHub.com

echo "🚀 Setting up r/factchecker GitHub repository..."

# Check if we're in the right directory
if [ ! -f "manifest.json" ]; then
    echo "❌ Error: Please run this script from the r_checker directory"
    exit 1
fi

# Get repository URL from user
echo "📝 Please enter your GitHub repository URL:"
echo "   Format: https://github.com/YOUR_USERNAME/r-factchecker.git"
read -p "Repository URL: " REPO_URL

if [ -z "$REPO_URL" ]; then
    echo "❌ Error: Repository URL is required"
    exit 1
fi

# Add remote origin
echo "🔗 Adding remote origin..."
git remote add origin "$REPO_URL"

# Push to GitHub
echo "📤 Pushing to GitHub..."
git branch -M main
git push -u origin main

if [ $? -eq 0 ]; then
    echo "✅ Successfully pushed to GitHub!"
    echo ""
    echo "🎯 Next steps:"
    echo "1. Go to your GitHub repository"
    echo "2. Add topics: aws-lambda, hackathon, browser-extension, fact-checking"
    echo "3. Update DEVPOST.txt with your repository URL"
    echo "4. Your repository is ready for AWS Lambda Hackathon submission!"
    echo ""
    echo "Repository URL: ${REPO_URL%.git}"
else
    echo "❌ Error: Failed to push to GitHub"
    echo "Please check your repository URL and permissions"
fi
