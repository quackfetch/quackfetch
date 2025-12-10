/**
 * Simple usage example for quackfetch
 */

const { search } = require('../src/index');

async function main() {
  try {
    console.log('Searching DuckDuckGo for "node.js tutorial"...\n');

    const results = await search('node.js tutorial', {
      max: 5,
      useCache: true
    });

    console.log(`Found ${results.length} results:\n`);

    results.forEach((result, index) => {
      console.log(`${index + 1}. ${result.title}`);
      console.log(`   URL: ${result.url}`);
      console.log(`   Source: ${result.source}`);
      console.log(`   Snippet: ${result.snippet.substring(0, 100)}...`);
      console.log('');
    });

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };

