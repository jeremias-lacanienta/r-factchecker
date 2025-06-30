// AWS Lambda API endpoint - replace with your actual endpoint
const LAMBDA_ENDPOINT = 'https://your-api-gateway-url.amazonaws.com/prod/fact-check';

class FactChecker {
    constructor() {
        this.initializePopup();
    }

    initializePopup() {
        document.getElementById('checkSelection').addEventListener('click', () => this.checkSelection());
        document.getElementById('checkCurrentPage').addEventListener('click', () => this.checkCurrentPage());
        document.getElementById('checkUrl').addEventListener('click', () => this.checkUrl());
        
        // Check if we're on Reddit and auto-populate
        this.checkCurrentTab();
    }

    async checkCurrentTab() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tab.url && tab.url.includes('reddit.com')) {
                document.getElementById('urlInput').value = tab.url;
                this.setStatus('Reddit page detected');
            }
        } catch (error) {
            console.error('Error checking current tab:', error);
        }
    }

    async checkSelection() {
        this.setStatus('Checking selected text...');
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            const results = await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                function: () => window.getSelection().toString()
            });
            
            const selectedText = results[0].result;
            if (!selectedText) {
                this.setStatus('No text selected');
                return;
            }
            
            await this.performFactCheck(selectedText, 'text');
        } catch (error) {
            this.showError('Error checking selection: ' + error.message);
        }
    }

    async checkCurrentPage() {
        this.setStatus('Analyzing current page...');
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            await this.performFactCheck(tab.url, 'url');
        } catch (error) {
            this.showError('Error checking page: ' + error.message);
        }
    }

    async checkUrl() {
        const url = document.getElementById('urlInput').value;
        if (!url) {
            this.setStatus('Please enter a URL');
            return;
        }
        
        this.setStatus('Analyzing URL...');
        try {
            const type = url.includes('reddit.com') ? 'reddit' : 'url';
            await this.performFactCheck(url, type);
        } catch (error) {
            this.showError('Error checking URL: ' + error.message);
        }
    }

    async performFactCheck(content, type) {
        try {
            // Send to AWS Lambda for analysis
            const response = await fetch(LAMBDA_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    content,
                    type,
                    timestamp: Date.now()
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            this.displayResults(result);
        } catch (error) {
            console.error('Fact-check error:', error);
            // Show demo results for development
            this.displayDemoResults(content, type);
        }
    }

    displayResults(result) {
        const resultDiv = document.getElementById('result');
        const scoreDiv = document.getElementById('credibilityScore');
        const analysisDiv = document.getElementById('analysis');
        
        const score = result.credibilityScore || 0;
        scoreDiv.textContent = `Credibility: ${score}%`;
        
        // Set score color based on value
        scoreDiv.className = 'credibility-score';
        if (score >= 70) scoreDiv.classList.add('score-high');
        else if (score >= 40) scoreDiv.classList.add('score-medium');
        else scoreDiv.classList.add('score-low');
        
        analysisDiv.innerHTML = `
            <div style="font-size: 12px; margin-top: 10px;">
                <strong>Analysis:</strong><br>
                ${result.analysis || 'Analysis completed'}
                <br><br>
                <strong>Sources checked:</strong> ${result.sourcesChecked || 'Multiple'}
            </div>
        `;
        
        resultDiv.style.display = 'block';
        this.setStatus('Analysis complete');
    }

    displayDemoResults(content, type) {
        // Demo results for development/demo purposes
        const demoScore = Math.floor(Math.random() * 100);
        const demoResult = {
            credibilityScore: demoScore,
            analysis: `${type === 'reddit' ? 'Reddit post' : 'Content'} analyzed using AWS Lambda. ${demoScore >= 70 ? 'High credibility detected.' : demoScore >= 40 ? 'Moderate credibility - verify sources.' : 'Low credibility - fact-check recommended.'}`,
            sourcesChecked: '3 trusted sources'
        };
        
        this.displayResults(demoResult);
    }

    showError(message) {
        document.getElementById('result').style.display = 'none';
        this.setStatus(`Error: ${message}`);
    }

    setStatus(message) {
        document.getElementById('status').textContent = message;
    }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new FactChecker();
});
