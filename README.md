# Amana Chat - Real-time Chat Application

تطبيق دردشة لحظي مبني باستخدام Next.js و Ably للتواصل الفوري بين المستخدمين.

## الميزات

- ✅ إرسال واستقبال الرسائل لحظياً (Real-time messaging)
- ✅ عرض قائمة المتواجدين الآن (Presence)
- ✅ تحميل آخر 20 رسالة من التاريخ عند فتح الصفحة (History)
- ✅ واجهة مستخدم جميلة ومتجاوبة باستخدام Tailwind CSS
- ✅ دعم متعدد المتصفحات والأجهزة

## المتطلبات

- Node.js 18+ 
- npm أو yarn
- حساب Ably (مجاني) - [سجل هنا](https://ably.com)

## التثبيت والتشغيل

### 1. تثبيت المكتبات

```bash
npm install
```

### 2. إعداد متغيرات البيئة

أنشئ ملف `.env.local` في المجلد الرئيسي وأضف API Key الخاص بك من Ably:

```env
ABLY_API_KEY=your_ably_api_key_here
```

**ملاحظة:** الملف `.env.local` موجود بالفعل مع API Key الخاص بك.

### 3. تشغيل التطبيق محلياً

```bash
npm run dev
```

افتح [http://localhost:3000](http://localhost:3000) في المتصفح.

## النشر على Vercel

### 1. رفع المشروع إلى GitHub

```bash
git add .
git commit -m "Add real-time chat functionality"
git push origin main
```

### 2. إعداد Environment Variables في Vercel

1. اذهب إلى [Vercel Dashboard](https://vercel.com/dashboard)
2. اختر مشروعك
3. اذهب إلى **Settings** → **Environment Variables**
4. أضف متغير جديد:
   - **Name:** `ABLY_API_KEY`
   - **Value:** `hXAj1g.wVBH3g:HU-kXrenZK4SJe1mYGg5IM-8M2e092OFqV1JpvWA_Rs`
5. احفظ التغييرات

### 3. إعادة النشر

Vercel سيعيد نشر المشروع تلقائياً بعد إضافة Environment Variables، أو يمكنك إعادة النشر يدوياً من Dashboard.

## هيكل المشروع

```
Amana-Chat/
├── app/
│   ├── api/
│   │   └── ably-token/
│   │       └── route.ts          # Token Endpoint API
│   ├── components/
│   │   └── Chat.tsx              # مكون الدردشة الرئيسي
│   ├── layout.tsx                # Layout الرئيسي
│   ├── page.tsx                  # الصفحة الرئيسية
│   └── globals.css               # الأنماط العامة
├── .env.local                    # متغيرات البيئة (لا يتم رفعه)
├── .env.local.example           # مثال لملف البيئة
├── package.json
└── README.md
```

## شرح الملفات

### `/app/api/ably-token/route.ts`

هذا الـ API endpoint يولد توكن آمن للعميل للاتصال بـ Ably. بدلاً من استخدام API Key مباشرة في الكود (وهذا غير آمن)، يتم توليد التوكن من الخادم.

**الميزات:**
- يحصل على API Key من متغيرات البيئة
- يولد توكن آمن مع الصلاحيات المطلوبة
- يعمل مع `.env.local` محلياً ومع Vercel Environment Variables في الإنتاج

### `/app/components/Chat.tsx`

المكون الرئيسي لواجهة الدردشة. Client Component يستخدم Ably SDK للتواصل اللحظي.

**الميزات:**
- الاتصال بـ Ably عبر Token Endpoint
- الاشتراك في قناة `chat:general`
- إرسال واستقبال الرسائل لحظياً
- عرض قائمة المتواجدين (Presence)
- تحميل آخر 20 رسالة من التاريخ
- واجهة مستخدم جميلة ومتجاوبة

### `/app/page.tsx`

الصفحة الرئيسية التي تعرض مكون Chat.

## الاختبار

### اختبار محلياً

1. شغّل التطبيق: `npm run dev`
2. افتح المتصفح على `http://localhost:3000`
3. افتح نافذة أخرى (أو متصفح آخر) على نفس الرابط
4. أرسل رسالة من إحدى النوافذ وتأكد أنها تظهر في الأخرى فوراً
5. تحقق من قائمة المتواجدين - يجب أن تظهر أسماء المستخدمين

### اختبار على Vercel

1. بعد النشر، افتح رابط التطبيق على Vercel
2. افتح نفس الرابط في متصفح آخر (أو نافذة خاصة)
3. تأكد من أن الرسائل تصل لحظياً
4. تحقق من قائمة المتواجدين

## الأمان

- ✅ API Key محفوظ في متغيرات البيئة ولا يظهر في الكود
- ✅ Token Endpoint يولد توكن آمن للعميل
- ✅ الصلاحيات محدودة للقناة المطلوبة فقط

## الدعم

إذا واجهت أي مشاكل:

1. تأكد من أن API Key صحيح في `.env.local`
2. تأكد من إضافة Environment Variable في Vercel
3. تحقق من Console في المتصفح للأخطاء
4. تحقق من Network tab للتأكد من أن Token Endpoint يعمل

## الرخصة

هذا المشروع مفتوح المصدر ومتاح للاستخدام الحر.
