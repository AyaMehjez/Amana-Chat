import { NextRequest, NextResponse } from 'next/server';
import Ably from 'ably';

/**
 * Token Endpoint API Route
 * 
 * هذا الـ endpoint يولد توكن آمن للعميل للاتصال بـ Ably
 * بدلاً من استخدام API Key مباشرة في الكود (وهذا غير آمن)
 * 
 * يعمل مع:
 * - ملف .env.local للتطوير المحلي
 * - Vercel Environment Variables للإنتاج
 */

export async function GET(request: NextRequest) {
  try {
    // الحصول على API Key من متغيرات البيئة
    const apiKey = process.env.ABLY_API_KEY;

    // التحقق من وجود API Key
    if (!apiKey) {
      console.error('ABLY_API_KEY is not set in environment variables');
      return NextResponse.json(
        { error: 'Ably API Key is not configured' },
        { status: 500 }
      );
    }

    // التحقق من صحة API Key format
    if (!apiKey.includes('.')) {
      console.error('Invalid ABLY_API_KEY format');
      return NextResponse.json(
        { error: 'Invalid API Key format' },
        { status: 500 }
      );
    }

    // الحصول على clientId من query parameter أو استخدام 'anon' كقيمة افتراضية
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId') || 'anon';

    // إنشاء عميل Ably باستخدام API Key مع timeout
    const ably = new Ably.Rest({ 
      key: apiKey,
      httpRequestTimeout: 10000, // 10 second timeout
      httpMaxRetryCount: 2, // Reduce retries
    });

    // توليد توكن للعميل مع clientId المطابق
    // 
    // IMPORTANT: According to Ably's TokenParams type, the `capability` property
    // must be a JSON string, not a plain object. We use JSON.stringify() to
    // convert the capability object into a valid JSON string format.
    //
    // The capability object defines what permissions the client has:
    // - 'subscribe': Can receive messages from the channel
    // - 'publish': Can send messages to the channel
    // - 'presence': Can see who's online (enter/leave presence)
    // - 'history': Can retrieve message history
    //
    // Note: We don't use explicit type annotation here to avoid TypeScript import issues.
    // TypeScript will infer the correct type from createTokenRequest method.
    // This ensures compatibility across different Ably SDK versions.
    const tokenParams = {
      clientId: clientId, // Must match the clientId used in the client initialization
      capability: JSON.stringify({
        // Allow all operations on the chat:general channel
        'chat:general': ['subscribe', 'publish', 'presence', 'history'],
      }),
    };

    // Add timeout wrapper for token request
    const tokenRequestPromise = ably.auth.createTokenRequest(tokenParams);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Token request timeout')), 10000)
    );

    const tokenRequest = await Promise.race([tokenRequestPromise, timeoutPromise]) as any;

    // إرجاع التوكن للعميل
    return NextResponse.json(tokenRequest);
  } catch (error: any) {
    console.error('Error generating Ably token:', error);
    
    // Return more specific error information
    const errorMessage = error.message || 'Failed to generate token';
    return NextResponse.json(
      { 
        error: errorMessage,
        details: error.toString()
      },
      { status: 500 }
    );
  }
}
