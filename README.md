# Vercel AI SDK Example — Agentic Chatbot

Next.js App Router üzerinde **Vercel AI SDK (v6)** ve **Google Gemini** ile kurulmuş, uçtan uca çalışan bir chatbot örneği. Düz bir sohbet kutusunun ötesine geçer: **tool calling** ile yapay zekanın arka planda çağırdığı araçları, **agentic step timeline** ile her adımı (hangi araç, hangi argümanla, hangi sırayla) görünür kılar.

> Bu repo, Medium yazısı *"Vercel AI SDK nedir? SSE'den vazgeçmeli mi?"* için uçtan uca çalışan referans projedir.

## ✨ Özellikler

- **Streaming chat** — `streamText` + `useChat` ile kelime kelime akan cevaplar, sıfır SSE boilerplate.
- **Tool calling** — `zod` ile tip-güvenli araç tanımları (`weather`, `cityInfo`).
- **Agentic çoklu adım** — `stopWhen: stepCountIs(5)` ile model birden fazla aracı sırayla çağırıp sonuçları sentezler.
- **Step timeline + tool accordion** — `message.parts` akışından üretilen, her aracın durumunu (⏳ çalışıyor → ✅ tamamlandı) ve girdi/çıktı JSON'unu gösteren görsel ajan izi.
- **Headless UI** — tasarımın %100 kontrolü sizde; tüm arayüz Tailwind ile elde yazıldı.

## 🧱 Teknoloji Yığını

| Katman | Teknoloji |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| AI | Vercel AI SDK v6 (`ai`, `@ai-sdk/react`) |
| Model sağlayıcı | Google Gemini (`@ai-sdk/google`, `gemini-2.5-flash`) |
| Şema/validasyon | Zod |
| Stil | Tailwind CSS |
| Dil | TypeScript |

## 🚀 Kurulum

### 1. Repoyu klonlayın

```bash
git clone https://github.com/cmracar/vercel-ai-sdk-example.git
cd vercel-ai-sdk-example
```

### 2. Bağımlılıkları yükleyin

```bash
npm install
```

### 3. API anahtarını ayarlayın

Ücretsiz bir Gemini anahtarını [Google AI Studio](https://aistudio.google.com/apikey) üzerinden alın, ardından:

```bash
cp .env.example .env.local
```

`.env.local` içine anahtarınızı yapıştırın:

```env
GOOGLE_GENERATIVE_AI_API_KEY=AIza...
```

### 4. Geliştirme sunucusunu başlatın

```bash
npm run dev
```

Tarayıcıda [http://localhost:3000](http://localhost:3000) adresini açın.

## 💬 Hangi örneklerle denenebilir?

Aşağıdaki istemler, projenin farklı yeteneklerini tetikler:

### Düz sohbet (araçsız)
```
Merhaba, kendini tanıtır mısın?
```
Sadece metin akışı — `useChat` streaming'ini gösterir.

### Tek araç çağrısı (`weather`)
```
İstanbul'da hava nasıl?
```
Model `weather` aracını çağırır → timeline'da tek bir tool accordion (⏳ → ✅) belirir, ardından cevap üretilir.

### Tek araç çağrısı (`cityInfo`)
```
İzmir'in nüfusu ve simgesi nedir?
```
`cityInfo` aracı çalışır; accordion'u açınca girdi/çıktı JSON'unu görürsünüz.

### Çoklu adım / agentic (en kapsamlısı) ⭐
```
İstanbul ve İzmir'i hava ve nüfus açısından karşılaştır
```
Model **4 araç** çağırır (her şehir için `weather` + `cityInfo`), `ADIM 2` ayracı ikinci ajan adımını gösterir, sonra tüm sonuçları tek bir karşılaştırmada sentezler. Step timeline'ın asıl gücü burada görünür.

### Aynı anda birden çok şehir
```
Ankara, İstanbul ve İzmir için hava durumunu listele
```
Model üç ayrı `weather` çağrısı yapar → üç tool accordion arka arkaya.

> Not: `cityInfo` aracında örnek veri yalnızca **İstanbul, İzmir, Ankara** için tanımlıdır; başka şehirler için "bilinmiyor" döner. `weather` aracı ise demo amaçlı rastgele sıcaklık üretir (gerçek bir API'ye bağlı değildir).

## 📂 Proje Yapısı

```
app/
├── api/chat/route.ts   # streamText + tool tanımları (weather, cityInfo)
└── page.tsx            # useChat + step timeline / tool accordion UI
.env.example            # API anahtarı şablonu
```

- **`app/api/chat/route.ts`** — Edge runtime'da çalışan sunucu köprüsü. `convertToModelMessages` ile gelen mesajları modele uyarlar, `tool()` + `zod` ile araçları tanımlar, `toUIMessageStreamResponse()` ile akışı döndürür.
- **`app/page.tsx`** — `message.parts` dizisini okuyarak `step-start`, `tool-*` ve `text` parçalarını görsel bir ajan izine dönüştürür.

## 🔧 Yeni araç ekleme

`route.ts` içindeki `tools` nesnesine bir giriş eklemeniz yeterli; UI tarafı `message.parts`'ı dinamik okuduğu için `tool-<adınız>` otomatik olarak accordion biçiminde render edilir:

```ts
tools: {
  // ...mevcut araçlar
  exchangeRate: tool({
    description: 'İki para birimi arasındaki güncel kuru getirir',
    inputSchema: z.object({ from: z.string(), to: z.string() }),
    execute: async ({ from, to }) => ({ from, to, rate: 1.07 }),
  }),
}
```

## 📝 Lisans

MIT
