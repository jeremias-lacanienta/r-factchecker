// Content script for webpage integration
(function() {
    'use strict';
    
    // Inject fact-checking capabilities into web pages
    console.log('r/factchecker content script loaded');
    
    // Add fact-check button to Reddit posts
    if (window.location.hostname.includes('reddit.com')) {
        initializeRedditIntegration();
    }
    
    // Listen for messages from popup/background
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'getSelectedText') {
            sendResponse({ text: window.getSelection().toString() });
        }
        return true;
    });
    
    function initializeRedditIntegration() {
        // Wait for Reddit to load
        setTimeout(() => {
            addFactCheckButtons();
        }, 2000);
        
        // Re-add buttons when page changes (SPA navigation)
        let lastUrl = location.href;
        new MutationObserver(() => {
            const url = location.href;
            if (url !== lastUrl) {
                lastUrl = url;
                setTimeout(addFactCheckButtons, 1000);
            }
        }).observe(document, { subtree: true, childList: true });
    }
    
    function addFactCheckButtons() {
        // Find Reddit posts
        const posts = document.querySelectorAll('[data-testid="post-container"]');
        
        posts.forEach(post => {
            // Skip if already has fact-check button
            if (post.querySelector('.factcheck-button')) return;
            
            // Find the action bar
            const actionBar = post.querySelector('[data-testid="post-action-bar"]');
            if (!actionBar) return;
            
            // Create fact-check button
            const factCheckBtn = document.createElement('button');
            factCheckBtn.className = 'factcheck-button';
            factCheckBtn.innerHTML = '🔍 Fact-check';
            factCheckBtn.style.cssText = `
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border: none;
                border-radius: 4px;
                padding: 4px 8px;
                margin-left: 8px;
                font-size: 12px;
                cursor: pointer;
                transition: all 0.2s;
            `;
            
            factCheckBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                factCheckRedditPost(post);
            });
            
            factCheckBtn.addEventListener('mouseenter', () => {
                factCheckBtn.style.transform = 'scale(1.05)';
            });
            
            factCheckBtn.addEventListener('mouseleave', () => {
                factCheckBtn.style.transform = 'scale(1)';
            });
            
            actionBar.appendChild(factCheckBtn);
        });
    }
    
    function factCheckRedditPost(postElement) {
        // Extract post content
        const titleElement = postElement.querySelector('[data-testid="post-title"]');
        const contentElement = postElement.querySelector('[data-testid="post-text-container"]');
        
        const title = titleElement ? titleElement.textContent : '';
        const content = contentElement ? contentElement.textContent : '';
        const postUrl = window.location.href;
        
        const postData = {
            title,
            content,
            url: postUrl,
            type: 'reddit'
        };
        
        // Send to background script for processing
        chrome.runtime.sendMessage({
            action: 'factcheck',
            data: postData
        });
        
        // Show loading indicator
        showLoadingOverlay();
    }
    
    function showLoadingOverlay() {
        const overlay = document.createElement('div');
        overlay.id = 'factcheck-loading';
        overlay.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 10000;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 20px;
            border-radius: 10px;
            text-align: center;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        `;
        
        overlay.innerHTML = `
            <div style="margin-bottom: 10px;">🔍</div>
            <div>Analyzing with AWS Lambda...</div>
        `;
        
        document.body.appendChild(overlay);
        
        // Remove after 3 seconds
        setTimeout(() => {
            if (overlay && overlay.parentNode) {
                overlay.remove();
            }
        }, 3000);
    }
    
    // Highlight suspicious content
    function highlightSuspiciousContent() {
        // This would be implemented with AI/ML results from Lambda
        console.log('Highlighting suspicious content based on Lambda analysis');
    }
    
})();
