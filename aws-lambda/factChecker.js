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
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 5);
    
    // Look for factual claims - be more inclusive
    return sentences.filter(sentence => {
        const trimmed = sentence.trim();
        if (trimmed.length < 10) return false;
        
        // Accept any sentence that makes an assertion
        const hasAssertion = /\b(is|are|was|were|will|can|does|helps|improves|causes|prevents|shows|indicates|according to|study|research|report|claims|states|found|discovered)\b/i.test(sentence);
        const hasNumbers = /\d/.test(sentence);
        const hasSubjectAndPredicate = sentence.split(' ').length >= 4;
        
        return hasAssertion || hasNumbers || hasSubjectAndPredicate;
    }).slice(0, 5); // Limit claims
}

/**
 * Verify a single claim using real fact-checking APIs
 */
async function verifyClaim(claim) {
    const keywords = claim.toLowerCase();
    
    try {
        // Use multiple fact-checking sources
        const factCheckResults = await Promise.allSettled([
            checkWithSnopes(claim),
            checkWithFactCheckOrg(claim),
            checkWithPolitiFact(claim),
            checkWithNewsAPI(claim),
            checkWithGoogleFactCheck(claim)
        ]);
        
        // Process results
        const validResults = factCheckResults
            .filter(result => result.status === 'fulfilled' && result.value)
            .map(result => result.value);
        
        if (validResults.length > 0) {
            // Aggregate multiple fact-check results
            return aggregateFactCheckResults(validResults, claim);
        }
        
        // If no external sources return data, try a general web search
        return await performGeneralFactCheck(claim);
        
    } catch (error) {
        console.error('Error in fact verification:', error);
        return {
            verdict: 'unverified',
            explanation: 'Unable to verify claim due to technical issues.',
            confidence: 30
        };
    }
}

/**
 * Check claim against Snopes fact-checking database
 */
async function checkWithSnopes(claim) {
    // Note: Snopes doesn't have a public API, but you could web scrape or use third-party services
    // For now, implementing search-based verification
    return await searchBasedFactCheck(claim, 'snopes.com');
}

/**
 * Check claim with FactCheck.org
 */
async function checkWithFactCheckOrg(claim) {
    return await searchBasedFactCheck(claim, 'factcheck.org');
}

/**
 * Check claim with PolitiFact
 */
async function checkWithPolitiFact(claim) {
    return await searchBasedFactCheck(claim, 'politifact.com');
}

/**
 * Use NewsAPI to find recent articles about the claim
 */
async function checkWithNewsAPI(claim) {
    const API_KEY = process.env.NEWSAPI_KEY;
    if (!API_KEY) {
        console.log('NewsAPI key not configured');
        return null;
    }
    
    try {
        const query = encodeURIComponent(claim.substring(0, 100)); // Limit query length
        const apiUrl = `https://newsapi.org/v2/everything?q=${query}&sortBy=relevancy&language=en&apiKey=${API_KEY}`;
        
        const response = await httpRequest(apiUrl);
        const data = JSON.parse(response);
        
        if (data.articles && data.articles.length > 0) {
            // Analyze article titles and descriptions for fact-checking keywords
            const articles = data.articles.slice(0, 5);
            const factCheckKeywords = ['debunk', 'false', 'true', 'fact-check', 'verify', 'misleading', 'accurate'];
            
            const relevantArticles = articles.filter(article => {
                const text = (article.title + ' ' + article.description).toLowerCase();
                return factCheckKeywords.some(keyword => text.includes(keyword));
            });
            
            if (relevantArticles.length > 0) {
                // Analyze sentiment and fact-checking language
                return analyzeNewsArticles(relevantArticles, claim);
            }
        }
        
        return null;
    } catch (error) {
        console.error('NewsAPI error:', error);
        return null;
    }
}

/**
 * Search-based fact checking using Google Custom Search
 */
async function searchBasedFactCheck(claim, site) {
    const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
    const SEARCH_ENGINE_ID = process.env.GOOGLE_SEARCH_ENGINE_ID;
    
    if (!GOOGLE_API_KEY || !SEARCH_ENGINE_ID) {
        console.log('Google Search API not configured');
        return null;
    }
    
    try {
        const query = encodeURIComponent(`"${claim}" site:${site}`);
        const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${SEARCH_ENGINE_ID}&q=${query}`;
        
        const response = await httpRequest(searchUrl);
        const data = JSON.parse(response);
        
        if (data.items && data.items.length > 0) {
            return analyzeSearchResults(data.items, claim, site);
        }
        
        return null;
    } catch (error) {
        console.error(`Search error for ${site}:`, error);
        return null;
    }
}

/**
 * Analyze news articles for fact-checking information
 */
function analyzeNewsArticles(articles, claim) {
    const positiveWords = ['true', 'accurate', 'confirmed', 'verified', 'correct'];
    const negativeWords = ['false', 'misleading', 'debunked', 'incorrect', 'wrong'];
    const uncertainWords = ['disputed', 'unclear', 'unverified', 'questionable'];
    
    let positiveScore = 0;
    let negativeScore = 0;
    let uncertainScore = 0;
    
    articles.forEach(article => {
        const text = (article.title + ' ' + article.description).toLowerCase();
        
        positiveWords.forEach(word => {
            if (text.includes(word)) positiveScore++;
        });
        
        negativeWords.forEach(word => {
            if (text.includes(word)) negativeScore++;
        });
        
        uncertainWords.forEach(word => {
            if (text.includes(word)) uncertainScore++;
        });
    });
    
    const totalScore = positiveScore + negativeScore + uncertainScore;
    if (totalScore === 0) return null;
    
    if (positiveScore > negativeScore && positiveScore > uncertainScore) {
        return {
            verdict: 'true',
            explanation: `News sources suggest this claim is likely accurate.`,
            confidence: Math.min(90, 60 + (positiveScore * 10)),
            sources: articles.map(a => a.url)
        };
    } else if (negativeScore > positiveScore && negativeScore > uncertainScore) {
        return {
            verdict: 'false',
            explanation: `News sources suggest this claim is likely false or misleading.`,
            confidence: Math.min(90, 60 + (negativeScore * 10)),
            sources: articles.map(a => a.url)
        };
    } else {
        return {
            verdict: 'disputed',
            explanation: `Sources show mixed or disputed information about this claim.`,
            confidence: 60,
            sources: articles.map(a => a.url)
        };
    }
}

/**
 * Analyze search results from fact-checking sites
 */
function analyzeSearchResults(items, claim, site) {
    // Look for fact-checking language in snippets
    const factCheckLanguage = {
        'true': ['true', 'accurate', 'correct', 'confirmed'],
        'false': ['false', 'misleading', 'incorrect', 'debunked'],
        'disputed': ['disputed', 'mixed', 'partly true', 'partly false']
    };
    
    let bestMatch = null;
    let highestRelevance = 0;
    
    items.forEach(item => {
        const snippet = item.snippet.toLowerCase();
        
        // Calculate relevance based on claim keywords
        const claimWords = claim.toLowerCase().split(' ');
        const relevance = claimWords.filter(word => snippet.includes(word)).length / claimWords.length;
        
        if (relevance > highestRelevance) {
            highestRelevance = relevance;
            
            // Determine verdict from snippet
            for (const [verdict, keywords] of Object.entries(factCheckLanguage)) {
                if (keywords.some(keyword => snippet.includes(keyword))) {
                    bestMatch = {
                        verdict,
                        explanation: `${site} analysis: ${item.snippet}`,
                        confidence: Math.round(relevance * 80 + 20),
                        source: item.link
                    };
                    break;
                }
            }
        }
    });
    
    return bestMatch;
}

/**
 * Use Google Search to find fact-checking information from multiple sources
 */
async function checkWithGoogleFactCheck(claim) {
    const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
    const SEARCH_ENGINE_ID = process.env.GOOGLE_SEARCH_ENGINE_ID;
    
    if (!GOOGLE_API_KEY || !SEARCH_ENGINE_ID) {
        console.log('Google Search API not configured');
        return null;
    }
    
    try {
        // Search for fact-checks of this specific claim
        const query = encodeURIComponent(`"${claim}" fact check OR debunk OR verify OR false OR true`);
        const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${SEARCH_ENGINE_ID}&q=${query}`;
        
        const response = await httpRequest(searchUrl);
        const data = JSON.parse(response);
        
        if (data.items && data.items.length > 0) {
            return analyzeFactCheckSearchResults(data.items, claim);
        }
        
        return null;
    } catch (error) {
        console.error('Google fact-check search error:', error);
        return null;
    }
}

/**
 * Analyze fact-check search results to determine verdict
 */
