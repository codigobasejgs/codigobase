import assert from 'node:assert/strict';
import test from 'node:test';
import { generateCompleteGemini } from '../../supabase/functions/_shared/geminiCompletion.ts';

function response(text: string, finishReason: string, usage: Record<string, number> = {}) {
  return new Response(JSON.stringify({
    candidates: [{ content: { role: 'model', parts: [{ text }] }, finishReason }],
    usageMetadata: usage,
    modelVersion: 'gemini-3.5-flash-001',
    responseId: `response-${finishReason}`,
  }), { status: 200, headers: { 'Content-Type': 'application/json' } });
}

const input = {
  apiKey: 'secret-key',
  model: 'gemini-3.5-flash',
  systemInstruction: 'Responda em português.',
  userParts: [{ text: 'Preciso de um site.' }],
};

test('aceita resposta concluída sem continuação', async () => {
  const calls: unknown[] = [];
  const result = await generateCompleteGemini({ ...input, fetchImpl: async (_url, init) => {
    calls.push(JSON.parse(String(init?.body)));
    return response('Consigo sim. Qual tipo de site?', 'STOP');
  } });
  assert.equal(result.complete, true);
  assert.equal(result.text, 'Consigo sim. Qual tipo de site?');
  assert.equal(calls.length, 1);
  assert.deepEqual(result.metadata.finishReasons, ['STOP']);
});

test('continua uma única vez quando Gemini atinge limite', async () => {
  const bodies: any[] = [];
  const replies = [
    response('Eu posso te ', 'MAX_TOKENS', { promptTokenCount: 900, thoughtsTokenCount: 650, candidatesTokenCount: 12, totalTokenCount: 1562 }),
    response('ajudar com isso. Qual é seu objetivo?', 'STOP', { promptTokenCount: 920, thoughtsTokenCount: 20, candidatesTokenCount: 16, totalTokenCount: 956 }),
  ];
  const result = await generateCompleteGemini({ ...input, fetchImpl: async (_url, init) => {
    bodies.push(JSON.parse(String(init?.body)));
    return replies.shift()!;
  } });
  assert.equal(result.complete, true);
  assert.equal(result.text, 'Eu posso te ajudar com isso. Qual é seu objetivo?');
  assert.equal(bodies.length, 2);
  assert.equal(bodies[1].contents[1].role, 'model');
  assert.equal(bodies[1].contents[1].parts[0].text, 'Eu posso te ');
  assert.equal(result.metadata.continuationUsed, true);
  assert.deepEqual(result.metadata.finishReasons, ['MAX_TOKENS', 'STOP']);
  assert.equal(result.metadata.usage.thoughtsTokenCount, 670);
});

test('preserva palavra dividida no limite de tokens', async () => {
  const replies = [response('automa', 'MAX_TOKENS'), response('ção pronta.', 'STOP')];
  const result = await generateCompleteGemini({ ...input, fetchImpl: async () => replies.shift()! });
  assert.equal(result.text, 'automação pronta.');
});

test('preserva espaço existente no limite de tokens', async () => {
  const replies = [response('Posso te ', 'MAX_TOKENS'), response('ajudar agora.', 'STOP')];
  const result = await generateCompleteGemini({ ...input, fetchImpl: async () => replies.shift()! });
  assert.equal(result.text, 'Posso te ajudar agora.');
});

test('retém resposta após segundo limite sem terceira tentativa', async () => {
  let calls = 0;
  const result = await generateCompleteGemini({ ...input, fetchImpl: async () => {
    calls += 1;
    return response(calls === 1 ? 'Resposta' : ' ainda', 'MAX_TOKENS');
  } });
  assert.equal(result.complete, false);
  assert.equal(result.text, '');
  assert.equal(result.reason, 'MAX_TOKENS');
  assert.equal(calls, 2);
});

test('retém bloqueio de segurança sem continuação', async () => {
  let calls = 0;
  const result = await generateCompleteGemini({ ...input, fetchImpl: async () => {
    calls += 1;
    return response('texto parcial', 'SAFETY');
  } });
  assert.equal(result.complete, false);
  assert.equal(result.text, '');
  assert.equal(result.reason, 'SAFETY');
  assert.equal(calls, 1);
});

test('retém candidato vazio ou malformado', async () => {
  const result = await generateCompleteGemini({ ...input, fetchImpl: async () => new Response(JSON.stringify({ candidates: [{ finishReason: 'STOP' }] }), { status: 200 }) });
  assert.equal(result.complete, false);
  assert.equal(result.reason, 'EMPTY_RESPONSE');
});

test('configura Gemini 3 para conversa curta e separa instruções', async () => {
  let body: any;
  await generateCompleteGemini({ ...input, fetchImpl: async (_url, init) => {
    body = JSON.parse(String(init?.body));
    return response('Olá!', 'STOP');
  } });
  assert.equal(body.systemInstruction.parts[0].text, input.systemInstruction);
  assert.equal(body.contents[0].parts[0].text, input.userParts[0].text);
  assert.equal(body.generationConfig.maxOutputTokens, 1200);
  assert.equal(body.generationConfig.thinkingConfig.thinkingLevel, 'minimal');
});

test('omite thinkingLevel para modelo legado', async () => {
  let body: any;
  await generateCompleteGemini({ ...input, model: 'gemini-2.5-flash', fetchImpl: async (_url, init) => {
    body = JSON.parse(String(init?.body));
    return response('Olá!', 'STOP');
  } });
  assert.equal('thinkingConfig' in body.generationConfig, false);
});

test('metadados sanitizados não expõem conteúdo nem chave', async () => {
  const result = await generateCompleteGemini({ ...input, fetchImpl: async () => response('Resposta privada', 'STOP') });
  const serialized = JSON.stringify(result.metadata);
  assert.equal(serialized.includes(input.apiKey), false);
  assert.equal(serialized.includes(input.systemInstruction), false);
  assert.equal(serialized.includes(input.userParts[0].text), false);
  assert.equal(serialized.includes('Resposta privada'), false);
  assert.equal(result.metadata.outputCharacters, 'Resposta privada'.length);
});
