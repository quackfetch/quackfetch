# quackfetch

A modular, testable, and well-documented Node.js library for searching DuckDuckGo with normalized JSON results. quackfetch provides a clean API, CLI tool, and example HTTP server for DuckDuckGo search functionality.

## Features

- 🔍 **DuckDuckGo Search Integration** - Uses DuckDuckGo HTML search as backend
- 📦 **Modular Architecture** - Clean separation of concerns (fetcher, parser, cache)
- ⚡ **Rate Limiting** - Configurable rate limiting (default: 1 request/second)
- 💾 **LRU Cache** - Built-in caching with TTL (default: 5 minutes)
- 🤖 **Robots.txt Compliance** - Respects robots.txt conventions
- 🧪 **Fully Tested** - Comprehensive test suite with HTTP mocking
- 🛠️ **CLI Tool** - Command-line interface for quick searches
- 🌐 **HTTP Server Example** - Express-based API server included
- 📝 **Well Documented** - JSDoc comments and comprehensive README

## Installation

```bash
npm install quackfetch
```

Or clone the repository:

```bash
git clone https://github.com/quackfetch/quackfetch.git
cd quackfetch
npm install
```

## Quick Start

### As a Library

```javascript
const { search } = require('quackfetch');

async function example() {
  const results = await search('node.js tutorial', {
    max: 5,
    useCache: true
  });

  results.forEach(result => {
    console.log(`${result.title}: ${result.url}`);
  });
}

example();
```

### CLI Usage

```bash
# Basic search
quackfetch "node.js tutorial"

# Limit results
quackfetch "python" --max 5

# Disable caching
quackfetch "javascript" --no-cache

# Custom rate limit
quackfetch "react" --rate-limit 2000
```

### HTTP Server Example

Start the example server:

```bash
npm run start-example
```

Then make requests:

```bash
# GET request
curl "http://localhost:3000/search?q=node.js&max=5"

# POST request
curl -X POST http://localhost:3000/search \
  -H "Content-Type: application/json" \
  -d '{"query": "node.js", "max": 5}'
```

## API Reference

### `search(query, options)`

Main search function that queries DuckDuckGo and returns normalized results.

**Parameters:**

- `query` (string, required) - Search query string
- `options` (object, optional) - Configuration options:
  - `max` (number) - Maximum number of results (default: 10)
  - `cacheTTL` (number) - Cache TTL in milliseconds (default: 300000 = 5 minutes)
  - `cacheSize` (number) - Maximum cache size (default: 100)
  - `userAgent` (string) - User agent string (default: `quackfetch/0.1 (+https://github.com/your-repo/quackfetch)`)
  - `rateLimit` (number) - Rate limit in milliseconds (default: 1000)
  - `useCache` (boolean) - Enable caching (default: true)

**Returns:** `Promise<Array<Object>>` - Array of search result objects

**Result Object Schema:**

```javascript
{
  title: string,        // Result title
  url: string,          // Normalized URL (tracking parameters removed)
  snippet: string,       // Result snippet/description
  rank: number,         // Result rank (1-based)
  source: string,       // Source domain
  retrievedAt: string,  // ISO timestamp
  cached?: boolean      // Present if result was served from cache
}
```

**Example:**

```javascript
const results = await search('web development', {
  max: 10,
  rateLimit: 2000,
  useCache: true
});
```

### `clearCache()`

Clears the default cache instance.

```javascript
const { search, clearCache } = require('quackfetch');
clearCache();
```

### `getCacheStats()`

Returns cache statistics.

```javascript
const { getCacheStats } = require('quackfetch');
const stats = getCacheStats();
console.log(stats);
// { size: 5, calculatedSize: 5, maxSize: 100, ttl: 300000 }
```

## Project Structure

```
quackfetch/
├── src/
│   ├── index.js           # Main API entry point
│   ├── fetcher.js         # HTTP fetching with rate limiting
│   ├── parser.js          # HTML parsing for DuckDuckGo results
│   ├── cache.js           # LRU cache implementation
│   ├── utils.js           # Utility functions (URL normalization, robots.txt)
│   └── server-example.js  # Express example server
├── bin/
│   └── quackfetch         # CLI executable
├── test/
│   ├── fetcher.test.js    # Fetcher tests
│   ├── parser.test.js     # Parser tests
│   └── integration.test.js # Integration tests
├── examples/
│   └── simple-usage.js    # Usage example
└── .github/
    └── workflows/
        └── ci.yml         # CI/CD workflow
```

## Development

### Running Tests

```bash
npm test
```

### Linting

```bash
npm run lint
```

### Running Examples

```bash
# Simple usage example
npm run example

# Start HTTP server
npm run start-example
```

## Legal and Ethical Considerations

⚠️ **Important:** Please use quackfetch responsibly and in accordance with DuckDuckGo's Terms of Service:

1. **Rate Limiting**: The default rate limit is 1 request per second. Do not modify this to make excessive requests.

2. **User Agent**: Always use a descriptive user agent that identifies your application.

3. **Robots.txt**: quackfetch checks robots.txt by default. Respect any restrictions.

4. **Terms of Service**: Review and comply with DuckDuckGo's Terms of Service before using this library.

5. **Personal Use**: This library is intended for personal use and educational purposes. For commercial use, consider using official APIs.

6. **No Scraping**: Do not use this library to scrape large amounts of data or create competing services.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Acknowledgments

- DuckDuckGo for providing a privacy-focused search engine
- All contributors and users of this project

## Support

For issues, questions, or contributions, please open an issue on GitHub.

---

**Note**: This project is not affiliated with DuckDuckGo. Use responsibly and in accordance with applicable terms of service and laws.

