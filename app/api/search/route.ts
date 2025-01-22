import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
  }

  try {
    const response = await fetch(
      `https://www.googleapis.com/customsearch/v1?key=${process.env.GOOGLE_API_KEY}&cx=${process.env.SEARCH_ENGINE_ID}&q=${encodeURIComponent(
        query
      )}`
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Google API Error:', errorData);
      throw new Error('Failed to fetch search results');
    }

    const data = await response.json();
    
    // Check if data.items exists and is an array
    if (!data.items || !Array.isArray(data.items)) {
      return NextResponse.json({ results: [] });
    }

    // Extract relevant information from search results
    const formattedResults = data.items.map((item: any) => ({
      title: item.title,
      link: item.link,
      snippet: item.snippet,
    }));

    return NextResponse.json({ results: formattedResults });
  } catch (error) {
    console.error('Search API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch search results' },
      { status: 500 }
    );
  }
}
