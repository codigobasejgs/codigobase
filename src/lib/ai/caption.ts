import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import type { AISettings } from "./client";

const CAPTION_PROMPT =
  "Gere uma legenda criativa e engajante para este post de status do WhatsApp. Seja direto, autêntico, use emojis com moderação. Máximo 150 caracteres. Responda APENAS a legenda, sem explicações.";

export async function generateCaption(imageUrl: string, settings: AISettings): Promise<string> {
  if (!settings.api_key) throw new Error("AI API key not configured");

  if (settings.provider === "openai") {
    const client = new OpenAI({ apiKey: settings.api_key });
    const res = await client.chat.completions.create({
      model: settings.model || "gpt-4o",
      max_tokens: 200,
      messages: [
        {
          role: "user",
          content: [
            { type: "image_url", image_url: { url: imageUrl } },
            { type: "text", text: CAPTION_PROMPT },
          ],
        },
      ],
    });
    return res.choices[0]?.message?.content ?? "";
  }

  // Anthropic vision
  const client = new Anthropic({ apiKey: settings.api_key });
  const res = await client.messages.create({
    model: settings.model || "claude-opus-4-7",
    max_tokens: 200,
    messages: [
      {
        role: "user",
        content: [
          { type: "image", source: { type: "url", url: imageUrl } },
          { type: "text", text: CAPTION_PROMPT },
        ],
      },
    ],
  });
  const block = res.content[0];
  return block.type === "text" ? block.text : "";
}
