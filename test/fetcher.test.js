/**
 * Tests for fetcher.js
 */

const nock = require('nock');
const { fetchHtml, searchDuckDuckGoHtml } = require('../src/fetcher');

describe('fetcher', () => {
  beforeEach(() => {
    nock.cleanAll();
  });

  afterEach(() => {
    nock.cleanAll();
  });

  describe('fetchHtml', () => {
    it('should fetch HTML content successfully', async () => {
      const mockHtml = '<html><body>Test</body></html>';
      
      nock('https://example.com')
        .get('/test')
        .reply(200, mockHtml);

      const result = await fetchHtml('https://example.com/test', {
        userAgent: 'test-agent',
        checkRobots: false
      });

      expect(result).toBe(mockHtml);
    });

    it('should handle HTTP errors', async () => {
      nock('https://example.com')
        .get('/error')
        .reply(404, 'Not Found');

      await expect(
        fetchHtml('https://example.com/error', { checkRobots: false })
      ).rejects.toThrow();
    });

    it('should respect timeout', async () => {
      nock('https://example.com')
        .get('/slow')
        .delayConnection(2000)
        .reply(200, 'OK');

      await expect(
        fetchHtml('https://example.com/slow', {
          timeout: 500,
          checkRobots: false
        })
      ).rejects.toThrow();
    });

    it('should retry on failure', async () => {
      nock('https://example.com')
        .get('/retry')
        .reply(500, 'Error')
        .get('/retry')
        .reply(200, '<html>Success</html>');

      const result = await fetchHtml('https://example.com/retry', {
        retries: 1,
        checkRobots: false
      });

      expect(result).toBe('<html>Success</html>');
    });

    it('should include user agent header', async () => {
      const customUA = 'custom-user-agent/1.0';
      
      nock('https://example.com', {
        reqheaders: {
          'user-agent': customUA
        }
      })
        .get('/test')
        .reply(200, '<html></html>');

      await fetchHtml('https://example.com/test', {
        userAgent: customUA,
        checkRobots: false
      });

      expect(nock.isDone()).toBe(true);
    });
  });

  describe('searchDuckDuckGoHtml', () => {
    it('should fetch DuckDuckGo search results', async () => {
      const mockHtml = '<html><body><div class="result">Test</div></body></html>';
      
      nock('https://html.duckduckgo.com')
        .get('/html/')
        .query({ q: 'test query' })
        .reply(200, mockHtml);

      const result = await searchDuckDuckGoHtml('test query', {
        checkRobots: false
      });

      expect(result).toBe(mockHtml);
    });

    it('should URL encode query parameters', async () => {
      nock('https://html.duckduckgo.com')
        .get('/html/')
        .query({ q: 'test+query+with+spaces' })
        .reply(200, '<html></html>');

      await searchDuckDuckGoHtml('test query with spaces', {
        checkRobots: false
      });

      expect(nock.isDone()).toBe(true);
    });
  });
});

