/**
 * Example Express server for quackfetch search API
 * This is a simple demonstration server - not production-ready
 */

const express = require('express');
const { search } = require('./index');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Parse JSON bodies
app.use(express.json());

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'quackfetch' });
});

/**
 * Search endpoint
 * GET /search?q=query&max=10
 */
app.get('/search', async (req, res) => {
  const query = req.query.q;
  const max = parseInt(req.query.max, 10) || 10;
  const rateLimit = parseInt(req.query.rateLimit, 10) || 1000;
  const useCache = req.query.cache !== 'false';

  if (!query || query.trim().length === 0) {
    return res.status(400).json({
      error: 'Query parameter "q" is required'
    });
  }

  // Validate max parameter
  if (max < 1 || max > 50) {
    return res.status(400).json({
      error: 'Max parameter must be between 1 and 50'
    });
  }

  try {
    const results = await search(query, {
      max,
      rateLimit,
      useCache
    });

    res.json({
      query,
      results,
      count: results.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      error: 'Search failed',
      message: error.message
    });
  }
});

/**
 * POST endpoint for search (alternative to GET)
 * POST /search with body: { query: "...", max: 10 }
 */
app.post('/search', async (req, res) => {
  const { query, max = 10, rateLimit = 1000, useCache = true } = req.body;

  if (!query || typeof query !== 'string' || query.trim().length === 0) {
    return res.status(400).json({
      error: 'Query is required in request body'
    });
  }

  try {
    const results = await search(query, {
      max: Math.min(max, 50),
      rateLimit,
      useCache
    });

    res.json({
      query,
      results,
      count: results.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      error: 'Search failed',
      message: error.message
    });
  }
});

// Start server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`quackfetch server running on http://localhost:${PORT}`);
    console.log(`Try: http://localhost:${PORT}/search?q=node.js`);
  });
}

module.exports = app;

