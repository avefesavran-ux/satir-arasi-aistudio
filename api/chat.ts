import { GoogleGenAI } from "@google/genai";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).send("Method not allowed");
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).send("GEMINI_API_KEY tanımlı değil.");
    }

    // 🔥 Node ortamında body böyle alınır
    const { message, history, systemInstruction } = req.body;

    const ai = new GoogleGenAI({ apiKey });

    const chat = ai.chats.create({
      model: "gemini-3-flash-preview",
      config: {
        systemInstruction,
        temperature: 0.7,
        maxOutputTokens: 2048,
      },
      history: history || [],
    });

    const result = await chat.sendMessage({ message });

    return res.status(200).json({
      text: result.text,
    });

  } catch (err: any) {
    console.error("Gemini hata:", err);
    return res.status(500).json({
      error: err?.message || "Bilinmeyen hata",
    });
  }
}
