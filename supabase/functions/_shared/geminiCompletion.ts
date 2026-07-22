type GeminiPart = { text?: string; thought?: boolean; thoughtSignature?: string; [key: string]: unknown };
type FetchLike = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;
type Usage = Record<string, number>;

type Attempt = {
  text: string;
  finishReason: string;
  content: { role: string; parts: GeminiPart[] } | null;
  usage: Usage;
  modelVersion: string | null;
  responseId: string | null;
  durationMs: number;
};

export type GeminiCompletionMetadata = {
  model: string;
  modelVersions: string[];
  responseIds: string[];
  attempts: number;
  finishReasons: string[];
  continuationUsed: boolean;
  usage: Usage;
  durationMs: number;
  outputCharacters: number;
};

type Input = {
  apiKey: string;
  model: string;
  systemInstruction: string;
  userParts: GeminiPart[];
  fetchImpl?: FetchLike;
};

export type GeminiCompletionResult = {
  complete: boolean;
  text: string;
  reason: string | null;
  metadata: GeminiCompletionMetadata;
};

function textFromContent(content: Attempt['content']) {
  return content?.parts?.filter((part) => !part.thought && typeof part.text === 'string').map((part) => part.text).join('') || '';
}

function mergeUsage(attempts: Attempt[]) {
  return attempts.reduce((total, attempt) => {
    for (const [key, value] of Object.entries(attempt.usage || {})) {
      if (typeof value === 'number') total[key] = (total[key] || 0) + value;
    }
    return total;
  }, {} as Usage);
}

function metadata(model: string, attempts: Attempt[], outputCharacters: number): GeminiCompletionMetadata {
  return {
    model,
    modelVersions: attempts.map((attempt) => attempt.modelVersion).filter((value): value is string => Boolean(value)),
    responseIds: attempts.map((attempt) => attempt.responseId).filter((value): value is string => Boolean(value)),
    attempts: attempts.length,
    finishReasons: attempts.map((attempt) => attempt.finishReason),
    continuationUsed: attempts.length > 1,
    usage: mergeUsage(attempts),
    durationMs: attempts.reduce((sum, attempt) => sum + attempt.durationMs, 0),
    outputCharacters,
  };
}

function joinContinuation(first: string, second: string) {
  return `${first}${second}`.trim();
}

async function generateAttempt(fetchImpl: FetchLike, apiKey: string, model: string, body: Record<string, unknown>): Promise<Attempt> {
  const startedAt = Date.now();
  const response = await fetchImpl(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`Gemini error: ${(await response.text()).slice(0, 500)}`);
  const data = await response.json();
  const candidate = data?.candidates?.[0];
  const content = candidate?.content || null;
  return {
    text: textFromContent(content),
    finishReason: candidate?.finishReason || 'UNKNOWN',
    content,
    usage: data?.usageMetadata || {},
    modelVersion: data?.modelVersion || null,
    responseId: data?.responseId || null,
    durationMs: Date.now() - startedAt,
  };
}

export async function generateCompleteGemini(input: Input): Promise<GeminiCompletionResult> {
  const fetchImpl = input.fetchImpl || fetch;
  const generationConfig: Record<string, unknown> = { temperature: 0.4, maxOutputTokens: 1200 };
  if (input.model.startsWith('gemini-3')) generationConfig.thinkingConfig = { thinkingLevel: 'minimal' };

  const initialContents = [{ role: 'user', parts: input.userParts }];
  const first = await generateAttempt(fetchImpl, input.apiKey, input.model, {
    systemInstruction: { parts: [{ text: input.systemInstruction }] },
    contents: initialContents,
    generationConfig,
  });
  const attempts = [first];

  if (first.finishReason === 'STOP' && first.text.trim()) {
    const text = first.text.trim();
    return { complete: true, text, reason: null, metadata: metadata(input.model, attempts, text.length) };
  }

  if (first.finishReason !== 'MAX_TOKENS' || !first.content || !first.text.trim()) {
    const reason = first.text.trim() ? first.finishReason : 'EMPTY_RESPONSE';
    return { complete: false, text: '', reason, metadata: metadata(input.model, attempts, 0) };
  }

  const continuationConfig = { ...generationConfig, maxOutputTokens: 600 };
  const continuation = await generateAttempt(fetchImpl, input.apiKey, input.model, {
    systemInstruction: { parts: [{ text: input.systemInstruction }] },
    contents: [
      ...initialContents,
      first.content,
      { role: 'user', parts: [{ text: 'Continue exatamente do ponto em que a resposta foi interrompida. Retorne somente o trecho restante, sem repetir o início.' }] },
    ],
    generationConfig: continuationConfig,
  });
  attempts.push(continuation);

  if (continuation.finishReason !== 'STOP' || !continuation.text.trim()) {
    const reason = continuation.text.trim() ? continuation.finishReason : 'EMPTY_RESPONSE';
    return { complete: false, text: '', reason, metadata: metadata(input.model, attempts, 0) };
  }

  const text = joinContinuation(first.text, continuation.text);
  return { complete: true, text, reason: null, metadata: metadata(input.model, attempts, text.length) };
}
