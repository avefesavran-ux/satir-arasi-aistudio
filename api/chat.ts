import { GoogleGenAI } from "@google/genai";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).send("Method not allowed");
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).send("GEMINI_API_KEY is not set in environment variables.");
    }

    const { message, history, systemInstruction } = req.body;

    const ai = new GoogleGenAI({ apiKey });
    const chat = ai.chats.create({
      model: "gemini-3.1-pro-preview",
      config: {
        systemInstruction,
        temperature: 0.7,
        maxOutputTokens: 8192,
      },
      history: history || [],
    });

    const result = await chat.sendMessageStream({ message });

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');

    for await (const chunk of result) {
      const text = chunk.text;
      if (text) {
        res.write(text);
      }
    }
    res.end();

  } catch (err: any) {
    console.error("Gemini Error:", err);
    return res.status(500).json({
      error: err?.message || "Internal Server Error",
    });
  }
}
