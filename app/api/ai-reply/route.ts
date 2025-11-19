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
      console.error('[AI Route] Invalid request: message is missing or invalid');
      return NextResponse.json(
        { reply: 'Invalid request' },
        { status: 400 }
      );
    }

    console.log('[AI Route] Sending request to ApiFreeLLM:', { message: message.trim() });

    // Send request to ApiFreeLLM with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
      const apiUrl = 'https://apifreellm.com/api/chat';
      const requestBody = {
        prompt: message.trim(),
        message: message.trim(),
      };

      console.log('[AI Route] Fetching from:', apiUrl);
      console.log('[AI Route] Request body:', JSON.stringify(requestBody));

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // 📋 Prompt 1: Log the full raw response
      const rawResponseText = await response.text().catch(() => 'Failed to read response');
      console.log('[AI Route] Response status:', response.status);
      console.log('[AI Route] Response headers:', Object.fromEntries(response.headers.entries()));
      console.log('[AI Route] Raw response text (full):', rawResponseText);
      console.log('[AI Route] Raw response length:', rawResponseText.length);

      if (!response.ok) {
        console.error('[AI Route] API error:', {
          status: response.status,
          statusText: response.statusText,
          rawResponse: rawResponseText.substring(0, 500), // First 500 chars
        });
        
        // 📋 Prompt 2: Return clear fallback message
        return NextResponse.json({
          reply: 'AI Assistant is currently unavailable. Please try again later.',
        }, { status: 200 }); // Return 200 so client can handle gracefully
      }

      // 📋 Prompt 1: Safely parse JSON, even if empty or invalid
      let data: any = {};
      try {
        if (rawResponseText && rawResponseText.trim()) {
          data = JSON.parse(rawResponseText);
          console.log('[AI Route] Parsed JSON successfully');
        } else {
          console.warn('[AI Route] Empty response body, using empty object');
          data = {};
        }
      } catch (parseError: any) {
        console.error('[AI Route] JSON parse error:', parseError.message);
        console.error('[AI Route] Raw response that failed to parse:', rawResponseText.substring(0, 500));
        // If JSON parsing fails, try to extract text directly
        data = { rawText: rawResponseText };
      }

      console.log('[AI Route] Parsed data structure:', Object.keys(data));
      console.log('[AI Route] Parsed data (full):', JSON.stringify(data, null, 2));

      // 📋 Prompt 2: Expand fallback handling - Try all possible response fields
      const reply =
        data.reply ||
        data.message ||
        data.text ||
        data.response ||
        data.content ||
        data.answer ||
        data.output ||
        data.rawText ||
        (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) ||
        (data.data && (data.data.message || data.data.reply || data.data.text)) ||
        (typeof data === 'string' ? data : null) ||
        null; // Don't set fallback here, we'll check below

      console.log('[AI Route] Extracted reply:', reply ? `"${reply.substring(0, 100)}..."` : 'null/empty');

      // 📋 Prompt 2: Return clear fallback if missing
      const finalReply = typeof reply === 'string' && reply.trim() 
        ? reply.trim() 
        : 'AI Assistant is currently unavailable. Please try again later.';

      console.log('[AI Route] Final reply:', finalReply.substring(0, 100));

      return NextResponse.json({ reply: finalReply });
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        console.error('[AI Route] Request timeout after 30 seconds');
        return NextResponse.json({
          reply: 'Sorry, the request took too long. Please try again.',
        }, { status: 200 });
      }
      
      console.error('[AI Route] Fetch error:', {
        name: fetchError.name,
        message: fetchError.message,
        stack: fetchError.stack,
      });
      
      throw fetchError; // Re-throw to be caught by outer catch
    }
  } catch (error: any) {
    // 📋 Prompt 2: Ensure route never crashes
    console.error('[AI Route] Unexpected error:', {
      name: error?.name,
      message: error?.message,
      stack: error?.stack,
    });
    
    return NextResponse.json(
      { reply: 'AI Assistant is currently unavailable. Please try again later.' },
      { status: 500 }
    );
  }
}

