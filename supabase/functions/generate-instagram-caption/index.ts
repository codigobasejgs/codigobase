import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
const GEMINI_MODEL = Deno.env.get('GEMINI_MODEL') || 'gemini-2.5-flash';
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function json(data: unknown, init: ResponseInit = {}) { return new Response(JSON.stringify(data), { ...init, headers: { ...corsHeaders, 'Content-Type': 'application/json', ...(init.headers || {}) } }); }
function fallbackCaption(postType?: string, title?: string) { const kind = postType === 'story' ? 'STORY' : postType === 'carousel' ? 'CARROSSEL' : postType === 'reel' ? 'REEL' : 'POST'; return `✨ ${title || 'O FUTURO DA TECNOLOGIA ESTÁ NO AR!'} ✨\n\nA CÓDIGO-BASE transforma tecnologia, IA, automações, dashboards e marketing digital em crescimento real para empresas que querem vender mais e operar melhor.\n\nARRASTE PARA O LADO E DESCUBRA COMO LEVAR SEU NEGÓCIO AO PRÓXIMO NÍVEL! ➡️\n\n━━━━━━━━━━━━━━━━━━━━━━━━\n\n💡 PRONTO PARA TRANSFORMAR SUA EMPRESA COM TECNOLOGIA DE PONTA?\n\n📲 ACESSE AGORA E FALE COM A CÓDIGO-BASE:\n\n🌐 Site: www.codigobase.com.br\n✨ WhatsApp: (11) 98626-2240\n📧 E-mail: projetos.jgs@gmail.com\n\n#CodigoBase #${kind} #Tecnologia #InteligenciaArtificial #MarketingDigital #DesenvolvimentoDeSoftware #SaaS #PowerBI #ChatbotIA #TransformacaoDigital #Resultados #Inovacao #Empreendedorismo #Negocios #SaoPaulo #Brasil #Tech`; }
async function requireUser(authHeader: string) { const token = authHeader.replace(/^Bearer\s+/i, '').trim(); if (!token) throw new Error('unauthorized'); const client = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { global: { headers: { Authorization: authHeader } } }); const { data, error } = await client.auth.getUser(token); if (error || !data.user) throw new Error('unauthorized'); }
async function getApiKey() { const { data } = await supabase.from('cb_ai_settings').select('gemini_api_key,model').eq('id', 1).maybeSingle(); return { apiKey: data?.gemini_api_key || GEMINI_API_KEY, model: data?.model?.startsWith('gemini-3') ? 'gemini-2.5-flash' : (data?.model || GEMINI_MODEL) }; }

async function askGemini(images: { imageBase64: string; mimeType: string }[], postType?: string, title?: string, campaign?: string) {
  const prompt = `Crie uma legenda ELITE para Instagram da CÓDIGO-BASE, baseada nas imagens anexadas.

Marca: CÓDIGO-BASE — tecnologia, IA, automações, sites, SaaS, dashboards, Power BI, chatbots, marketing digital e suporte técnico.
Formato: ${postType || 'feed'}.
Campanha/contexto: ${campaign || 'geral'}.
Título: ${title || 'Post da Código Base'}.

OBRIGATÓRIO: escrever no estilo do exemplo abaixo, com emojis, headline forte, separadores, benefícios, CTA e contatos:

✨ O FUTURO DA TECNOLOGIA ESTÁ NO AR! ✨

É com imenso orgulho que a CÓDIGO-BASE apresenta uma solução criada para fazer empresas VENDEREM MAIS, automatizarem processos e crescerem com resultados reais.

ARRASTE PARA O LADO E EXPLORE A REVOLUÇÃO DIGITAL QUE CRIAMOS! ➡️

━━━━━━━━━━━━━━━━━━━━━━━━

NO CONTEÚDO, VOCÊ VAI DESCOBRIR:

✅ SOLUÇÕES COMPLETAS: sistemas, SaaS, IA, chatbots, dashboards, Power BI e marketing digital.
✅ PROBLEMAS VIRANDO OPORTUNIDADES: atendimento lento, processos manuais e baixa conversão viram automação, performance e vendas.
✅ RESULTADOS E AUTORIDADE: destaque benefícios, maturidade digital, eficiência, escala, suporte e crescimento.

━━━━━━━━━━━━━━━━━━━━━━━━

💡 PRONTO PARA LEVAR SUA EMPRESA AO PRÓXIMO NÍVEL COM TECNOLOGIA DE PONTA?

📲 ACESSE AGORA E TRANSFORME SEU NEGÓCIO:

🌐 Site: www.codigobase.com.br
✨ WhatsApp: (11) 98626-2240
📧 E-mail: projetos.jgs@gmail.com

#CodigoBase #Tecnologia #InteligenciaArtificial #MarketingDigital #DesenvolvimentoDeSoftware #SaaS #PowerBI #ChatbotIA #TransformacaoDigital #Resultados #Inovacao #Empreendedorismo #Negocios #Startup #SaoPaulo #Brasil #Tech

Regras finais:
- máximo 2200 caracteres
- use emojis estrategicamente
- faça a primeira frase parar o scroll
- se for carrossel, cite “arraste para o lado”
- se for story, crie versão mais direta, mas ainda com CTA e contatos
- não invente preço, prazo, garantia ou número falso
- aproveite textos/elementos visuais das imagens
- retorne somente a legenda pronta.`;
  const { apiKey, model } = await getApiKey();
  if (!apiKey) return fallbackCaption(postType, title);
  const parts: any[] = [{ text: prompt }, ...images.slice(0, 6).map((img) => ({ inlineData: { mimeType: img.mimeType, data: img.imageBase64 } }))];
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
    body: JSON.stringify({ contents: [{ role: 'user', parts }], generationConfig: { temperature: 0.9, maxOutputTokens: 900 } }),
  });
  if (!res.ok) return fallbackCaption(postType, title);
  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).filter(Boolean).join('\n').trim() || fallbackCaption(postType, title);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    await requireUser(req.headers.get('Authorization') || '');
    const { imageBase64, mimeType, images, postType, title, campaign } = await req.json();
    const inputImages = Array.isArray(images) && images.length ? images : [{ imageBase64, mimeType }];
    if (!inputImages[0]?.imageBase64 || !inputImages[0]?.mimeType?.startsWith('image/')) return json({ ok: false, error: 'Imagem obrigatória.' }, { status: 400 });
    if (inputImages.some((img: any) => String(img.imageBase64 || '').length > 7_000_000)) return json({ ok: false, error: 'Imagem muito grande. Use até 5 MB por imagem.' }, { status: 400 });
    const caption = await askGemini(inputImages, postType, title, campaign);
    return json({ ok: true, caption });
  } catch (error) {
    const message = String(error?.message || error);
    return json({ ok: false, error: message === 'unauthorized' ? 'Não autorizado.' : message }, { status: message === 'unauthorized' ? 401 : 500 });
  }
});
