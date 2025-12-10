/**
 * HTML parser for DuckDuckGo search results
 */

const cheerio = require('cheerio');
const { normalizeUrl } = require('./utils');

/**
 * Parses DuckDuckGo HTML search results into structured JSON
 * @param {string} html - HTML content from DuckDuckGo search page
 * @param {Object} options - Parser options
 * @param {number} options.maxResults - Maximum number of results to return (default: 10)
 * @returns {Array<Object>} - Array of search result objects
 */
function parseSearchHtml(html, options = {}) {
  const { maxResults = 10 } = options;

  if (!html || typeof html !== 'string') {
    return [];
  }

  const $ = cheerio.load(html);
  const results = [];

  // DuckDuckGo HTML structure: results are in div.result or div.web-result
  // Each result contains: title (a.result__a), snippet (a.result__snippet), URL (a.result__a href)
  $('div.result, div.web-result').each((index, element) => {
    if (results.length >= maxResults) {
      return false; // Break loop
    }

    const $result = $(element);
    
    // Extract title and URL from the main link
    const $link = $result.find('a.result__a, a.result-link');
    const title = $link.text().trim();
    const rawUrl = $link.attr('href') || '';

    // DuckDuckGo uses redirect URLs, try to extract real URL
    let url = rawUrl;
    if (rawUrl.startsWith('/l/?uddg=')) {
      // Extract URL from DuckDuckGo redirect
      try {
        const decoded = decodeURIComponent(rawUrl.split('uddg=')[1]);
        url = decoded;
      } catch (e) {
        // If decoding fails, try alternative parsing
        const match = rawUrl.match(/uddg=([^&]+)/);
        if (match) {
          try {
            url = decodeURIComponent(match[1]);
          } catch (e2) {
            url = rawUrl;
          }
        }
      }
    } else if (rawUrl.startsWith('/l/?kh=')) {
      // Alternative redirect format
      const match = rawUrl.match(/uddg=([^&]+)/);
      if (match) {
        try {
          url = decodeURIComponent(match[1]);
        } catch (e) {
          url = rawUrl;
        }
      }
    }

    // Extract snippet
    const snippet = $result.find('a.result__snippet, div.result__snippet').text().trim() ||
                    $result.find('span.result__snippet').text().trim() ||
                    '';

    // Extract source/domain
    const source = $result.find('span.result__url, a.result__url').text().trim() ||
                   extractDomain(url);

    // Only add result if we have at least a title or URL
    if (title || url) {
      const normalizedUrl = normalizeUrl(url);
      
      results.push({
        title: title || 'Untitled',
        url: normalizedUrl,
        snippet: snippet || '',
        rank: results.length + 1,
        source: source || extractDomain(normalizedUrl),
        retrievedAt: new Date().toISOString()
      });
    }
  });

  // Fallback: try alternative selectors if no results found
  if (results.length === 0) {
    $('div[class*="result"]').each((index, element) => {
      if (results.length >= maxResults) {
        return false;
      }

      const $result = $(element);
      const $link = $result.find('a').first();
      const title = $link.text().trim();
      const url = $link.attr('href') || '';
      const snippet = $result.text().trim().replace(title, '').trim();

      if (title || url) {
        results.push({
          title: title || 'Untitled',
          url: normalizeUrl(url),
          snippet: snippet.substring(0, 200),
          rank: results.length + 1,
          source: extractDomain(url),
          retrievedAt: new Date().toISOString()
        });
      }
    });
  }

  return results;
}

/**
 * Extracts domain from a URL
 * @param {string} url - URL string
 * @returns {string} - Domain name or empty string
 */
function extractDomain(url) {
  if (!url) {
    return '';
  }

  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace(/^www\./, '');
  } catch (error) {
    // Try simple regex extraction
    const match = url.match(/https?:\/\/([^\/]+)/);
    return match ? match[1].replace(/^www\./, '') : '';
  }
}

module.exports = {
  parseSearchHtml,
  extractDomain
};

