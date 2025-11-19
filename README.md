# Amana Chat

Real-time chat application built with Next.js 15 and Ably.

## Features

- Real-time messaging
- Online users presence
- Message history (last 20 messages)
- Modern UI with Tailwind CSS

## Quick Start

### Installation

```bash
npm install
```

### Environment Setup

Create `.env.local` file:

```env
ABLY_API_KEY=your_ably_api_key_here

# OpenAI API Configuration
OPENAI_API_KEY=your_openai_api_key_here     # Required for AI replies (get from https://platform.openai.com/api-keys)
OPENAI_MODEL=gpt-3.5-turbo                  # Optional: Model to use (default: gpt-3.5-turbo)
AI_API_ENABLED=true                          # Optional: Set to 'false' to use mock responses and bypass Rate Limit (default: 'true')

# ⚠️ If you encounter Rate Limit errors (429), set AI_API_ENABLED=false temporarily
```

### Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deployment

### Vercel

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables:
   - `ABLY_API_KEY` (required)
   - `OPENAI_API_KEY` (required for AI replies)
   - `OPENAI_MODEL` (optional - default: gpt-3.5-turbo)
   - `AI_API_ENABLED` (optional - set to `false` to use mock responses)
4. Deploy

**Note:** If the AI API is unreachable on Vercel, you can:
- Set `AI_API_ENABLED=false` to use mock responses for testing
- Check Vercel logs for detailed error messages
- Verify your OpenAI API key is correct and has sufficient credits

## Tech Stack

- Next.js 15
- Ably (Real-time messaging)
- TypeScript
- Tailwind CSS

## Project Structure

```
app/
├── api/ably-token/route.ts    # Token endpoint
├── components/Chat.tsx        # Chat component
└── page.tsx                   # Main page
```

## License

Open source - free to use.
