#!/bin/bash

# Deployment script for r/factchecker AWS Lambda
# This script helps deploy the Lambda functions for the AWS Lambda Hackathon

set -e

echo "🚀 Deploying r/factchecker to AWS Lambda..."

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI not found. Please install AWS CLI first."
    echo "Visit: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
    exit 1
fi

# Check if SAM CLI is installed
if ! command -v sam &> /dev/null; then
    echo "❌ SAM CLI not found. Please install SAM CLI first."
    echo "Visit: https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html"
    exit 1
fi

# Navigate to Lambda directory
cd aws-lambda

echo "📦 Installing Lambda dependencies..."
npm install

echo "🔨 Building SAM application..."
sam build

echo "🚀 Deploying to AWS..."
sam deploy --guided

echo "✅ Deployment complete!"
echo ""
echo "📋 Next steps:"
echo "1. Copy the API Gateway URL from the output"
echo "2. Copy the API Key from AWS Console"
echo "3. Configure these in VS Code settings:"
echo "   - r-factchecker.apiEndpoint: <API Gateway URL>/check"
echo "   - r-factchecker.apiKey: <Your API Key>"
echo ""
echo "🎉 Your r/factchecker is now powered by AWS Lambda!"
