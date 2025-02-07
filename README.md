# Perplexity AI Replica

A replica of Perplexity AI that combines AI language models with real-time Google search results to provide comprehensive answers to user queries. This project implements RAG (Retrieval-Augmented Generation) by combining Deepseek/Groq AI responses with Google Search results.

## Features
- Real-time Google Search integration
- AI-powered responses using Deepseek (with Groq fallback)
- Markdown rendering support
- Dark mode support
- Responsive design
- RAG (Retrieval-Augmented Generation) implementation

## Tech Stack
- Next.js 14
- TypeScript
- Tailwind CSS
- React Markdown
- Google Custom Search API
- Deepseek API
- Groq API

## Prerequisites
Before deploying, you'll need:
- Google API Key and Search Engine ID
- Deepseek API Key
- Groq API Key
- Vercel account

## Environment Variables
Create a `.env` file with required credentials

## Local Development
The application will run on `http://localhost:80`

## Deploying to Vercel
1. Fork this repository
2. Create a new project on Vercel
3. Connect your forked repository
4. Add environment variables in Vercel project settings
5. Deploy


## Architecture
The application uses a RAG architecture:
1. User query is processed simultaneously by:
   - Google Search API for relevant web results
   - Initial AI response for base knowledge
2. Both results are combined and processed by the AI model
3. Final response is generated with markdown formatting and source links


## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

---

[Live demo: Perplexity AI Replica](https://pplx-replica.vercel.app/)