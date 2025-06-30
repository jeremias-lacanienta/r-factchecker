# r/factchecker - Browser Extension

A powerful browser extension that provides real-time fact-checking for Reddit posts and external URLs using AWS Lambda serverless architecture.

## 🚀 Features

- **Reddit Integration**: Automatically fact-check Reddit posts and comments
- **URL Verification**: Analyze external links and web content for credibility
- **Text Selection**: Fact-check any selected text on web pages
- **Real-time Analysis**: Instant credibility scoring and source verification
- **AWS Lambda Backend**: Scalable serverless architecture for reliable performance
- **Cross-browser Support**: Compatible with Chrome and Firefox

## 🛠️ Technology Stack

- **Frontend**: JavaScript, HTML5, CSS3
- **Browser APIs**: Chrome Extension APIs (Manifest V3)
- **Backend**: AWS Lambda + API Gateway
- **Architecture**: Serverless microservices
- **APIs**: Reddit API, fact-checking services

## 📦 Installation

### For Users

1. Download the extension from the Chrome Web Store (coming soon)
2. Or load the unpacked extension in developer mode:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select this directory

### For Developers

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/r_checker.git
   cd r_checker
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Deploy the AWS Lambda backend:
   ```bash
   chmod +x deploy.sh
   ./deploy.sh
   ```

## 🚀 **Quick Deployment Guide**

### **Step 1: Setup Environment**
```bash
# Copy environment template
cp .env.example .env

# Edit the .env file with your credentials
nano .env  # or use your preferred editor
```

### **Step 2: Configure AWS Credentials**
Add your AWS credentials to the `.env` file:
```env
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_DEFAULT_REGION=us-east-1
```

### **Step 3: Deploy to AWS**
```bash
# Make deployment script executable
chmod +x deploy.sh

# Deploy to AWS Lambda
./deploy.sh
```

The deployment script will:
- Load environment variables from `.env`
- Install Lambda dependencies
- Build and deploy using AWS SAM
- Output your API Gateway URL and API Key

### **Step 4: Update Browser Extension**
After deployment, update the API endpoint in your extension files with the deployed API Gateway URL.

## 🏗️ Project Structure

```
r_checker/
├── manifest.json          # Extension manifest (Manifest V3)
├── popup.html             # Extension popup interface
├── popup.js               # Popup functionality
├── background.js          # Background service worker
├── content.js             # Content script for webpage interaction
├── content.css            # Styling for content script overlays
├── .env.example           # Environment variables template
├── aws-lambda/            # AWS Lambda backend
│   ├── factChecker.js     # Main Lambda function
│   ├── package.json       # Lambda dependencies
│   ├── template.yaml      # SAM template
│   └── trust-policy.json  # IAM role policy
└── deploy.sh              # Deployment script
```

## 🔧 Configuration

1. **Environment Setup**: Copy `.env.example` to `.env` and configure your credentials:
   ```bash
   cp .env.example .env
   # Edit .env with your AWS credentials and API keys
   ```

2. **AWS Credentials**: Add your AWS credentials to the `.env` file:
   ```env
   AWS_ACCESS_KEY_ID=your_access_key
   AWS_SECRET_ACCESS_KEY=your_secret_key
   AWS_DEFAULT_REGION=us-east-1
   ```

3. **API Keys**: Configure API credentials for external services:
   - Reddit API credentials
   - Fact-checking service API keys
   - Any other third-party APIs

## 🎯 Usage

1. **Reddit Posts**: Navigate to Reddit and click the extension icon to fact-check posts
2. **External URLs**: Use the popup to analyze any URL for credibility
3. **Text Selection**: Select text on any webpage and right-click to fact-check

## 🏆 AWS Lambda Hackathon

This project is built for the AWS Lambda Hackathon, showcasing:

- **Serverless Architecture**: Fully serverless backend using AWS Lambda
- **Scalability**: Auto-scaling based on demand
- **Cost Efficiency**: Pay-per-use pricing model
- **Performance**: Fast response times with global deployment
- **Security**: Secure API endpoints with proper authentication

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and commit: `git commit -m 'Add feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- [Devpost Submission](link-to-devpost)
- [Chrome Web Store](link-to-chrome-store)
- [AWS Lambda Documentation](https://docs.aws.amazon.com/lambda/)

## 📞 Support

For support and questions, please open an issue on GitHub or contact the maintainers.

---

Built with ❤️ for the AWS Lambda Hackathon
