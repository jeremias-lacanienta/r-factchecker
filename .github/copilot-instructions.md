# Copilot Instructions for r/factchecker

<!-- Browser extension project for fact-checking Reddit posts and URLs using AWS Lambda serverless architecture -->

This is a browser extension project for r/factchecker - a fact-checking tool for Reddit posts and URLs using AWS Lambda serverless architecture.

## Project Overview
- **Project Type**: Browser Extension (Chrome/Firefox)
- **Target Platform**: AWS Lambda Hackathon submission
- **Architecture**: Browser extension + AWS Lambda backend
- **Primary Features**: Fact-checking Reddit posts and external URLs

## Browser Extension Development Guidelines
- Use Manifest V3 for Chrome extensions
- Implement content scripts for webpage interaction
- Use popup UI for extension interface

## Key Technologies
- JavaScript/HTML/CSS for browser extension
- Chrome Extension APIs (or WebExtensions API)
- AWS Lambda for serverless fact-checking backend
- API Gateway for HTTP triggers
- Content scripts for webpage integration
- Background service workers
- HTTP requests to Reddit API and external sources

## Code Style Preferences
- Use modern JavaScript features (ES6+)
- Follow browser extension best practices
- Implement proper error handling
- Use fetch API for HTTP requests
- Maintain security best practices for content scripts
- Include comprehensive logging

## AWS Lambda Integration
- Design for serverless architecture
- Use API Gateway triggers
- Implement efficient fact-checking algorithms
- Consider rate limiting and cost optimization
- Support both Reddit posts and external URLs

## UI/UX Guidelines
- Clean popup interface for extension
- Content script overlays for webpage integration
- Visual indicators for credibility scores
- Responsive design for different screen sizes
- Accessibility considerations
