import { google } from '@ai-sdk/google';
import {
  streamText,
  convertToModelMessages,
  tool,
  stepCountIs,
  type UIMessage,
} from 'ai';
import { z } from 'zod';

// İsteklerin hızlı şekilde stream edilmesi için Edge Runtime
export const runtime = 'edge';

export async function POST(req: Request) {
  // Front-end'den gelen UIMessage geçmişini alıyoruz
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: google('gemini-2.5-flash'),
    // UI mesajlarını modelin beklediği formata çeviriyoruz
    messages: await convertToModelMessages(messages),

    // Modelin araç çağırıp, sonucu alıp, sonra cevap üretebilmesi için
    // çok adımlı çalışmayı açıyoruz
    stopWhen: stepCountIs(5),

    tools: {
      // Aracın adı 'weather' — UI'da 'tool-weather' olarak görünecek
      weather: tool({
        description: 'Belirtilen bir şehir için anlık hava durumunu getirir',
        inputSchema: z.object({
          city: z.string().describe('Hava durumu sorgulanacak şehir'),
        }),
        // Gerçek hayatta burada bir hava durumu API'sine istek atardınız
        execute: async ({ city }) => {
          const temperature = Math.round(Math.random() * 25 + 5);
          return { city, temperature, conditions: 'güneşli' };
        },
      }),

      // İkinci araç — çoklu adımlı (agentic) akışı tetiklemek için.
      // "İstanbul'u tanıt" gibi bir soru ikisini de sırayla çağırır.
      cityInfo: tool({
        description: 'Bir şehrin nüfusunu ve öne çıkan bir simgesini getirir',
        inputSchema: z.object({
          city: z.string().describe('Bilgisi istenen şehir'),
        }),
        execute: async ({ city }) => {
          const db: Record<string, { population: string; landmark: string }> = {
            İstanbul: { population: '15.6M', landmark: 'Kız Kulesi' },
            İzmir: { population: '4.4M', landmark: 'Saat Kulesi' },
            Ankara: { population: '5.7M', landmark: 'Anıtkabir' },
          };
          const info = db[city] ?? { population: 'bilinmiyor', landmark: '—' };
          return { city, ...info };
        },
      }),
    },
  });

  // v5/v6'te akış, UI mesaj protokolüne dönüştürülür
  return result.toUIMessageStreamResponse();
}
