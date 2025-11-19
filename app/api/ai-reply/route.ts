import { NextRequest, NextResponse } from 'next/server';

/**
 * AI Reply API Route
 * 
 * Sends user message to ApiFreeLLM and returns AI reply
 * Handles multiple response formats and provides clear fallback messages
 */

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();

    // Validate message
    if (!message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json(
        { reply: 'Invalid request' },
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
          prompt: message.trim(), // Try 'prompt' as ApiFreeLLM might expect this
          message: message.trim(), // Also include 'message' as fallback
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        console.error('ApiFreeLLM API error:', response.status, errorText);
        
        // Return a friendly error message
        return NextResponse.json({
          reply: 'AI service error. Please try again later.',
        }, { status: 200 }); // Return 200 so client can handle gracefully
      }

      const data = await response.json();
      console.log('ApiFreeLLM response structure:', Object.keys(data));
      console.log('ApiFreeLLM response sample:', JSON.stringify(data).substring(0, 300));

      // ✅ جرب كل الحقول المحتملة - Try all possible response fields
      const reply =
        data.reply ||
        data.message ||
        data.text ||
        data.response ||
        data.content ||
        data.answer ||
        data.output ||
        (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) ||
        (data.data && (data.data.message || data.data.reply || data.data.text)) ||
        (typeof data === 'string' ? data : null) ||
        'AI Assistant is currently unavailable. Please try again later.'; // Clear fallback message

      // Ensure reply is a string and not empty
      const finalReply = typeof reply === 'string' && reply.trim() 
        ? reply.trim() 
        : 'AI Assistant is currently unavailable. Please try again later.';

      return NextResponse.json({ reply: finalReply });
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        console.error('ApiFreeLLM request timeout');
        return NextResponse.json({
          reply: 'Sorry, the request took too long. Please try again.',
        }, { status: 200 });
      }
      
      throw fetchError; // Re-throw to be caught by outer catch
    }
  } catch (error) {
    console.error('AI route error:', error);
    return NextResponse.json(
      { reply: 'AI Assistant error. Please try again later.' },
      { status: 500 }
    );
  }
}

