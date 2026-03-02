import { GoogleGenAI } from "@google/genai";
export const maxDuration = 60;

export default async function handler(req: Request) {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const { message, history, systemInstruction } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return new Response("GEMINI_API_KEY tanımlı değil.", { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });

    const chat = ai.chats.create({
      model: "gemini-3.1-pro-preview", // MODEL DEĞİŞTİ
      config: {
        systemInstruction,
        temperature: 0.7,
        maxOutputTokens: 4096,
      },
      history: history || [],
    });

    let responseStream;

    try {
      responseStream = await chat.sendMessageStream({ message });
    } catch (error: any) {
      console.error("Gemini API hatası:", error);
      return new Response(
        JSON.stringify({
          error: "Gemini API hatası",
          detail: error.message,
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of responseStream) {
            const text = chunk.text;
            if (text) {
              controller.enqueue(new TextEncoder().encode(text));
            }
          }
        } catch (err: any) {
          console.error("Stream hatası:", err);
          controller.error(err);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (err: any) {
    console.error("api/chat genel hata:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
