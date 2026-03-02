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
      model: "gemini-2.0-flash",
      config: {
        systemInstruction,
        temperature: 0.7,
        maxOutputTokens: 2048,
      },
      history: history || [],
    });

    // 🚨 STREAM YERİNE NORMAL MESAJ GÖNDER
    const result = await chat.sendMessage({ message });

    return new Response(
      JSON.stringify({
        text: result.text,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );

  } catch (err: any) {
    console.error("Gemini hata:", err);

    return new Response(
      JSON.stringify({
        error: "Gemini API hatası",
        detail: err?.message || "Bilinmeyen hata",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
