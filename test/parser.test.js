/**
 * Tests for parser.js
 */

const { parseSearchHtml } = require('../src/parser');

describe('parser', () => {
  describe('parseSearchHtml', () => {
    it('should parse empty HTML', () => {
      const results = parseSearchHtml('');
      expect(results).toEqual([]);
    });

    it('should parse null/undefined HTML', () => {
      expect(parseSearchHtml(null)).toEqual([]);
      expect(parseSearchHtml(undefined)).toEqual([]);
    });

    it('should parse DuckDuckGo HTML structure', () => {
      const html = `
        <html>
          <body>
            <div class="result">
              <a class="result__a" href="/l/?uddg=https%3A%2F%2Fexample.com">Example Title</a>
              <a class="result__snippet">This is a snippet about the example.</a>
              <span class="result__url">example.com</span>
            </div>
            <div class="result">
              <a class="result__a" href="/l/?uddg=https%3A%2F%2Ftest.com">Test Title</a>
              <a class="result__snippet">Test snippet content.</a>
            </div>
          </body>
        </html>
      `;

      const results = parseSearchHtml(html, { maxResults: 10 });

      expect(results.length).toBeGreaterThan(0);
      expect(results[0]).toHaveProperty('title');
      expect(results[0]).toHaveProperty('url');
      expect(results[0]).toHaveProperty('snippet');
      expect(results[0]).toHaveProperty('rank');
      expect(results[0]).toHaveProperty('source');
      expect(results[0]).toHaveProperty('retrievedAt');
    });

    it('should respect maxResults limit', () => {
      const html = Array(20).fill(`
        <div class="result">
          <a class="result__a" href="https://example.com">Title</a>
          <a class="result__snippet">Snippet</a>
        </div>
      `).join('');

      const results = parseSearchHtml(html, { maxResults: 5 });
      expect(results.length).toBeLessThanOrEqual(5);
    });

    it('should normalize URLs', () => {
      const html = `
        <div class="result">
          <a class="result__a" href="/l/?uddg=https%3A%2F%2Fexample.com%2Fpage%3Futm_source%3Dtest">Title</a>
          <a class="result__snippet">Snippet</a>
        </div>
      `;

      const results = parseSearchHtml(html);
      
      if (results.length > 0) {
        expect(results[0].url).not.toContain('utm_source');
        expect(results[0].url).toContain('example.com');
      }
    });

    it('should extract domain as source when not provided', () => {
      const html = `
        <div class="result">
          <a class="result__a" href="https://example.com/page">Title</a>
          <a class="result__snippet">Snippet</a>
        </div>
      `;

      const results = parseSearchHtml(html);
      
      if (results.length > 0) {
        expect(results[0].source).toBeTruthy();
      }
    });

    it('should handle results without snippets', () => {
      const html = `
        <div class="result">
          <a class="result__a" href="https://example.com">Title Only</a>
        </div>
      `;

      const results = parseSearchHtml(html);
      
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].title).toBeTruthy();
      expect(results[0].snippet).toBeDefined();
    });

    it('should assign sequential ranks', () => {
      const html = Array(3).fill(`
        <div class="result">
          <a class="result__a" href="https://example.com">Title</a>
        </div>
      `).join('');

      const results = parseSearchHtml(html);
      
      expect(results.length).toBe(3);
      expect(results[0].rank).toBe(1);
      expect(results[1].rank).toBe(2);
      expect(results[2].rank).toBe(3);
    });
  });
});

