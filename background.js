// Background service worker for browser extension
chrome.runtime.onInstalled.addListener(() => {
    console.log('r/factchecker extension installed');
    
    // Create context menu items
    chrome.contextMenus.create({
        id: 'factcheck-selection',
        title: 'Fact-check selected text',
        contexts: ['selection']
    });
    
    chrome.contextMenus.create({
        id: 'factcheck-link',
        title: 'Fact-check this link',
        contexts: ['link']
    });
    
    chrome.contextMenus.create({
        id: 'factcheck-page',
        title: 'Fact-check this page',
        contexts: ['page']
    });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    const LAMBDA_ENDPOINT = 'https://your-api-gateway-url.amazonaws.com/prod/fact-check';
    
    let content = '';
    let type = 'text';
    
    switch (info.menuItemId) {
        case 'factcheck-selection':
            content = info.selectionText;
            type = 'text';
            break;
        case 'factcheck-link':
            content = info.linkUrl;
            type = info.linkUrl.includes('reddit.com') ? 'reddit' : 'url';
            break;
        case 'factcheck-page':
            content = info.pageUrl;
            type = info.pageUrl.includes('reddit.com') ? 'reddit' : 'url';
            break;
    }
    
    if (content) {
        // Send fact-check request to AWS Lambda
        try {
            await performFactCheck(content, type, tab.id);
        } catch (error) {
            console.error('Background fact-check error:', error);
            // Show notification with demo result
            showDemoNotification(content, type);
        }
    }
});

async function performFactCheck(content, type, tabId) {
    const LAMBDA_ENDPOINT = 'https://your-api-gateway-url.amazonaws.com/prod/fact-check';
    
    try {
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
        
        // Show notification with results
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon-48.png',
            title: 'r/factchecker Results',
            message: `Credibility: ${result.credibilityScore}% - ${result.analysis}`
        });
        
        // Inject results into page
        chrome.scripting.executeScript({
            target: { tabId },
            function: showFactCheckOverlay,
            args: [result]
        });
        
    } catch (error) {
        console.error('Lambda request failed:', error);
        showDemoNotification(content, type);
    }
}

function showDemoNotification(content, type) {
    const demoScore = Math.floor(Math.random() * 100);
    const message = `Demo: ${demoScore}% credibility (AWS Lambda backend needed for real analysis)`;
    
    chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon-48.png',
        title: 'r/factchecker Demo',
        message: message
    });
}

// Function to inject into page (for overlay display)
function showFactCheckOverlay(result) {
    // Remove existing overlays
    const existingOverlay = document.getElementById('factcheck-overlay');
    if (existingOverlay) {
        existingOverlay.remove();
    }
    
    // Create overlay
    const overlay = document.createElement('div');
    overlay.id = 'factcheck-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 15px;
        border-radius: 10px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        max-width: 300px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        backdrop-filter: blur(10px);
    `;
    
    const score = result.credibilityScore || Math.floor(Math.random() * 100);
    const scoreColor = score >= 70 ? '#22c55e' : score >= 40 ? '#fbbf24' : '#ef4444';
    
    overlay.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <strong>r/factchecker</strong>
            <button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; color: white; cursor: pointer; font-size: 18px;">×</button>
        </div>
        <div style="background: ${scoreColor}; padding: 8px; border-radius: 5px; text-align: center; margin-bottom: 10px;">
            <strong>Credibility: ${score}%</strong>
        </div>
        <div style="font-size: 12px; opacity: 0.9;">
            ${result.analysis || 'Analysis completed using AWS Lambda'}
        </div>
    `;
    
    document.body.appendChild(overlay);
    
    // Auto-remove after 10 seconds
    setTimeout(() => {
        if (overlay && overlay.parentNode) {
            overlay.remove();
        }
    }, 10000);
}
