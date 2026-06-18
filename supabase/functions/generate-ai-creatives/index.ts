import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY') || '';
const OPENAI_IMAGE_MODEL = Deno.env.get('OPENAI_IMAGE_MODEL') || 'gpt-image-1';
const OPENAI_IMAGE_SIZE = Deno.env.get('OPENAI_IMAGE_SIZE') || '1024x1792';
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function json(data: unknown, init: ResponseInit = {}) { return new Response(JSON.stringify(data), { ...init, headers: { ...corsHeaders, 'Content-Type': 'application/json', ...(init.headers || {}) } }); }
async function requireUser(authHeader: string) { const token = authHeader.replace(/^Bearer\s+/i, '').trim(); if (!token) throw new Error('unauthorized'); if (token === SUPABASE_SERVICE_ROLE_KEY) return { id: null }; const client = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { global: { headers: { Authorization: authHeader } } }); const { data, error } = await client.auth.getUser(token); if (error || !data.user) throw new Error('unauthorized'); return data.user; }
function bytesFromBase64(b64: string) { const bin = atob(b64); const bytes = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i); return bytes; }
function slug(text: string) { return text.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase().slice(0, 80); }
function caption(themeCategory: string, themeOption: string, draftType: string) { return `✨ ${themeOption.toUpperCase()} COM TECNOLOGIA DE PONTA! ✨\n\nA CÓDIGO-BASE transforma ${themeCategory} em soluções digitais que chamam atenção, geram autoridade e ajudam sua empresa a vender mais com estratégia.\n\n${draftType === 'carousel' ? 'ARRASTE PARA O LADO E VEJA COMO APLICAR ISSO NO SEU NEGÓCIO! ➡️' : 'RESPONDA ESTE STORY E DESCUBRA COMO APLICAR ISSO NO SEU NEGÓCIO! 🚀'}\n\n━━━━━━━━━━━━━━━━━━━━━━━━\n\n💡 O QUE VOCÊ PODE GANHAR:\n\n✅ Atendimento mais rápido e profissional\n✅ Menos tarefas manuais no dia a dia\n✅ Mais presença digital, leads e oportunidades\n✅ Tecnologia sob medida para crescer com resultado\n\n━━━━━━━━━━━━━━━━━━━━━━━━\n\n📲 FALE COM A CÓDIGO-BASE:\n\n🌐 Site: www.codigobase.com.br\n✨ WhatsApp: (11) 98626-2240\n📧 E-mail: projetos.jgs@gmail.com\n\n#CodigoBase #Tecnologia #InteligenciaArtificial #MarketingDigital #DesenvolvimentoDeSoftware #SaaS #PowerBI #ChatbotIA #TransformacaoDigital #Resultados #Inovacao #Negocios #SaoPaulo #Brasil #Tech`; }
function imagePrompt(themeCategory: string, themeOption: string, draftType: string, index: number) { return `Vertical 9:16 premium social media creative for Código Base, Brazilian technology agency. Theme: ${themeCategory} / ${themeOption}. Asset type: ${draftType}, slide ${index + 1}. Futuristic tech aesthetic, dark navy background, cyan/orange/pink neon accents, professional SaaS dashboard elements, AI automation, WhatsApp/Instagram growth, clean 3D devices, high contrast, modern Brazilian business audience, elite agency ad, attention-grabbing composition. If text appears, use only short large Portuguese words, no tiny text, no fake numbers, no logos from other brands.`; }
async function logEvent(draftId: string | null, eventType: string, status: string, message?: string, response?: unknown) { await supabase.from('cb_ai_creative_logs').insert({ draft_id: draftId, event_type: eventType, status, message, response: response || null }); }
async function generateImage(prompt: string) { const res = await fetch('https://api.openai.com/v1/images/generations', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENAI_API_KEY}` }, body: JSON.stringify({ model: OPENAI_IMAGE_MODEL, prompt, size: OPENAI_IMAGE_SIZE, n: 1 }) }); const data = await res.json().catch(() => ({})); if (!res.ok) throw new Error(data?.error?.message || `OpenAI image ${res.status}`); const b64 = data?.data?.[0]?.b64_json; if (!b64) throw new Error('OpenAI não retornou imagem base64'); return { b64, response: data }; }
async function createDraft(userId: string, draftType: 'story' | 'carousel', platformTargets: string[], themeCategory: string, themeOption: string, slideCount: number, scheduledAt?: string) {
  const title = `${draftType === 'story' ? 'Story' : 'Carrossel'} • ${themeCategory} • ${themeOption}`;
  const { data: draft, error } = await supabase.from('cb_ai_creative_drafts').insert({ draft_type: draftType, platform_targets: platformTargets, theme_category: themeCategory, theme_option: themeOption, title, caption: caption(themeCategory, themeOption, draftType), status: 'generated', scheduled_at: scheduledAt || null, created_by: userId }).select('id').single();
  if (error) throw new Error(error.message);
  for (let i = 0; i < slideCount; i++) {
    const prompt = imagePrompt(themeCategory, themeOption, draftType, i);
    await logEvent(draft.id, 'image_generation_started', 'running', prompt);
    const generated = await generateImage(prompt);
    const path = `${draft.id}/${String(i + 1).padStart(2, '0')}-${slug(themeOption)}.png`;
    const bytes = bytesFromBase64(generated.b64);
    const { error: uploadError } = await supabase.storage.from('ai-generated-creatives').upload(path, bytes, { contentType: 'image/png', upsert: true });
    if (uploadError) throw new Error(uploadError.message);
    const { data: publicUrl } = supabase.storage.from('ai-generated-creatives').getPublicUrl(path);
    const { error: assetError } = await supabase.from('cb_ai_creative_assets').insert({ draft_id: draft.id, position: i, prompt, media_url: publicUrl.publicUrl, media_path: path, mime_type: 'image/png', openai_response: generated.response });
    if (assetError) throw new Error(assetError.message);
    await logEvent(draft.id, 'image_generated', 'ok', path, { url: publicUrl.publicUrl });
  }
  return draft.id;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const user = await requireUser(req.headers.get('Authorization') || '');
    if (!OPENAI_API_KEY) throw new Error('OPENAI_API_KEY não configurada');
    const body = await req.json();
    const themeCategory = body.themeCategory || 'IA / Chatbot';
    const themeOption = body.themeOption || 'Vendas';
    const platforms = Array.isArray(body.platforms) && body.platforms.length ? body.platforms : ['instagram', 'whatsapp'];
    const storyCount = Math.max(0, Math.min(10, Number(body.storyCount || 3)));
    const carouselSlideCount = Math.max(2, Math.min(10, Number(body.carouselSlideCount || 5)));
    const scheduledAt = body.scheduledAt || null;
    const drafts: string[] = [];
    for (let i = 0; i < storyCount; i++) drafts.push(await createDraft(user.id, 'story', platforms, themeCategory, themeOption, 1, scheduledAt));
    drafts.push(await createDraft(user.id, 'carousel', platforms, themeCategory, themeOption, carouselSlideCount, scheduledAt));
    return json({ ok: true, drafts });
  } catch (error) {
    const message = String(error?.message || error);
    return json({ ok: false, error: message === 'unauthorized' ? 'Não autorizado.' : message }, { status: message === 'unauthorized' ? 401 : 500 });
  }
});