function analyzeFactCheckSearchResults(items, claim) {
    const factCheckKeywords = {
        'true': ['true', 'accurate', 'correct', 'confirmed', 'verified', 'factual'],
        'false': ['false', 'misleading', 'incorrect', 'debunked', 'wrong', 'myth', 'hoax'],
        'disputed': ['disputed', 'mixed', 'partly true', 'partly false', 'unclear', 'unproven']
    };
    
    let verdictScores = { true: 0, false: 0, disputed: 0 };
    let bestExplanation = '';
    let sources = [];
    
    items.forEach(item => {
        const text = (item.title + ' ' + item.snippet).toLowerCase();
        sources.push(item.link);
        
        // Score based on fact-checking keywords
        for (const [verdict, keywords] of Object.entries(factCheckKeywords)) {
            const score = keywords.filter(keyword => text.includes(keyword)).length;
            verdictScores[verdict] += score;
            
            if (score > 0 && !bestExplanation) {
                bestExplanation = item.snippet;
            }
        }
    });
    
    // Determine the verdict with highest score
    const topVerdict = Object.keys(verdictScores).reduce((a, b) => 
        verdictScores[a] > verdictScores[b] ? a : b
    );
    
    const totalScore = Object.values(verdictScores).reduce((a, b) => a + b, 0);
    
    if (totalScore === 0) {
        return {
            verdict: 'unverified',
            explanation: 'No clear fact-checking information found in search results.',
            confidence: 30,
            sources: sources.slice(0, 3)
        };
    }
    
    const confidence = Math.min(90, 50 + (verdictScores[topVerdict] / totalScore) * 40);
    
    return {
        verdict: topVerdict,
        explanation: bestExplanation || `Search results suggest this claim is ${topVerdict}.`,
        confidence: Math.round(confidence),
        sources: sources.slice(0, 3)
    };
}

/**
 * Aggregate multiple fact-check results
 */
function aggregateFactCheckResults(results, claim) {
    if (results.length === 1) {
        return results[0];
    }
    
    // Count verdicts
    const verdictCounts = {};
    let totalConfidence = 0;
    let allSources = [];
    
    results.forEach(result => {
        verdictCounts[result.verdict] = (verdictCounts[result.verdict] || 0) + 1;
        totalConfidence += result.confidence;
        if (result.sources) {
            allSources = allSources.concat(result.sources);
        }
        if (result.source) {
            allSources.push(result.source);
        }
    });
    
    // Find most common verdict
    const mostCommonVerdict = Object.keys(verdictCounts).reduce((a, b) => 
        verdictCounts[a] > verdictCounts[b] ? a : b
    );
    
    const averageConfidence = Math.round(totalConfidence / results.length);
    
    return {
        verdict: mostCommonVerdict,
        explanation: `Multiple fact-checking sources analyzed. ${verdictCounts[mostCommonVerdict]} sources indicate: ${mostCommonVerdict}.`,
        confidence: averageConfidence,
        sources: [...new Set(allSources)], // Remove duplicates
        aggregated: true,
        sourceCount: results.length
    };
}

/**
 * HTTP request helper function
 */
function httpRequest(url) {
    return new Promise((resolve, reject) => {
        const urlParts = new URL(url);
        const options = {
            hostname: urlParts.hostname,
            port: urlParts.port || 443,
            path: urlParts.pathname + urlParts.search,
            method: 'GET',
            headers: {
                'User-Agent': 'r-factchecker/1.0'
            }
        };
        
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                resolve(data);
            });
        });
        
        req.on('error', (error) => {
            reject(error);
        });
        
        req.setTimeout(10000, () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });
        
        req.end();
    });
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
 * Find relevant sources for verification using real APIs
 */
async function findRelevantSources(content) {
    const sources = [];
    
    try {
        // Use NewsAPI to find recent relevant articles
        const newsResults = await searchNewsForSources(content);
        if (newsResults) {
            sources.push(...newsResults);
        }
        
        // Add authoritative fact-checking sources
        const factCheckSources = await searchFactCheckSources(content);
        if (factCheckSources) {
            sources.push(...factCheckSources);
        }
        
        // Add academic sources if available
        const academicSources = await searchAcademicSources(content);
        if (academicSources) {
            sources.push(...academicSources);
        }
        
    } catch (error) {
        console.error('Error finding sources:', error);
    }
    
    // Fallback to default authoritative sources if no specific sources found
    if (sources.length === 0) {
        sources.push(
            {
                title: 'Snopes Fact-Checking',
                url: 'https://www.snopes.com',
                credibility: 95,
                date: new Date(),
                excerpt: 'Comprehensive fact-checking database for claims and rumors'
            },
            {
                title: 'FactCheck.org',
                url: 'https://www.factcheck.org',
                credibility: 95,
                date: new Date(),
                excerpt: 'Nonpartisan fact-checking service from University of Pennsylvania'
            }
        );
    }
    
    return sources.slice(0, 5); // Limit to 5 sources
}

