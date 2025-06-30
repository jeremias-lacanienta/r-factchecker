# AWS Lambda Functions for r/factchecker

This directory contains the AWS Lambda functions that power the fact-checking backend for the r/factchecker VS Code extension.

## Architecture

- **API Gateway**: HTTP triggers for Lambda functions
- **Lambda Functions**: Serverless fact-checking logic
- **Optional Services**: 
  - AWS Bedrock for AI-powered analysis
  - DynamoDB for caching results
  - S3 for storing analysis data

## Deployment

1. Install AWS CLI and configure credentials
2. Install Serverless Framework or AWS SAM
3. Deploy using the provided templates

## Functions

- `factChecker`: Main fact-checking function
- `redditAnalyzer`: Reddit-specific content analysis
- `urlAnalyzer`: Web content scraping and analysis
- `sourceValidator`: Credibility scoring for sources

## Environment Variables

- `OPENAI_API_KEY`: For AI-powered analysis (optional)
- `REDDIT_CLIENT_ID`: Reddit API credentials (optional)
- `REDDIT_CLIENT_SECRET`: Reddit API credentials (optional)
- `ALLOWED_ORIGINS`: CORS origins for API Gateway
