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
    .slice(0, 1400);
}

function isBadCaption(text: string) {
  const lower = text.toLowerCase().trim();
  const banned = ['seu negócio merece', 'sua empresa cresce', 'transforme sua empresa', 'tenha um site profissional', 'presença digital que ele'];
  const weakEnd = [' como uma', ' para sua', ' com uma', ' de uma', ' que ele', ' que ela', ' e sistemas funcionando como uma'];
  return text.length < 90 || banned.some((item) => lower.includes(item)) || weakEnd.some((end) => lower.endsWith(end)) || !/[✨🚀💡📲🔥⚡️🎯]/.test(text);
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
          { inline_data: { mime_type: mimeType, data: imageBase64 } },
          { text: prompt },
        ],
      }],
      generationConfig: { temperature: 0.95, maxOutputTokens: 260 },
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
    const configuredModel = settings?.model || GEMINI_MODEL;
    const model = configuredModel?.startsWith('gemini-3') ? 'gemini-2.5-flash' : configuredModel;
    if (!apiKey) return json({ ok: false, error: 'Gemini API Key não configurada.' }, { status: 500 });

    const prompt = `Você é DIRETOR DE CRIAÇÃO de uma agência premium. Crie uma legenda para STATUS DO WHATSAPP da Código Base usando a IMAGEM como referência principal.

PASSO INTERNO (não mostrar): descreva mentalmente 3 elementos visuais reais da imagem: objeto/tela/texto/cor/composição/serviço demonstrado. A legenda final precisa usar pelo menos 1 desses elementos.

EMPRESA:
Código Base cria sites, sistemas, automações, IA, dashboards, aplicativos e soluções digitais para empresas venderem mais, parecerem mais profissionais e ganharem tempo.
${title ? `Título interno informado: ${title}` : ''}

NÃO ACEITO:
- Frases incompletas.
- Frases secas/genéricas.
- "Seu negócio merece..."
- "Sua empresa cresce..."
- "Transforme sua empresa..."
- "Seu site e sistemas funcionando como..."
- Texto que poderia servir para qualquer imagem.

ENTREGUE 1 LEGENDA NESSE PADRÃO ELITE:

✨ HEADLINE FORTE EM CAIXA ALTA COM EMOJI ✨

Texto emocional e vendedor conectando a imagem com tecnologia, IA, automação, sites, dashboards, marketing ou transformação digital.

━━━━━━━━━━━━━━━━━━━━━━━━

💡 BENEFÍCIOS QUE CHAMAM ATENÇÃO:

✅ 2 a 4 bullets com benefícios claros, autoridade e desejo.
✅ Mostrar transformação: menos tarefas manuais, mais leads, atendimento melhor, presença digital forte.
✅ Se for carrossel, chamar para arrastar; se for story, chamar para responder/chamar no WhatsApp.

━━━━━━━━━━━━━━━━━━━━━━━━

📲 CTA FINAL COM CONTATOS:

🌐 Site: www.codigobase.com.br
✨ WhatsApp: (11) 98626-2240
📧 E-mail: projetos.jgs@gmail.com

REGRAS:
- Português BR.
- Com emojis.
- Estilo premium, fora da curva, alto impacto, engajamento e conversão.
- Não invente preço, prazo, garantia ou número falso.
- Se houver texto na imagem, aproveite o sentido desse texto.
- Retorne só a legenda final.`;

    const rawCaption = await askGemini(prompt, imageBase64, mimeType, apiKey, model);
    let caption = cleanCaption(rawCaption);

    if (isBadCaption(caption)) {
      const retryPrompt = `${prompt}\n\nA tentativa anterior ficou fraca/incompleta: "${caption}". Refaça melhor: cite um elemento visual da imagem, use exatamente 1 emoji, 3 linhas completas, CTA final. Não use frases genéricas.`;
      caption = cleanCaption(await askGemini(retryPrompt, imageBase64, mimeType, apiKey, model));
    }

    if (!caption || isBadCaption(caption)) {
      caption = `✨ O FUTURO DA SUA PRESENÇA DIGITAL COMEÇA AQUI! ✨\n\nA Código Base une tecnologia, IA, automação e design para transformar ideias em experiências que vendem mais e geram autoridade.\n\n━━━━━━━━━━━━━━━━━━━━━━━━\n\n💡 PRONTO PARA LEVAR SUA EMPRESA AO PRÓXIMO NÍVEL?\n\n🌐 Site: www.codigobase.com.br\n✨ WhatsApp: (11) 98626-2240\n📧 E-mail: projetos.jgs@gmail.com`;
    }

    return json({ ok: true, caption, model });
  } catch (error) {
    const message = String(error?.message || error);
    console.error(message);
    return json({ ok: false, error: message === 'unauthorized' ? 'Não autorizado.' : message }, { status: message === 'unauthorized' ? 401 : 500 });
  }
});