/**
 * Search for news sources using NewsAPI
 */
async function searchNewsForSources(content) {
    const API_KEY = process.env.NEWSAPI_KEY;
    if (!API_KEY) return null;
    
    try {
        const query = encodeURIComponent(content.substring(0, 100));
        const apiUrl = `https://newsapi.org/v2/everything?q=${query}&sortBy=relevancy&language=en&apiKey=${API_KEY}&pageSize=5`;
        
        const response = await httpRequest(apiUrl);
        const data = JSON.parse(response);
        
        if (data.articles) {
            return data.articles.map(article => ({
                title: article.title,
                url: article.url,
                credibility: calculateDomainCredibility(article.source.name),
                date: new Date(article.publishedAt),
                excerpt: article.description || 'Recent news coverage of related topics'
            }));
        }
    } catch (error) {
        console.error('NewsAPI search error:', error);
    }
    
    return null;
}

/**
 * Search fact-checking sources
 */
async function searchFactCheckSources(content) {
    const factCheckSites = [
        { name: 'Snopes', domain: 'snopes.com', credibility: 95 },
        { name: 'FactCheck.org', domain: 'factcheck.org', credibility: 95 },
        { name: 'PolitiFact', domain: 'politifact.com', credibility: 90 },
        { name: 'AP Fact Check', domain: 'apnews.com', credibility: 95 }
    ];
    
    const sources = [];
    
    for (const site of factCheckSites) {
        try {
            const result = await searchBasedFactCheck(content, site.domain);
            if (result && result.source) {
                sources.push({
                    title: `${site.name} Fact Check`,
                    url: result.source,
                    credibility: site.credibility,
                    date: new Date(),
                    excerpt: result.explanation
                });
            }
        } catch (error) {
            console.error(`Error searching ${site.name}:`, error);
        }
    }
    
    return sources.length > 0 ? sources : null;
}

/**
 * Search academic sources using Google Scholar-style search
 */
async function searchAcademicSources(content) {
    const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
    const SEARCH_ENGINE_ID = process.env.GOOGLE_SEARCH_ENGINE_ID;
    
    if (!GOOGLE_API_KEY || !SEARCH_ENGINE_ID) return null;
    
    try {
        // Search for academic articles and research papers
        const query = encodeURIComponent(`"${content.substring(0, 80)}" site:scholar.google.com OR site:pubmed.ncbi.nlm.nih.gov OR site:arxiv.org OR site:researchgate.net`);
        const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${SEARCH_ENGINE_ID}&q=${query}&num=5`;
        
        const response = await httpRequest(searchUrl);
        const data = JSON.parse(response);
        
        if (data.items && data.items.length > 0) {
            return data.items.map(item => ({
                title: item.title,
                url: item.link,
                credibility: 90, // Academic sources have high credibility
                date: new Date(),
                excerpt: item.snippet || 'Academic research related to this topic'
            }));
        }
    } catch (error) {
        console.error('Academic search error:', error);
    }
    
    return null;
}

/**
 * Calculate domain credibility based on source name
 */
function calculateDomainCredibility(sourceName) {
    const highCredibility = ['Reuters', 'Associated Press', 'BBC', 'NPR'];
    const mediumCredibility = ['CNN', 'Fox News', 'NBC', 'CBS', 'ABC'];
    
    if (highCredibility.some(source => sourceName.includes(source))) {
        return 90;
    }
    if (mediumCredibility.some(source => sourceName.includes(source))) {
        return 75;
    }
    return 60; // Default credibility
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

/**
 * Perform general fact-checking using web search when specific fact-check sources don't have info
 */
async function performGeneralFactCheck(claim) {
    const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
    const SEARCH_ENGINE_ID = process.env.GOOGLE_SEARCH_ENGINE_ID;
    
    if (!GOOGLE_API_KEY || !SEARCH_ENGINE_ID) {
        console.log('Google Search API not configured for general fact-check');
        return {
            verdict: 'unverified',
            explanation: 'Unable to verify claim - external APIs not configured.',
            confidence: 20
        };
    }
    
    try {
        // Search for general information about the claim
        const query = encodeURIComponent(`"${claim.substring(0, 80)}"`);
        const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${SEARCH_ENGINE_ID}&q=${query}&num=10`;
        
        const response = await httpRequest(searchUrl);
        const data = JSON.parse(response);
        
        if (data.items && data.items.length > 0) {
            return analyzeGeneralSearchResults(data.items, claim);
        }
        
        return {
            verdict: 'unverified',
            explanation: 'No relevant information found to verify this claim.',
            confidence: 25
        };
        
    } catch (error) {
        console.error('General fact-check error:', error);
        return {
            verdict: 'unverified',
            explanation: 'Unable to verify claim due to search error.',
            confidence: 20
        };
    }
}

