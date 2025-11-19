import { NextRequest, NextResponse } from 'next/server';

/**
 * AI Reply API Route
 * 
 * Sends user message to ApiFreeLLM and returns AI reply
 */

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();

    // Validate message
    if (!message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Send request to ApiFreeLLM
    const response = await fetch('https://apifreellm.com/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: message.trim(),
      }),
    });

    if (!response.ok) {
      throw new Error(`ApiFreeLLM API error: ${response.status}`);
    }

    const data = await response.json();

    // Extract reply from response
    // Adjust this based on ApiFreeLLM's actual response structure
    const reply = data.reply || data.message || data.text || data.response || 'Sorry, I could not generate a reply.';

    return NextResponse.json({ reply });
  } catch (error) {
    console.error('Error getting AI reply:', error);
    return NextResponse.json(
      { error: 'Failed to get AI reply', reply: 'Sorry, I encountered an error. Please try again.' },
      { status: 500 }
    );
  }
}

