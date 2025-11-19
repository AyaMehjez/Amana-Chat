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
3. Add environment variable: `ABLY_API_KEY` (required)
4. Deploy

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