/**
 * Analyze general search results to assess claim credibility
 */
function analyzeGeneralSearchResults(items, claim) {
    const credibleDomains = [
        'reuters.com', 'apnews.com', 'bbc.com', 'npr.org', 'pbs.org',
        'snopes.com', 'factcheck.org', 'politifact.com', 'washingtonpost.com',
        'nytimes.com', 'cnn.com', 'nbcnews.com', 'abcnews.go.com',
        'nasa.gov', 'nih.gov', 'cdc.gov', 'who.int', 'nature.com',
        'science.org', 'sciencemag.org', 'wikipedia.org'
    ];
    
    const supportingKeywords = ['confirmed', 'verified', 'true', 'accurate', 'study shows', 'research indicates'];
    const contradictingKeywords = ['false', 'debunked', 'myth', 'hoax', 'misleading', 'incorrect', 'disproven'];
    const uncertainKeywords = ['disputed', 'controversial', 'unclear', 'unproven', 'claims', 'alleged'];
    
    let credibleSources = 0;
    let supportingScore = 0;
    let contradictingScore = 0;
    let uncertainScore = 0;
    let sources = [];
    let bestExplanation = '';
    
    items.forEach(item => {
        const domain = new URL(item.link).hostname.toLowerCase();
        const text = (item.title + ' ' + item.snippet).toLowerCase();
        
        // Weight by source credibility
        const isCredible = credibleDomains.some(d => domain.includes(d));
        const weight = isCredible ? 2 : 1;
        
        if (isCredible) credibleSources++;
        sources.push(item.link);
        
        if (!bestExplanation && item.snippet.length > 50) {
            bestExplanation = item.snippet;
        }
        
        // Score based on keywords
        supportingKeywords.forEach(keyword => {
            if (text.includes(keyword)) supportingScore += weight;
        });
        
        contradictingKeywords.forEach(keyword => {
            if (text.includes(keyword)) contradictingScore += weight;
        });
        
        uncertainKeywords.forEach(keyword => {
            if (text.includes(keyword)) uncertainScore += weight;
        });
    });
    
    const totalScore = supportingScore + contradictingScore + uncertainScore;
    
    if (totalScore === 0) {
        return {
            verdict: 'unverified',
            explanation: 'Insufficient information found to verify this claim.',
            confidence: 30,
            sources: sources.slice(0, 3)
        };
    }
    
    // Determine verdict based on scores
    let verdict, confidence, explanation;
    
    if (contradictingScore > supportingScore && contradictingScore > uncertainScore) {
        verdict = 'false';
        confidence = Math.min(85, 40 + (contradictingScore / totalScore) * 45);
        explanation = bestExplanation || 'Multiple sources suggest this claim is false or misleading.';
    } else if (supportingScore > contradictingScore && supportingScore > uncertainScore) {
        verdict = 'true';
        confidence = Math.min(85, 40 + (supportingScore / totalScore) * 45);
        explanation = bestExplanation || 'Multiple sources support this claim.';
    } else {
        verdict = 'disputed';
        confidence = Math.min(70, 30 + (uncertainScore / totalScore) * 40);
        explanation = bestExplanation || 'Sources show mixed or disputed information about this claim.';
    }
    
    // Boost confidence if we have credible sources
    if (credibleSources > 0) {
        confidence = Math.min(90, confidence + (credibleSources * 5));
    }
    
    return {
        verdict,
        explanation,
        confidence: Math.round(confidence),
        sources: sources.slice(0, 5),
        credibleSources
    };
}
