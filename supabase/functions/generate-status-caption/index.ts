import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
const GEMINI_MODEL = Deno.env.get('GEMINI_MODEL') || 'gemini-2.5-flash';

const adminSupabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function json(data: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: { ...corsHeaders, 'Content-Type': 'application/json', ...(init.headers || {}) },
  });
}

function cleanCaption(text: string) {
  return text
    .replace(/^['"“”]+|['"“”]+$/g, '')
    .replace(/\s+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, 280);
}

async function requireUser(authHeader: string) {
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) throw new Error('unauthorized');
  const userSupabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { global: { headers: { Authorization: authHeader } } });
  const { data, error } = await userSupabase.auth.getUser(token);
  if (error || !data.user) throw new Error('unauthorized');
  return data.user;
}

async function askGemini(prompt: string, imageBase64: string, mimeType: string, apiKey: string, model: string) {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
    body: JSON.stringify({
      contents: [{
        role: 'user',
        parts: [
          { text: prompt },
          { inline_data: { mime_type: mimeType, data: imageBase64 } },
        ],
      }],
      generationConfig: { temperature: 0.75, maxOutputTokens: 160 },
    }),
  });

  if (!response.ok) throw new Error(`Gemini error: ${(await response.text()).slice(0, 500)}`);
  const data = await response.json();
  return data?.candidates?.[0]?.content?.parts?.map((part: any) => part.text).filter(Boolean).join('\n').trim() || '';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ ok: false, error: 'Method not allowed' }, { status: 405 });

  try {
    await requireUser(req.headers.get('Authorization') || '');
    const { imageBase64, mimeType, title } = await req.json();

    if (!mimeType || typeof mimeType !== 'string' || !mimeType.startsWith('image/')) {
      return json({ ok: false, error: 'A geração de legenda só aceita imagens.' }, { status: 400 });
    }
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(mimeType)) {
      return json({ ok: false, error: 'Formato de imagem não suportado. Use PNG, JPG ou WebP.' }, { status: 400 });
    }
    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return json({ ok: false, error: 'Imagem não enviada.' }, { status: 400 });
    }
    if (imageBase64.length > 7_000_000) {
      return json({ ok: false, error: 'Imagem muito grande para análise da IA.' }, { status: 400 });
    }

    const { data: settings } = await adminSupabase.from('cb_ai_settings').select('*').eq('id', 1).single();
    const apiKey = settings?.gemini_api_key || GEMINI_API_KEY;
    const model = settings?.model || GEMINI_MODEL;
    if (!apiKey) return json({ ok: false, error: 'Gemini API Key não configurada.' }, { status: 500 });

    const prompt = `Analise a imagem anexada e crie uma legenda caprichada para Status do WhatsApp da Código Base.

Contexto da empresa: sites, sistemas, automações, inteligência artificial, dashboards, aplicativos e soluções digitais para negócios.
${title ? `Título interno informado: ${title}` : ''}

Regras:
- Português do Brasil.
- Tom premium, moderno, humano e persuasivo.
- Máximo 2 linhas.
- Inclua CTA leve quando fizer sentido.
- Use no máximo 1 emoji.
- Não invente preço, telefone, data, garantia ou informação que não aparece.
- Se a imagem for genérica, conecte com transformação digital e presença online.
- Retorne somente a legenda, sem aspas e sem explicação.`;

    const rawCaption = await askGemini(prompt, imageBase64, mimeType, apiKey, model);
    const caption = cleanCaption(rawCaption);
    if (!caption) throw new Error('Gemini retornou legenda vazia.');

    return json({ ok: true, caption, model });
  } catch (error) {
    const message = String(error?.message || error);
    console.error(message);
    return json({ ok: false, error: message === 'unauthorized' ? 'Não autorizado.' : message }, { status: message === 'unauthorized' ? 401 : 500 });
  }
});
