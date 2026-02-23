import { GoogleGenAI } from "@google/genai";

export const config = { runtime: 'edge' };

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const { message, history, systemInstruction } = await req.json();

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const chat = ai.chats.create({
    model: "gemini-3.1-pro-preview",
    config: {
      systemInstruction,
      temperature: 0.7,
      maxOutputTokens: 8192,
    },
    history
  });

  const responseStream = await chat.sendMessageStream({ message });

  const stream = new ReadableStream({
    async start(controller) {
      for await (const chunk of responseStream) {
        const text = typeof chunk.text === 'function' ? chunk.text() : chunk.text;
        if (text) controller.enqueue(new TextEncoder().encode(text));
      }
      controller.close();
    }
  });

  return new Response(stream, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
  });
}
```

**Aşama 3 — Vercel'de environment variable ekleyin:**

Vercel Dashboard → Projeniz → **Settings** → **Environment Variables** → `GEMINI_API_KEY` = yeni key → Save.

**Aşama 4 — `.env.local`'ı güncelleyin:**
```
GEMINI_API_KEY=yeni_key
