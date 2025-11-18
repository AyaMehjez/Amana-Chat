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

    // الحصول على clientId من query parameter أو استخدام 'anon' كقيمة افتراضية
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId') || 'anon';

    // إنشاء عميل Ably باستخدام API Key
    const ably = new Ably.Rest({ key: apiKey });

    // توليد توكن للعميل مع clientId المطابق
    const tokenParams = {
      clientId: clientId, // يجب أن يطابق clientId المستخدم في العميل
      capability: {
        // السماح بالاشتراك والإرسال في قناة chat:general
        'chat:general': ['subscribe', 'publish', 'presence', 'history'],
      },
    };

    const tokenRequest = await ably.auth.createTokenRequest(tokenParams);

    // إرجاع التوكن للعميل
    return NextResponse.json(tokenRequest);
  } catch (error) {
    console.error('Error generating Ably token:', error);
    return NextResponse.json(
      { error: 'Failed to generate token' },
      { status: 500 }
    );
  }
}

