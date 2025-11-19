import { NextRequest, NextResponse } from 'next/server';

/**
 * AI Reply API Route
 * 
 * Sends user message to OpenAI API and returns AI reply
 * Handles OpenAI API responses and provides clear fallback messages
 * 
 * Environment Variables:
 * - OPENAI_API_KEY: OpenAI API key (required)
 * - OPENAI_MODEL: Model to use (default: gpt-3.5-turbo)
 * - AI_API_ENABLED: Set to 'false' to use mock responses (default: 'true')
 */

// Mock response for testing/fallback
const getMockResponse = (message: string): string => {
  const responses = [
    `I understand you said: "${message}". How can I help you further?`,
    `Thanks for your message: "${message}". I'm here to assist you!`,
    `You mentioned: "${message}". Let me help you with that.`,
  ];
  return responses[Math.floor(Math.random() * responses.length)];
};

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

    const trimmedMessage = message.trim();
    console.log('[AI Route] ====== NEW REQUEST ======');
    console.log('[AI Route] Message:', trimmedMessage);
    console.log('[AI Route] Timestamp:', new Date().toISOString());

    // Check if AI API is disabled (for testing/mocking)
    // ✅ SOLUTION: Set AI_API_ENABLED=false in .env.local to bypass Rate Limit issues
    const aiApiEnabled = process.env.AI_API_ENABLED !== 'false';
    if (!aiApiEnabled) {
      console.log('[AI Route] ====== USING MOCK RESPONSE ======');
      console.log('[AI Route] AI API disabled via AI_API_ENABLED=false');
      console.log('[AI Route] This bypasses Rate Limit issues for testing');
      const mockReply = getMockResponse(trimmedMessage);
      return NextResponse.json({ reply: mockReply });
    }

    // Get OpenAI API key from environment
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      console.error('[AI Route] ====== CONFIGURATION ERROR ======');
      console.error('[AI Route] OPENAI_API_KEY is not set in environment variables');
      console.error('[AI Route] Please add OPENAI_API_KEY to your .env.local file');
      return NextResponse.json({
        reply: 'AI Assistant is currently unavailable. Please configure OpenAI API key.',
      }, { status: 200 });
    }
    
    // Validate API key format
    if (!openaiApiKey.startsWith('sk-')) {
      console.error('[AI Route] ====== INVALID API KEY FORMAT ======');
      console.error('[AI Route] API key should start with "sk-"');
      console.error('[AI Route] Current key starts with:', openaiApiKey.substring(0, 5));
      return NextResponse.json({
        reply: 'AI Assistant configuration error. Please check your OpenAI API key.',
      }, { status: 200 });
    }

    // Get model from environment or use default
    const model = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';
    const apiUrl = 'https://api.openai.com/v1/chat/completions';
    
    // OpenAI API request body
    const requestBody = {
      model: model,
      messages: [
        {
          role: 'user',
          content: trimmedMessage,
        },
      ],
    };

    console.log('[AI Route] ====== REQUEST CONFIGURATION ======');
    console.log('[AI Route] API URL:', apiUrl);
    console.log('[AI Route] Model:', model);
    console.log('[AI Route] API Key present:', openaiApiKey ? 'Yes (hidden)' : 'No');
    console.log('[AI Route] API Key length:', openaiApiKey ? openaiApiKey.length : 0);
    console.log('[AI Route] API Key starts with:', openaiApiKey ? openaiApiKey.substring(0, 7) + '...' : 'N/A');
    console.log('[AI Route] Request body:', JSON.stringify(requestBody, null, 2));

    // Send request to external API with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    let response: Response | null = null;
    let rawResponseText = '';
    let errorType: 'network' | 'timeout' | 'http' | 'parse' | 'empty' | 'none' = 'none';

    try {
      console.log('[AI Route] Starting fetch request to OpenAI...');
      console.log('[AI Route] Request URL:', apiUrl);
      console.log('[AI Route] Request Method: POST');
      console.log('[AI Route] Request Headers:', {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer sk-...' + openaiApiKey.substring(openaiApiKey.length - 4),
      });
      
      response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Log full response status and headers
      console.log('[AI Route] ====== RESPONSE RECEIVED ======');
      console.log('[AI Route] Status:', response.status);
      console.log('[AI Route] Status Text:', response.statusText);
      console.log('[AI Route] OK:', response.ok);
      console.log('[AI Route] Headers:', Object.fromEntries(response.headers.entries()));
      
      // Log rate limit headers if present
      const rateLimitRemaining = response.headers.get('x-ratelimit-remaining');
      const rateLimitLimit = response.headers.get('x-ratelimit-limit');
      const rateLimitReset = response.headers.get('x-ratelimit-reset');
      if (rateLimitRemaining !== null) {
        console.log('[AI Route] Rate Limit Remaining:', rateLimitRemaining);
        console.log('[AI Route] Rate Limit Limit:', rateLimitLimit);
        console.log('[AI Route] Rate Limit Reset:', rateLimitReset);
      }

      // Read response body
      try {
        rawResponseText = await response.text();
        console.log('[AI Route] Response body length:', rawResponseText.length);
        console.log('[AI Route] Response body (full):', rawResponseText);
      } catch (readError: any) {
        errorType = 'network';
        console.error('[AI Route] Failed to read response body:', {
          name: readError.name,
          message: readError.message,
        });
        throw new Error(`Failed to read response: ${readError.message}`);
      }

      // Distinguish between non-200 status codes
      if (!response.ok) {
        errorType = 'http';
        console.error('[AI Route] ====== HTTP ERROR ======');
        console.error('[AI Route] Status Code:', response.status);
        console.error('[AI Route] Status Text:', response.statusText);
        console.error('[AI Route] Response Body (full):', rawResponseText);
        
        // Try to parse error response for more details
        try {
          const errorData = JSON.parse(rawResponseText);
          console.error('[AI Route] Error Details:', JSON.stringify(errorData, null, 2));
          
          // Check for OpenAI-specific error messages
          if (errorData.error) {
            console.error('[AI Route] OpenAI Error Type:', errorData.error.type);
            console.error('[AI Route] OpenAI Error Message:', errorData.error.message);
            console.error('[AI Route] OpenAI Error Code:', errorData.error.code);
          }
        } catch (e) {
          console.error('[AI Route] Could not parse error response as JSON');
        }
        
        // Return different messages based on status code
        let errorMessage = 'AI Assistant is currently unavailable. Please try again later.';
        if (response.status === 401 || response.status === 403) {
          errorMessage = 'AI service authentication failed. Please check your OpenAI API key.';
        } else if (response.status === 429) {
          // Extract rate limit information from headers
          const retryAfter = response.headers.get('retry-after');
          const rateLimitRemaining = response.headers.get('x-ratelimit-remaining');
          const rateLimitLimit = response.headers.get('x-ratelimit-limit');
          
          console.error('[AI Route] ====== RATE LIMIT HIT ======');
          console.error('[AI Route] Retry After (seconds):', retryAfter || 'Not specified');
          console.error('[AI Route] Rate Limit Remaining:', rateLimitRemaining || 'Unknown');
          console.error('[AI Route] Rate Limit Limit:', rateLimitLimit || 'Unknown');
          console.error('[AI Route] SUGGESTIONS:');
          console.error('[AI Route] 1. Wait before making another request');
          console.error('[AI Route] 2. Check your OpenAI API usage at https://platform.openai.com/usage');
          console.error('[AI Route] 3. Consider upgrading your OpenAI plan if you need higher limits');
          console.error('[AI Route] 4. Make sure you are using gpt-3.5-turbo (not gpt-4) if you have free tier');
          
          if (retryAfter) {
            const waitSeconds = parseInt(retryAfter);
            errorMessage = `AI service is rate-limited. Please wait ${waitSeconds} seconds and try again.`;
          } else {
            errorMessage = 'AI service is rate-limited. Please wait a moment and try again.';
          }
        } else if (response.status >= 500) {
          errorMessage = 'AI service is experiencing issues. Please try again later.';
        }
        
        return NextResponse.json({ reply: errorMessage }, { status: 200 });
      }

      // Check for empty response
      if (!rawResponseText || !rawResponseText.trim()) {
        errorType = 'empty';
        console.warn('[AI Route] ====== EMPTY RESPONSE ======');
        console.warn('[AI Route] Response body is empty or whitespace only');
        
        return NextResponse.json({
          reply: 'AI Assistant returned an empty response. Please try again.',
        }, { status: 200 });
      }

      // Safely parse JSON
      let data: any = {};
      try {
        data = JSON.parse(rawResponseText);
        console.log('[AI Route] ====== JSON PARSED SUCCESSFULLY ======');
        console.log('[AI Route] Parsed data keys:', Object.keys(data));
        console.log('[AI Route] Parsed data (full):', JSON.stringify(data, null, 2));
      } catch (parseError: any) {
        errorType = 'parse';
        console.error('[AI Route] ====== JSON PARSE ERROR ======');
        console.error('[AI Route] Parse error:', parseError.message);
        console.error('[AI Route] Raw response (first 1000 chars):', rawResponseText.substring(0, 1000));
        
        // Try to extract text directly if JSON parsing fails
        data = { rawText: rawResponseText };
        console.log('[AI Route] Using raw text as fallback');
      }

      // Extract reply from OpenAI API response structure
      // OpenAI API returns: { choices: [{ message: { content: "..." } }] }
      let reply: string | null = null;
      
      if (data.choices && Array.isArray(data.choices) && data.choices.length > 0) {
        const firstChoice = data.choices[0];
        if (firstChoice.message && firstChoice.message.content) {
          reply = firstChoice.message.content;
        }
      }
      
      // Fallback to other possible fields (for compatibility)
      if (!reply) {
        reply =
          data.reply ||
          data.message ||
          data.text ||
          data.response ||
          data.content ||
          data.answer ||
          data.output ||
          data.rawText ||
          (data.data && (data.data.message || data.data.reply || data.data.text)) ||
          (data.result && (data.result.message || data.result.text || data.result.reply)) ||
          (typeof data === 'string' ? data : null) ||
          null;
      }

      console.log('[AI Route] ====== REPLY EXTRACTION ======');
      console.log('[AI Route] Extracted reply:', reply ? `"${reply.substring(0, 200)}..."` : 'null/empty');
      console.log('[AI Route] Reply type:', typeof reply);
      console.log('[AI Route] Reply length:', reply ? reply.length : 0);

      // Return actual reply if available, otherwise fallback
      if (reply && typeof reply === 'string' && reply.trim()) {
        const finalReply = reply.trim();
        console.log('[AI Route] ====== SUCCESS ======');
        console.log('[AI Route] Returning actual reply:', finalReply.substring(0, 200));
        return NextResponse.json({ reply: finalReply });
      } else {
        console.warn('[AI Route] ====== NO REPLY FOUND ======');
        console.warn('[AI Route] No valid reply field found in response');
        console.warn('[AI Route] Using fallback message');
        
        return NextResponse.json({
          reply: 'AI Assistant is currently unavailable. Please try again later.',
        }, { status: 200 });
      }
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      
      // Distinguish between network errors and timeouts
      if (fetchError.name === 'AbortError') {
        errorType = 'timeout';
        console.error('[AI Route] ====== TIMEOUT ERROR ======');
        console.error('[AI Route] Request timeout after 30 seconds');
        console.error('[AI Route] Error:', fetchError.message);
        
        return NextResponse.json({
          reply: 'Sorry, the request took too long. Please try again.',
        }, { status: 200 });
      }
      
      // Network errors (unreachable API, DNS errors, etc.)
      errorType = 'network';
      console.error('[AI Route] ====== NETWORK ERROR ======');
      console.error('[AI Route] Error name:', fetchError.name);
      console.error('[AI Route] Error message:', fetchError.message);
      console.error('[AI Route] Error stack:', fetchError.stack);
      console.error('[AI Route] API URL attempted:', apiUrl);
      
      // Suggest using mock or environment variable
      console.error('[AI Route] SUGGESTION: If API is unreachable on Vercel, consider:');
      console.error('[AI Route] 1. Set AI_API_ENABLED=false to use mock responses');
      console.error('[AI Route] 2. Set AI_API_URL to a different endpoint');
      console.error('[AI Route] 3. Check Vercel environment variables and network settings');
      
      return NextResponse.json({
        reply: 'AI service is unreachable. Please check your network connection or API configuration.',
      }, { status: 200 });
    }
  } catch (error: any) {
    // Ensure route never crashes
    console.error('[AI Route] ====== UNEXPECTED ERROR ======');
    console.error('[AI Route] Error name:', error?.name);
    console.error('[AI Route] Error message:', error?.message);
    console.error('[AI Route] Error stack:', error?.stack);
    
    return NextResponse.json(
      { reply: 'AI Assistant is currently unavailable. Please try again later.' },
      { status: 500 }
    );
  }
}

