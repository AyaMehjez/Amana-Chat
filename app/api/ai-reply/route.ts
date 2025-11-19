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

    // Send request to ApiFreeLLM with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
      const response = await fetch('https://apifreellm.com/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          message: message.trim(),
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        console.error('ApiFreeLLM API error:', response.status, errorText);
        
        // Return a friendly error message instead of throwing
        return NextResponse.json({
          error: 'API request failed',
          reply: 'Sorry, I am having trouble connecting right now. Please try again later.',
        }, { status: 200 }); // Return 200 so client can handle gracefully
      }

      const data = await response.json();
      console.log('ApiFreeLLM response structure:', Object.keys(data));
      console.log('ApiFreeLLM response sample:', JSON.stringify(data).substring(0, 300));

      // Extract reply from response - try multiple possible structures
      const reply = data.reply || 
                    data.message || 
                    data.text || 
                    data.response || 
                    data.content ||
                    data.answer ||
                    data.output ||
                    (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) ||
                    (data.data && (data.data.message || data.data.reply || data.data.text)) ||
                    (typeof data === 'string' ? data : null) ||
                    'Sorry, I could not generate a reply.';

      return NextResponse.json({ reply });
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        console.error('ApiFreeLLM request timeout');
        return NextResponse.json({
          error: 'Request timeout',
          reply: 'Sorry, the request took too long. Please try again.',
        }, { status: 200 });
      }
      
      throw fetchError; // Re-throw to be caught by outer catch
    }
  } catch (error) {
    console.error('Error getting AI reply:', error);
    return NextResponse.json(
      { error: 'Failed to get AI reply', reply: 'Sorry, I encountered an error. Please try again.' },
      { status: 500 }
    );
  }
}

