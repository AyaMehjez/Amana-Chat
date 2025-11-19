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

# Optional: AI API Configuration
AI_API_URL=https://apifreellm.com/api/chat  # Custom API endpoint (default: https://apifreellm.com/api/chat)
AI_API_ENABLED=true                          # Set to 'false' to use mock responses (default: 'true')
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
   - `AI_API_URL` (optional - custom AI API endpoint)
   - `AI_API_ENABLED` (optional - set to `false` to use mock responses)
4. Deploy

**Note:** If the AI API is unreachable on Vercel, you can:
- Set `AI_API_ENABLED=false` to use mock responses for testing
- Set `AI_API_URL` to a different endpoint that works on Vercel
- Check Vercel logs for detailed error messages

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
