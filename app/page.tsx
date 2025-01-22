"use client"
require('dotenv').config(); 
import { useState, useRef, useEffect } from "react"
import ReactMarkdown from 'react-markdown'
import CustomLink from './components/CustomLink';

interface Message {
  role: "user" | "assistant"
  content: string
}

interface SearchResult {
  title: string
  link: string
  snippet: string
}

interface ExtraProps {
  // Add any additional props here
}

const MyLink: React.FC<React.AnchorHTMLAttributes<HTMLAnchorElement> & ExtraProps> = ({ 
  href, 
  children, 
  ...props 
}) => {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
      {children}
    </a>
  );
};

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [streamingComplete, setStreamingComplete] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    // Removed scrolling to bottom to prevent auto-scroll
  }, []);

  const formatSearchResults = (results: SearchResult[]) => {
    return results.map((result, index) => (
      `### ${index + 1}. ${result.title}\n` +
      `[${result.link}](${result.link})\n\n` +
      `${result.snippet}\n`
    )).join('\n---\n\n');
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Add an empty assistant message that will be updated with the stream
    const assistantMessage: Message = {
      role: "assistant",
      content: ""
    };
    setMessages((prev) => [...prev, assistantMessage]);

    try {
      // Perform both queries concurrently
      const [searchResponse, aiResponse] = await Promise.allSettled([
        // Google Search Query
        fetch(`/api/search?q=${encodeURIComponent(input)}`),
        // Initial AI Query
        fetch('/api/deepseek', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            query: input,
            searchResults: null,  // Initial query without search results
            initialResponse: null
          }),
        })
      ]);

      // Process search results if available
      let searchResults = null;
      if (searchResponse.status === 'fulfilled' && searchResponse.value.ok) {
        const data = await searchResponse.value.json();
        searchResults = formatSearchResults(data.results);
      }

      // Process AI response if available
      let aiSummary = null;
      if (aiResponse.status === 'fulfilled' && aiResponse.value.ok) {
        const data = await aiResponse.value.json();
        aiSummary = data.summary;
      }

      // If both services failed, show error
      if (!searchResults && !aiSummary) {
        throw new Error('Both search and AI services failed');
      }

      // Get final streaming response
      const finalResponse = await fetch('/api/deepseek', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: input,
          searchResults,
          initialResponse: aiSummary,
          searchFailed: !searchResults,
          aiFailed: !aiSummary
        }),
      });

      if (!finalResponse.ok) {
        throw new Error('Failed to generate final response');
      }

      // Handle the streaming response
      const reader = finalResponse.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No reader available');
      }

      let responseText = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }
        responseText += decoder.decode(value);
      }

      setMessages((prev) => {
        const newMessages = [...prev];
        const lastMessage = newMessages[newMessages.length - 1];
        if (lastMessage.role === 'assistant') {
          lastMessage.content = responseText;
        }
        return newMessages;
      });

    } catch (error) {
      console.error("Error:", error);
      const errorMessage: Message = {
        role: "assistant",
        content: "Sorry, an error occurred while processing your request.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderers = {
    a: ({ children, href, ...props }) => (
      <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
        {children}
      </a>
    ),
  } as const;

  useEffect(() => {
    if (streamingComplete) {
      setMessages((prev) => [...prev]);
    }
  }, [streamingComplete]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="w-full max-w-7xl">
        <div className="flex flex-col space-y-4">
          {messages.map((message, i) => (
            <div
              key={i}
              className={`flex ${
                message.role === "assistant" ? "justify-start" : "justify-end"
              }`}
            >
              <div
                className={`${
                  message.role === "assistant"
                    ? "bg-gray-300 text-gray-900"
                    : "bg-blue-500 text-white"
                } rounded-lg p-6 ${
                  message.role === "assistant" ? "max-w-4xl" : "max-w-xl"
                } prose prose-sm dark:prose-invert`}
              >
                <ReactMarkdown components={renderers}>{message.content}</ReactMarkdown>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        
        <div className="mt-4">
          <form
            onSubmit={handleSubmit}
            className="flex space-x-4"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your query to search..."
              className="flex-1 rounded-lg border border-gray-300 p-4 text-black"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading}
              className={`rounded-lg px-8 py-4 font-semibold ${
                isLoading
                  ? "bg-gray-300 text-gray-600"
                  : "bg-blue-500 text-white hover:bg-blue-600"
              }`}
            >
              {isLoading ? "..." : "Send"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}