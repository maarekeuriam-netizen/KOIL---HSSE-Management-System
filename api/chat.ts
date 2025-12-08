// api/chat.ts

import OpenAI from "openai";

// Create OpenAI client using the key you stored in Vercel
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Vercel Node serverless function
export default async function handler(req: any, res: any) {
  // Simple health check so opening /api/chat in the browser doesn’t crash
  if (req.method === "GET") {
    res.status(200).json({ status: "ok" });
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const { message } = req.body;

    if (!message || typeof message !== "string") {
      res.status(400).json({ error: "Missing 'message' in request body" });
      return;
    }

    const completion = await client.chat.completions.create({
      model: "gpt-4.1-mini", // you can change model later if you like
      messages: [
        {
          role: "system",
          content:
            "You are a helpful HSSE assistant for the KOIL HSSE Management web app.",
        },
        { role: "user", content: message },
      ],
    });

    const reply =
      completion.choices[0]?.message?.content ?? "I couldn't generate a reply.";

    res.status(200).json({ reply });
  } catch (err: any) {
    console.error("Chat API error:", err);
    res.status(500).json({
      error: "Internal Server Error",
      details: err?.message ?? String(err),
    });
  }
}
