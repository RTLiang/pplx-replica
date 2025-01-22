export function extractSearchResults(): string {
  const resultsDiv = document.querySelector('.gcse-searchresults-only');
  if (!resultsDiv) return '';

  // Get all search result items
  const items = resultsDiv.querySelectorAll('.gs-result');
  
  interface SearchResult {
    id: number;
    title: string;
    snippet: string;
  }

  const results: SearchResult[] = [];
  items.forEach((item: Element) => {
    // Extract title
    const title = item.querySelector('.gs-title')?.textContent?.trim() || '';
    
    // Extract snippet
    const snippet = item.querySelector('.gs-snippet')?.textContent?.trim() || '';
    
    if (title || snippet) {
      results.push({ id: 0, title, snippet });
    }
  });

  return results.map(result => `Title: ${result.title}\nSnippet: ${result.snippet}`).join('\n\n');
}
