const https = require('https');
const url = require('url');

/**
 * AWS Lambda function for fact-checking content
 * Triggered by API Gateway
 */
exports.handler = async (event) => {
    console.log('Received fact-checking request:', JSON.stringify(event, null, 2));
    
    // Set up CORS headers
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,x-api-key',
        'Access-Control-Allow-Methods': 'POST,OPTIONS'
    };
    
    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }
    
    try {
        // Parse request body
        const requestBody = JSON.parse(event.body || '{}');
        const { content, type, redditData, options = {} } = requestBody;
        
        if (!content || !type) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    success: false,
                    error: 'Missing required fields: content and type',
                    requestId: event.requestContext?.requestId
                })
            };
        }
        
        // Perform fact-checking based on type
        let result;
        switch (type) {
            case 'text':
                result = await analyzeText(content, options);
                break;
            case 'reddit':
                result = await analyzeRedditPost(content, redditData, options);
                break;
            case 'url':
                result = await analyzeUrl(content, options);
                break;
            default:
                throw new Error(`Unsupported content type: ${type}`);
        }
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                result,
                requestId: event.requestContext?.requestId
            })
        };
        
    } catch (error) {
        console.error('Fact-checking error:', error);
        
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                error: error.message,
                requestId: event.requestContext?.requestId
            })
        };
    }
};

/**
 * Analyze plain text content
 */
async function analyzeText(content, options) {
    // This is a simplified implementation
    // In production, you would use NLP services, fact-checking APIs, etc.
    
    const claims = extractClaims(content);
    const details = [];
    
    for (const claim of claims.slice(0, 5)) { // Limit to 5 claims
        const verification = await verifyClaim(claim);
        details.push({
            claim,
            verdict: verification.verdict,
            explanation: verification.explanation,
            confidence: verification.confidence
        });
    }
    
    const overallScore = calculateOverallScore(details);
    const status = determineStatus(overallScore);
    
    return {
        source: content.substring(0, 100) + (content.length > 100 ? '...' : ''),
        type: 'text',
        score: overallScore,
        status,
        summary: generateSummary(details, status),
        details,
        timestamp: new Date(),
        sources: await findRelevantSources(content)
    };
}

/**
 * Analyze Reddit post content
 */
async function analyzeRedditPost(url, redditData, options) {
    // Fetch Reddit data if not provided
    if (!redditData) {
        redditData = await fetchRedditData(url);
    }
    
    // Analyze post title and content
    const postAnalysis = await analyzeText(redditData.title + ' ' + redditData.content, options);
    
    // Analyze comments for additional context
    let commentAnalysis = null;
    if (options.includeComments && redditData.comments) {
        const commentText = redditData.comments
            .slice(0, 10) // Top 10 comments
            .map(c => c.content)
            .join(' ');
        commentAnalysis = await analyzeText(commentText, options);
    }
    
    // Combine analyses
    const result = {
        ...postAnalysis,
        type: 'reddit',
        redditMetrics: {
            subreddit: redditData.subreddit,
            score: redditData.score,
            commentCount: redditData.comments?.length || 0,
            credibilityIndicators: generateRedditCredibilityIndicators(redditData)
        }
    };
    
    if (commentAnalysis) {
        result.commentAnalysis = commentAnalysis;
    }
    
    return result;
}

/**
 * Analyze URL content
 */
async function analyzeUrl(targetUrl, options) {
    try {
        // Fetch and analyze webpage content
        const webContent = await fetchWebContent(targetUrl);
        const textAnalysis = await analyzeText(webContent.text, options);
        
        // Add URL-specific metadata
        return {
            ...textAnalysis,
            type: 'url',
            urlMetadata: {
                title: webContent.title,
                domain: url.parse(targetUrl).hostname,
                publishDate: webContent.publishDate,
                author: webContent.author
            },
            domainCredibility: await evaluateDomainCredibility(targetUrl)
        };
    } catch (error) {
        throw new Error(`Failed to analyze URL: ${error.message}`);
    }
}

/**
 * Extract potential claims from text
 */
function extractClaims(text) {
    // Simple claim extraction - in production would use NLP
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
    
    // Look for factual claims (sentences with numbers, dates, specific assertions)
    return sentences.filter(sentence => {
        const hasNumbers = /\d/.test(sentence);
        const hasFactualWords = /\b(is|are|was|were|will|according to|study|research|report)\b/i.test(sentence);
        return hasNumbers || hasFactualWords;
    }).slice(0, 5); // Limit claims
}

/**
 * Verify a single claim
 */
async function verifyClaim(claim) {
    // Mock verification - in production would use fact-checking APIs
    const keywords = claim.toLowerCase();
    
    // Simple keyword-based verification simulation
    if (keywords.includes('covid') || keywords.includes('vaccine')) {
        return {
            verdict: 'disputed',
            explanation: 'Health claims require verification from authoritative medical sources.',
            confidence: 60
        };
    } else if (keywords.includes('climate') || keywords.includes('temperature')) {
        return {
            verdict: 'true',
            explanation: 'Climate data can be verified through scientific institutions.',
            confidence: 85
        };
    } else {
        return {
            verdict: 'unverified',
            explanation: 'Claim requires additional verification from reliable sources.',
            confidence: 50
        };
    }
}

/**
 * Calculate overall credibility score
 */
function calculateOverallScore(details) {
    if (details.length === 0) return 50;
    
    const averageConfidence = details.reduce((sum, d) => sum + d.confidence, 0) / details.length;
    const verdictScores = {
        'true': 90,
        'misleading': 40,
        'false': 10,
        'unverified': 50
    };
    
    const averageVerdictScore = details.reduce((sum, d) => {
        return sum + (verdictScores[d.verdict] || 50);
    }, 0) / details.length;
    
    return Math.round((averageConfidence + averageVerdictScore) / 2);
}

/**
 * Determine overall status
 */
function determineStatus(score) {
    if (score >= 80) return 'verified';
    if (score >= 60) return 'unverified';
    if (score >= 40) return 'disputed';
    return 'false';
}

/**
 * Generate summary
 */
function generateSummary(details, status) {
    const statusMessages = {
        'verified': 'Content appears to be largely accurate based on available sources.',
        'unverified': 'Content contains claims that require additional verification.',
        'disputed': 'Content contains disputed or questionable claims.',
        'false': 'Content contains potentially false or misleading information.'
    };
    
    return statusMessages[status] || 'Analysis complete.';
}

/**
 * Find relevant sources for verification
 */
async function findRelevantSources(content) {
    // Mock sources - in production would search fact-checking databases
    return [
        {
            title: 'Fact-Check Database',
            url: 'https://factcheck.org',
            credibility: 95,
            date: new Date(),
            excerpt: 'Authoritative fact-checking resource...'
        },
        {
            title: 'Academic Research',
            url: 'https://scholar.google.com',
            credibility: 90,
            date: new Date(),
            excerpt: 'Peer-reviewed research on related topics...'
        }
    ];
}

/**
 * Generate Reddit-specific credibility indicators
 */
function generateRedditCredibilityIndicators(redditData) {
    const indicators = [];
    
    if (redditData.score > 100) {
        indicators.push('High community engagement');
    }
    
    const moderatedSubs = ['science', 'news', 'worldnews', 'politics'];
    if (moderatedSubs.includes(redditData.subreddit.toLowerCase())) {
        indicators.push('Posted in moderated subreddit');
    }
    
    if (redditData.comments && redditData.comments.length > 50) {
        indicators.push('Active discussion with many comments');
    }
    
    return indicators;
}

/**
 * Fetch Reddit data from URL
 */
async function fetchRedditData(redditUrl) {
    // Mock Reddit data - in production would use Reddit API
    return {
        id: 'sample_id',
        title: 'Sample Reddit Post Title',
        content: 'Sample post content...',
        subreddit: 'news',
        author: 'sample_user',
        score: 150,
        created: new Date(),
        comments: [
            {
                id: 'comment1',
                content: 'Sample comment content',
                author: 'commenter1',
                score: 25,
                created: new Date()
            }
        ]
    };
}

/**
 * Fetch web content from URL
 */
async function fetchWebContent(targetUrl) {
    // Mock web scraping - in production would scrape actual content
    return {
        title: 'Sample Article Title',
        text: 'Sample article content for fact-checking...',
        author: 'John Doe',
        publishDate: new Date()
    };
}

/**
 * Evaluate domain credibility
 */
async function evaluateDomainCredibility(targetUrl) {
    const domain = url.parse(targetUrl).hostname;
    
    // Mock domain evaluation - in production would use domain reputation APIs
    const trustedDomains = {
        'bbc.com': 95,
        'reuters.com': 95,
        'apnews.com': 95,
        'cnn.com': 80,
        'foxnews.com': 75,
        'wikipedia.org': 85
    };
    
    return trustedDomains[domain] || 50;
}
