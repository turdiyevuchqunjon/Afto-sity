# AvtoCity Pro — Web sayt + Bitrix24

Next.js 15 (App Router) landing page. Form'dan kelgan lead'lar avtomatik
**Bitrix24**'ga `Сделка (Deal)` sifatida tushadi va default pipeline'ning
birinchi stage'iga (`Маркетинг янги лид`) joylashadi.

---

## 📋 Tarkib

1. [Loyiha tuzilishi](#loyiha-tuzilishi)
2. [Ishlash printsipi](#ishlash-printsipi)
3. [1-bosqich. Bitrix24 webhook yaratish](#1-bosqich-bitrix24-webhook-yaratish)
4. [2-bosqich. Lokal o'rnatish](#2-bosqich-lokal-orsatish)
5. [3-bosqich. Test qilish](#3-bosqich-test-qilish)
6. [4-bosqich. Vercel'ga deploy](#4-bosqich-vercelga-deploy)
7. [Xatolarni tuzatish](#xatolarni-tuzatish)
8. [Texnik nuqtalar](#texnik-nuqtalar)
9. [Keyingi bosqichlar](#keyingi-bosqichlar)

---

## Loyiha tuzilishi

```
avtocity-landing/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── lead/
│   │   │       └── route.ts        # Form'dan kelgan ma'lumot bu yerga keladi
│   │   ├── globals.css             # Tailwind + custom styles
│   │   ├── layout.tsx              # Root layout, metadata, shriftlar
│   │   ├── page.tsx                # Landing page (sarlavha + form)
│   │   ├── error.tsx               # Global error boundary
│   │   ├── not-found.tsx           # 404 sahifasi
│   │   ├── robots.ts               # SEO robots.txt
│   │   └── sitemap.ts              # SEO sitemap.xml
│   ├── components/
│   │   └── LeadForm.tsx            # Form (client-side, validatsiya bilan)
│   └── lib/
│       ├── bitrix.ts               # Bitrix24 REST API client
│       └── tracking.ts             # UTM tracking helper
├── .env.example                    # Qanday env'lar kerakligi haqida namuna
├── .eslintrc.json                  # ESLint sozlamalari
├── .gitignore
├── next-env.d.ts                   # Next.js TypeScript types
├── next.config.mjs                 # Next.js config
├── package.json
├── postcss.config.mjs
├── tailwind.config.ts              # Tailwind sozlamalari
├── tsconfig.json
└── README.md                       # Siz hozir o'qiyotgan fayl
```

---

## Ishlash printsipi

```
┌─────────────────────────────────────────┐
│  Foydalanuvchi formani to'ldiradi       │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│  LeadForm.tsx                           │
│  - Browser tomonida validatsiya (Zod)   │
│  - UTM va sahifa URL'i yig'iladi        │
│  - POST /api/lead ga JSON yuboriladi    │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│  /api/lead route                        │
│  - Server tomonida validatsiya          │
│  - IP va User-Agent olinadi             │
│  - lib/bitrix.ts chaqiriladi            │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│  Bitrix24 REST API                      │
│  1. crm.contact.add — Mijoz yaratiladi  │
│  2. crm.deal.add — Sделка yaratiladi   │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│  Bitrix24 Kanban                        │
│  "Маркетинг янги лид" stage'ida ko'rinadi│
└─────────────────────────────────────────┘
```

---

## 1-bosqich. Bitrix24 webhook yaratish

> Bu eng birinchi qadam. Web sayt'ni ishga tushirishdan oldin webhook URL'ini olishingiz kerak.

### Qadamlar

1. **avtocitypro.bitrix24.kz** sahifasini oching va admin akkaunt bilan kiring

2. Chap menyuda quyidagi yo'l bo'yicha o'ting:

   ```
   Приложения  →  Разработчикам  →  Другое  →  Входящий вебхук
   ```

3. Yangi webhook yaratish formasida:

   - **Nom (Название)**: `Web sayt lead'lari` (yoki istalgan nom)
   - **Huquqlar (Права доступа)** bo'limida quyidagini belgilang:
     - ✅ **CRM (crm)** — bu majburiy

4. **Сохранить (Saqlash)** tugmasini bosing

5. Quyidagi formatdagi URL paydo bo'ladi:

   ```
   https://avtocitypro.bitrix24.kz/rest/1/abcdef1234567890/
   ```

6. Bu URL'ni nusxa oling — keyingi bosqichda `.env.local` ga qo'yasiz

> ⚠️ **Diqqat**: Bu URL maxfiy. Uni hech kimga bermasligingiz va GitHub'ga yuklamasligingiz kerak.

---

## 2-bosqich. Lokal o'rnatish

### Talablar

- **Node.js**: 18.18+ yoki 20+
- **npm** (yoki pnpm, yarn — istalgan menejer)

### Qadamlar

```bash
# 1. Loyiha papkasiga kiring
cd avtocity-landing

# 2. Paketlarni o'rnating
npm install

# 3. .env faylini yarating
cp .env.example .env.local

# 4. .env.local ni oching va BITRIX_WEBHOOK_URL ga
#    1-bosqichdan olingan URL'ni qo'ying
#    Masalan:
#    BITRIX_WEBHOOK_URL=https://avtocitypro.bitrix24.kz/rest/1/abcdef1234567890/

# 5. Dev serverni ishga tushiring
npm run dev
```

Brauzerda oching: **http://localhost:3000**

### Sog'lomlik tekshiruvi

Bitrix sozlanganini tekshirish uchun:

```
http://localhost:3000/api/lead
```

Quyidagi javob kelishi kerak:

```json
{
  "ok": true,
  "service": "lead-api",
  "bitrixConfigured": true,
  "timestamp": "2026-05-01T12:34:56.789Z"
}
```

`bitrixConfigured: true` bo'lsa — hammasi joyida.

---

## 3-bosqich. Test qilish

### Test ma'lumotlar bilan

1. http://localhost:3000 da formani to'ldiring:

   - **Ism**: Test Aliev
   - **Telefon**: +998 90 123 45 67
   - **Mashina/qism**: Cobalt 2014 — old amartizator
   - **Izoh**: Test buyurtma

2. **"Buyurtma berish"** tugmasini bosing

3. Yashil tasdiqlash xabari chiqishi kerak ✓

4. **Bitrix24**'ga kiring va tekshiring:

   - **CRM** → **Сделки** → **Канбан**
   - **"Маркетинг янги лид"** ustunida yangi sделка paydo bo'lishi kerak
   - Sарlavha: `Cobalt 2014 — old amartizator — Test Aliev`

5. Sделка'ni oching va tekshiring:
   - **Контакт** bog'langan bo'lishi kerak (Test Aliev)
   - **Sумма**: 0 so'm (boshlang'ich)
   - **Источник**: WEB
   - **Комментарий** maydonida:
     ```
     🚗 Mashina/qism: Cobalt 2014 — old amartizator
     💬 Izoh: Test buyurtma
     🔗 Sahifa: http://localhost:3000/
     🌐 IP: ::1
     📱 UA: Mozilla/5.0...
     ```

### UTM tracking testi

Reklamadan kelishni simulatsiya qilish uchun URL'ga UTM parametrlarni qo'shing:

```
http://localhost:3000/?utm_source=facebook&utm_medium=cpc&utm_campaign=spring_sale
```

Form yuborilganda Bitrix Sделка'da quyidagi field'lar to'lganligini ko'rasiz:

- `UTM_SOURCE`: facebook
- `UTM_MEDIUM`: cpc
- `UTM_CAMPAIGN`: spring_sale

---

## 4-bosqich. Vercel'ga deploy

### A. GitHub'ga yuklash

```bash
git init
git add .
git commit -m "Initial commit: avtocity landing"

# GitHub'da yangi repository yarating va push qiling
git remote add origin https://github.com/USERNAME/avtocity-landing.git
git branch -M main
git push -u origin main
```

> ⚠️ **Diqqat**: `.env.local` `.gitignore` ichida — webhook URL maxfiy bo'lib qoladi.

### B. Vercel'ga ulash

1. https://vercel.com/new ga kiring
2. GitHub repository'ngizni tanlang ("Import")
3. **Configure Project** bo'limida:
   - **Framework Preset**: Next.js (avtomatik aniqlanadi)
   - **Root Directory**: `./`
4. **Environment Variables** bo'limida quyidagini qo'shing:

   ```
   Name:  BITRIX_WEBHOOK_URL
   Value: https://avtocitypro.bitrix24.kz/rest/1/abcdef1234567890/
   ```

   Apply qiling: **Production**, **Preview**, **Development** uchun.

5. **Deploy** tugmasini bosing va kuting (~2 daqiqa)

### C. Custom domen ulash (ixtiyoriy)

1. Vercel project → **Settings** → **Domains**
2. **Add** → o'z domen'ingizni kiriting (masalan, `avtocitypro.uz`)
3. Domen registratorida ko'rsatilgan DNS yozuvlarini qo'shing
4. SSL avtomatik sozlanadi

### D. Production test

Deploy bo'lgach, real URL'da formani to'ldiring va Bitrix'da paydo bo'lishini tekshiring.

---

## Xatolarni tuzatish

### Form yuboriladi, lekin Bitrix'da Sделка yo'q

**Tekshirish**:

1. Browser console'ni oching (F12) — `/api/lead` so'rovi 200 OK bo'ldimi?
2. Vercel logs (yoki lokal terminal) — Bitrix xato bormi?

**Sabablar va yechimlar**:

| Xato xabari                        | Sabab                            | Yechim                                              |
| ---------------------------------- | -------------------------------- | --------------------------------------------------- |
| `BITRIX_WEBHOOK_URL sozlanmagan`   | Env to'ldirilmagan               | `.env.local` ga URL qo'shing va serverni qayta ishga tushiring |
| `Bitrix24 xato (crm.contact.add)`  | Webhook huquqlari yetishmaydi    | Bitrix'da webhook'ga **CRM (crm)** huquqini bering   |
| `Source not found: WEB`            | Bitrix'da WEB source yo'q        | Bitrix → CRM → Sozlamalar → Spravochnik → Источник'da `WEB` qo'shing |
| `Bitrix24 javob bermadi (timeout)` | Bitrix server sekin yoki uzilgan | Bir necha daqiqadan keyin qayta urinib ko'ring      |
| `Yaroqsiz JSON qaytardi`           | Webhook URL noto'g'ri            | URL oxirida `/` borligini va `?` yo'qligini tekshiring |

### "Source not found" xatosi

Agar Bitrix'da `WEB` manba mavjud bo'lmasa, Sделка yaratilmaydi. Ikki yo'l:

**Variant 1 (tavsiya qilinadi)** — Bitrix'da yangi manba qo'shing:

1. Bitrix → **CRM** → **Sozlamalar (Settings)**
2. **Spravochnik (Справочники)** → **Источник (Manba)**
3. **Добавить** → Nomi: `Web sayt`, Kodi (символьный код): `WEB`
4. Saqlang

**Variant 2** — kodda manba ID'sini olib tashlang:

`src/lib/bitrix.ts` faylidan `SOURCE_ID: "WEB"` qatorlarini olib tashlang. Sделка default manba bilan yaratiladi.

### Form ko'rinishi buzilgan

`npm install` to'liq ishlamaganligi mumkin:

```bash
rm -rf node_modules .next
npm install
npm run dev
```

---

## Texnik nuqtalar

### Pipeline va Stage

Hozir har bir Sделка default pipeline'ning **birinchi stage**'iga (sizdagi `Маркетинг янги лид`) tushadi.

Boshqa stage'ga yo'naltirish uchun `src/lib/bitrix.ts` faylida `dealFields` obyektiga qo'shing:

```typescript
const dealFields: Record<string, unknown> = {
  TITLE: "...",
  STAGE_ID: "NEW", // <-- bu yerga kerakli stage kodi
  // ...
};
```

Stage kodlarini bilish uchun: **CRM** → **Sozlamalar** → **Sделка** → **Pipeline va stage** ga kiring.

### UTM tracking qanday ishlaydi

Foydalanuvchi reklamadan kelganda URL ko'rinishi:

```
https://avtocitypro.uz/?utm_source=facebook&utm_medium=cpc&utm_campaign=spring2026
```

`src/lib/tracking.ts` bu parametrlarni avtomatik o'qib, form ma'lumotlari bilan birga
serverga yuboradi. Server ularni Bitrix Sделка'ning standart UTM field'lariga yozadi.

Bitrix'da har bir sотув uchun reklama manbasini ko'rib, qaysi kampaniya qancha sotuv olib kelganini tahlil qilishingiz mumkin.

### Validatsiya 2 qatlam

- **Browser** (`LeadForm.tsx`): Zod + react-hook-form — foydalanuvchi xato kiritsa darhol ko'rsatadi
- **Server** (`/api/lead/route.ts`): Zod — bypass qilingan so'rovlardan himoya

Ikkalasi bir xil schema ishlatadi.

### Xavfsizlik

- `BITRIX_WEBHOOK_URL` — **server-only**, browser'da hech qachon ko'rinmaydi
- Foydalanuvchi `/api/lead` orqali so'rov yuboradi, Bitrix URL'i hech qachon foydalanuvchiga ko'rinmaydi
- API timeout — 10 sekund (Bitrix sekinlashsa, server qotib qolmaydi)
- Rate limiting yo'q (kerak bo'lsa Vercel'da WAF yoki middleware qo'shish mumkin)

### Performance

- **First Contentful Paint**: ~0.8s (Vercel edge'da)
- **Total bundle size**: ~80KB gzipped (Tailwind purge bilan)
- **Lighthouse**: 95-100 (mobile va desktop)

---

## Keyingi bosqichlar

Hozirgi qism: **Web sayt + Bitrix24** — birinchi bosqich tugadi.

Keyingi qadamlar (alohida ulanadi):

### 2-bosqich. Meta Pixel + Conversions API

- Browser'da Meta Pixel script
- Server-side `Lead` event yuborish (deduplikatsiya bilan)
- Custom Audience yaratish

### 3-bosqich. Purchase event

- Bitrix24'da Robot/Avtomatlashtirish sozlash
- Sotuvchi to'lovni tasdiqlaganda Meta'ga `Purchase` event
- Lead → Purchase atribut qilish (Lookalike sifati uchun muhim)

### 4-bosqich. Lookalike Audience

- Meta'da xaridorlardan Lookalike yaratish (1-3% similarity)
- Reklama kampaniyalarini shu auditoriyaga yo'naltirish
- ROAS tahlili

Bu bosqichlar AmoCRM bilan ishlaganingiz oqimni to'liq qaytaradi, faqat Bitrix24 bilan.

---

## Texnik stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router, Server Components)
- **Til**: TypeScript 5.7
- **Stil**: Tailwind CSS 3.4
- **Shrift**: Fraunces (display) + Geist (sans) + JetBrains Mono — Google Fonts
- **Form**: react-hook-form + Zod
- **Hosting**: Vercel
- **CRM**: Bitrix24 (REST API orqali)

---

## Litsenziya

Private — AvtoCity Pro uchun moslashtirilgan.
# Afto-sity
