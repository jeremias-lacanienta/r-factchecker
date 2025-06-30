# Contributing to r/factchecker

Thank you for your interest in contributing to r/factchecker! This project was created for the AWS Lambda Hackathon to combat misinformation through browser-based fact-checking.

## 🚀 Getting Started

### Prerequisites
- Chrome browser (for testing)
- AWS Account (for Lambda deployment)
- Git and GitHub account

### Development Setup
1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/r-factchecker.git`
3. Load the extension in Chrome: 
   - Go to `chrome://extensions/`
   - Enable Developer mode
   - Click "Load unpacked" and select the project directory
4. Deploy AWS Lambda backend: `cd aws-lambda && ./deploy.sh`

## 🛠️ Project Structure

```
r_checker/
├── manifest.json          # Extension manifest
├── popup.html/js          # Extension popup
├── background.js          # Service worker
├── content.js/css         # Content scripts
├── aws-lambda/            # Lambda backend
└── docs/                  # Documentation
```

## 🔄 Development Workflow

### Making Changes
1. Create a feature branch: `git checkout -b feature/your-feature-name`
2. Make your changes
3. Test in Chrome Developer mode
4. Test AWS Lambda integration
5. Commit with descriptive messages
6. Push to your fork
7. Create a Pull Request

### Testing
- Test extension functionality in Chrome
- Verify AWS Lambda integration works
- Test on various websites including Reddit
- Check fact-checking accuracy and performance

## 📝 Code Guidelines

### Browser Extension Code
- Follow Chrome Extension best practices
- Use modern JavaScript (ES6+)
- Maintain Manifest V3 compliance
- Handle errors gracefully
- Add proper CORS handling

### AWS Lambda Code
- Keep functions focused and lightweight
- Implement proper error handling
- Use environment variables for configuration
- Follow AWS serverless best practices
- Optimize for cold start performance

### Documentation
- Update README.md for significant changes
- Comment complex code logic
- Maintain API documentation
- Update DEVPOST.txt for hackathon changes

## 🐛 Bug Reports

When reporting bugs, please include:
- Browser and version
- Extension version
- Steps to reproduce
- Expected vs actual behavior
- Console errors (if any)
- AWS Lambda logs (if backend related)

## 💡 Feature Requests

We welcome feature suggestions! Please:
- Check existing issues first
- Describe the use case
- Explain how it relates to fact-checking
- Consider AWS Lambda integration impact

## 🏆 AWS Lambda Hackathon Context

This project is designed for the AWS Lambda Hackathon with specific requirements:
- AWS Lambda must be the core service
- Must implement Lambda triggers
- Should solve real-world problems
- Needs comprehensive documentation

When contributing, please keep these hackathon requirements in mind.

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

## 🤝 Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help maintain a welcoming environment
- Support the mission of combating misinformation

## 🚀 Recognition

Contributors will be acknowledged in:
- README.md contributors section
- Release notes
- Hackathon submission (where appropriate)

Thank you for helping make the internet a more trustworthy place! 🌐✨
