import { NextResponse } from 'next/server';

const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';

export async function POST(request: Request) {
  try {
    const { searchResults, query, initialResponse, searchFailed, aiFailed } = await request.json();

    // If this is the initial AI query (no search results or initial response)
    if (!searchResults && !initialResponse) {
      const messages = [
        {
          role: "system",
          content: "You are a helpful assistant. Provide a concise initial response based on your knowledge. If the query requires current information, indicate that search results would be helpful."
        },
        {
          role: "user",
          content: query
        }
      ];

      const response = await fetch(DEEPSEEK_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages,
          max_tokens: 1000,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`Deepseek API error: ${response.statusText}`);
      }

      const data = await response.json();
      return NextResponse.json({ summary: data.choices[0].message.content });
    }

    // This is the final response combining both AI and search results
    const messages = [
      {
        role: "system",
        content: "You are a helpful assistant that combines AI knowledge with search results to provide comprehensive answers. When referencing search results, use markdown to highlight important information and include source links. Format: **important info** and [Website](URL)."
      },
      {
        role: "user",
        content: `Here is my query: "${query}"\n\n${
          searchFailed 
            ? "**Google search is currently unavailable.**" 
            : `Here are the Google search results:\n${searchResults}`
        }\n\n${
          aiFailed 
            ? "**Initial AI response is unavailable.**" 
            : `And here is your initial response: ${initialResponse}`
        }\n\nPlease provide a comprehensive answer using the available information. Highlight important information using **bold text** and include source links in markdown format [Website](URL) when referencing search results. Organize the information into clear paragraphs.`
      }
    ];

    // Create a streaming response
    const encoder = new TextEncoder();
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    // Start the Deepseek API request with streaming
    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages,
        max_tokens: 1000,
        temperature: 0.7,
        stream: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`Deepseek API error: ${response.statusText}`);
    }

    // Process the stream
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No reader available');
    }

    // Start streaming process
    (async () => {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            await writer.close();
            break;
          }

          const chunk = new TextDecoder().decode(value);
          const lines = chunk.split('\n').filter(line => line.trim() !== '');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;
              
              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices[0]?.delta?.content || '';
                if (content) {
                  await writer.write(encoder.encode(content));
                }
              } catch (e) {
                console.error('Error parsing JSON:', e);
              }
            }
          }
        }
      } catch (error) {
        console.error('Stream processing error:', error);
        await writer.abort(error);
      }
    })();

    return new Response(stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate summary' },
      { status: 500 }
    );
  }
}
