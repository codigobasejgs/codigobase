import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";

export type AISettings = {
  provider: string;
  api_key: string | null;
  model: string;
  system_prompt: string;
  max_tokens: number;
};

export type ChatMessage = { role: "user" | "assistant"; content: string };

export async function generateAIReply(
  messages: ChatMessage[],
  settings: AISettings
): Promise<string> {
  if (!settings.api_key) throw new Error("AI API key not configured");

  if (settings.provider === "openai") {
    const client = new OpenAI({ apiKey: settings.api_key });
    const res = await client.chat.completions.create({
      model: settings.model || "gpt-4o",
      max_tokens: settings.max_tokens,
      messages: [
        ...(settings.system_prompt ? [{ role: "system" as const, content: settings.system_prompt }] : []),
        ...messages,
      ],
    });
    return res.choices[0]?.message?.content ?? "";
  }

  // Default: Anthropic
  const client = new Anthropic({ apiKey: settings.api_key });
  const res = await client.messages.create({
    model: settings.model || "claude-opus-4-7",
    max_tokens: settings.max_tokens,
    system: settings.system_prompt || undefined,
    messages,
  });
  const block = res.content[0];
  return block.type === "text" ? block.text : "";
}
