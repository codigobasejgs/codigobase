import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
const GEMINI_MODEL = Deno.env.get('GEMINI_MODEL') || 'gemini-2.5-flash';
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function json(data: unknown, init: ResponseInit = {}) { return new Response(JSON.stringify(data), { ...init, headers: { ...corsHeaders, 'Content-Type': 'application/json', ...(init.headers || {}) } }); }
function fallbackCaption(postType?: string, title?: string) { const kind = postType === 'story' ? 'story' : postType === 'carousel' ? 'carrossel' : postType === 'reel' ? 'reel' : 'post'; return `${title ? `${title}\n\n` : ''}Tecnologia que vende, automatiza e dá escala. 🚀\n\nA Código Base cria sites, sistemas, IA, automações, dashboards e conteúdo digital para empresas que querem crescer com estratégia.\n\nQuer transformar essa ideia em resultado? Chama a Código Base.\n\n#codigobase #tecnologia #automacao #inteligenciaartificial #${kind}`; }
async function requireUser(authHeader: string) { const token = authHeader.replace(/^Bearer\s+/i, '').trim(); if (!token) throw new Error('unauthorized'); const client = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { global: { headers: { Authorization: authHeader } } }); const { data, error } = await client.auth.getUser(token); if (error || !data.user) throw new Error('unauthorized'); }
async function getApiKey() { const { data } = await supabase.from('cb_ai_settings').select('gemini_api_key,model').eq('id', 1).maybeSingle(); return { apiKey: data?.gemini_api_key || GEMINI_API_KEY, model: data?.model?.startsWith('gemini-3') ? 'gemini-2.5-flash' : (data?.model || GEMINI_MODEL) }; }

async function askGemini(imageBase64: string, mimeType: string, postType?: string, title?: string, campaign?: string) {
  const prompt = `Crie uma legenda para Instagram da Código Base.

Marca: Código Base — sites, sistemas, automações, IA, dashboards, marketing digital e suporte técnico.
Formato: ${postType || 'feed'}.
Campanha/contexto: ${campaign || 'geral'}.
Título: ${title || 'Post da Código Base'}.
Tom: português BR, profissional, moderno, vendedor, direto.
Regras:
- não invente preço, prazo, garantia ou promoção
- use CTA claro
- até 2200 caracteres
- máximo 8 hashtags
- se for story, escreva texto curto com CTA; se for carrossel, comece com hook forte; se for reel, foque em retenção e ação
- se a imagem tiver texto, aproveite o tema visual

Retorne somente a legenda pronta.`;
  const { apiKey, model } = await getApiKey();
  if (!apiKey) return fallbackCaption(postType, title);
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
    body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }, { inlineData: { mimeType, data: imageBase64 } }] }], generationConfig: { temperature: 0.8, maxOutputTokens: 520 } }),
  });
  if (!res.ok) return fallbackCaption(postType, title);
  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).filter(Boolean).join('\n').trim() || fallbackCaption(postType, title);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    await requireUser(req.headers.get('Authorization') || '');
    const { imageBase64, mimeType, postType, title, campaign } = await req.json();
    if (!imageBase64 || !mimeType?.startsWith('image/')) return json({ ok: false, error: 'Imagem obrigatória.' }, { status: 400 });
    if (imageBase64.length > 7_000_000) return json({ ok: false, error: 'Imagem muito grande. Use até 5 MB.' }, { status: 400 });
    const caption = await askGemini(imageBase64, mimeType, postType, title, campaign);
    return json({ ok: true, caption });
  } catch (error) {
    const message = String(error?.message || error);
    return json({ ok: false, error: message === 'unauthorized' ? 'Não autorizado.' : message }, { status: message === 'unauthorized' ? 401 : 500 });
  }
});
