# دليل الإعداد السريع - Amana Chat

## الخطوات السريعة

### 1. تثبيت المكتبات

```bash
cd Amana-Chat
npm install
```

### 2. إعداد ملف البيئة

الملف `.env.local` موجود بالفعل مع API Key الخاص بك. إذا لم يكن موجوداً، أنشئه:

```bash
# في مجلد Amana-Chat
echo "ABLY_API_KEY=hXAj1g.wVBH3g:HU-kXrenZK4SJe1mYGg5IM-8M2e092OFqV1JpvWA_Rs" > .env.local
```

### 3. تشغيل التطبيق

```bash
npm run dev
```

### 4. فتح المتصفح

افتح [http://localhost:3000](http://localhost:3000)

## النشر على Vercel

### الخطوة 1: رفع الكود إلى GitHub

```bash
git add .
git commit -m "Add real-time chat with Ably"
git push origin main
```

### الخطوة 2: إعداد Environment Variables في Vercel

1. اذهب إلى: https://vercel.com/dashboard
2. اختر مشروع **Amana-Chat**
3. اضغط على **Settings**
4. اضغط على **Environment Variables** من القائمة الجانبية
5. أضف متغير جديد:
   - **Key:** `ABLY_API_KEY`
   - **Value:** `hXAj1g.wVBH3g:HU-kXrenZK4SJe1mYGg5IM-8M2e092OFqV1JpvWA_Rs`
   - **Environment:** Production, Preview, Development (اختر الكل)
6. اضغط **Save**

### الخطوة 3: إعادة النشر

- Vercel سيعيد النشر تلقائياً بعد إضافة Environment Variables
- أو اضغط على **Deployments** → اختر آخر deployment → **Redeploy**

## التحقق من أن كل شيء يعمل

### محلياً:
1. افتح `http://localhost:3000` في متصفح
2. افتح نفس الرابط في نافذة خاصة (Incognito)
3. أرسل رسالة من إحدى النوافذ
4. يجب أن تظهر الرسالة فوراً في النافذة الأخرى
5. تحقق من قائمة "المتواجدون الآن" - يجب أن تظهر أسماء المستخدمين

### على Vercel:
1. افتح رابط التطبيق على Vercel
2. افتح نفس الرابط في متصفح آخر
3. اختبر إرسال الرسائل
4. تحقق من Presence

## استكشاف الأخطاء

### المشكلة: "Failed to get Ably token"
**الحل:** تأكد من وجود `.env.local` مع API Key الصحيح

### المشكلة: الرسائل لا تصل
**الحل:** 
- تحقق من Console في المتصفح
- تأكد من أن API Key صحيح
- تأكد من أن Token Endpoint يعمل (افتح `/api/ably-token` في المتصفح)

### المشكلة: على Vercel لا يعمل
**الحل:**
- تأكد من إضافة `ABLY_API_KEY` في Vercel Environment Variables
- أعد نشر المشروع بعد إضافة المتغيرات

## الملفات المهمة

- `app/api/ably-token/route.ts` - Token Endpoint
- `app/components/Chat.tsx` - مكون الدردشة
- `.env.local` - متغيرات البيئة (لا يتم رفعه إلى GitHub)
- `package.json` - المكتبات المطلوبة

## ملاحظات

- ملف `.env.local` موجود في `.gitignore` ولن يتم رفعه إلى GitHub
- على Vercel، يجب إضافة Environment Variables يدوياً
- API Key موجود في الملف `.env.local` جاهز للاستخدام

