/**
 * Integration tests for quackfetch search functionality
 */

const nock = require('nock');
const { search, clearCache } = require('../src/index');

describe('integration', () => {
  beforeEach(() => {
    clearCache();
    nock.cleanAll();
  });

  afterEach(() => {
    clearCache();
    nock.cleanAll();
  });

  describe('search', () => {
    it('should perform end-to-end search', async () => {
      const mockHtml = `
        <html>
          <body>
            <div class="result">
              <a class="result__a" href="/l/?uddg=https%3A%2F%2Fexample.com">Example Site</a>
              <a class="result__snippet">This is an example website with useful information.</a>
              <span class="result__url">example.com</span>
            </div>
            <div class="result">
              <a class="result__a" href="/l/?uddg=https%3A%2F%2Ftest.com">Test Site</a>
              <a class="result__snippet">Another test website for demonstration.</a>
            </div>
          </body>
        </html>
      `;

      nock('https://html.duckduckgo.com')
        .get('/html/')
        .query({ q: 'test query' })
        .reply(200, mockHtml);

      const results = await search('test query', {
        max: 10,
        useCache: false,
        checkRobots: false
      });

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      
      const firstResult = results[0];
      expect(firstResult).toHaveProperty('title');
      expect(firstResult).toHaveProperty('url');
      expect(firstResult).toHaveProperty('snippet');
      expect(firstResult).toHaveProperty('rank');
      expect(firstResult).toHaveProperty('source');
      expect(firstResult).toHaveProperty('retrievedAt');
    });

    it('should validate query input', async () => {
      await expect(search('')).rejects.toThrow();
      await expect(search(null)).rejects.toThrow();
      await expect(search(undefined)).rejects.toThrow();
    });

    it('should respect max results option', async () => {
      const mockHtml = Array(20).fill(`
        <div class="result">
          <a class="result__a" href="https://example.com">Title</a>
          <a class="result__snippet">Snippet</a>
        </div>
      `).join('');

      nock('https://html.duckduckgo.com')
        .get('/html/')
        .query(true)
        .reply(200, `<html><body>${mockHtml}</body></html>`);

      const results = await search('test', {
        max: 5,
        useCache: false,
        checkRobots: false
      });

      expect(results.length).toBeLessThanOrEqual(5);
    });

    it('should cache results when enabled', async () => {
      const mockHtml = `
        <div class="result">
          <a class="result__a" href="https://example.com">Title</a>
          <a class="result__snippet">Snippet</a>
        </div>
      `;

      const scope = nock('https://html.duckduckgo.com')
        .get('/html/')
        .query({ q: 'cached query' })
        .reply(200, `<html><body>${mockHtml}</body></html>`);

      // First search - should fetch
      const results1 = await search('cached query', {
        max: 10,
        useCache: true,
        cacheTTL: 60000,
        checkRobots: false
      });

      // Second search - should use cache (no additional HTTP request)
      const results2 = await search('cached query', {
        max: 10,
        useCache: true,
        cacheTTL: 60000,
        checkRobots: false
      });

      expect(results1.length).toBeGreaterThan(0);
      expect(results2.length).toBe(results1.length);
      expect(results2[0].cached).toBe(true);
      
      // Verify only one HTTP request was made
      expect(scope.isDone()).toBe(true);
    });

    it('should handle search errors gracefully', async () => {
      nock('https://html.duckduckgo.com')
        .get('/html/')
        .query(true)
        .reply(500, 'Server Error');

      await expect(
        search('test', {
          useCache: false,
          checkRobots: false,
          retries: 0
        })
      ).rejects.toThrow();
    });
  });
});

