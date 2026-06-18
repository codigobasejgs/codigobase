import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { GoogleGenAI } from 'https://esm.sh/@google/genai@2.4.0';
import { Image } from 'https://deno.land/x/imagescript@1.3.0/mod.ts';

const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY') || '';
const OPENAI_IMAGE_MODEL = Deno.env.get('OPENAI_IMAGE_MODEL') || 'gpt-image-1';
const OPENAI_IMAGE_SIZE = Deno.env.get('OPENAI_IMAGE_SIZE') || '1024x1792';
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') || Deno.env.get('GOOGLE_API_KEY') || '';
const GEMINI_IMAGE_MODEL = Deno.env.get('GEMINI_IMAGE_MODEL') || 'gemini-3-pro-image-preview';
const BRAND_LOGO_URL = Deno.env.get('BRAND_LOGO_URL') || 'https://www.codigobase.com.br/logo.png';
const BRAND_SITE = Deno.env.get('BRAND_SITE') || 'www.codigobase.com.br';
const BRAND_WHATSAPP = Deno.env.get('BRAND_WHATSAPP') || '(11) 98626-2240';
const BRAND_EMAIL = Deno.env.get('BRAND_EMAIL') || 'Projetosti.jgs@gmail.com';
const BRAND_INSTAGRAM = Deno.env.get('BRAND_INSTAGRAM') || '@codigo.base';
const BRAND_FONT_URL = Deno.env.get('BRAND_FONT_URL') || 'https://raw.githubusercontent.com/google/fonts/main/ofl/inter/Inter%5Bopsz,wght%5D.ttf';
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function json(data: unknown, init: ResponseInit = {}) { return new Response(JSON.stringify(data), { ...init, headers: { ...corsHeaders, 'Content-Type': 'application/json', ...(init.headers || {}) } }); }
async function requireUser(authHeader: string) { const token = authHeader.replace(/^Bearer\s+/i, '').trim(); if (!token) throw new Error('unauthorized'); if (token === SUPABASE_SERVICE_ROLE_KEY) return { id: null }; const client = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { global: { headers: { Authorization: authHeader } } }); const { data, error } = await client.auth.getUser(token); if (error || !data.user) throw new Error('unauthorized'); return data.user; }
function bytesFromBase64(b64: string) { const bin = atob(b64); const bytes = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i); return bytes; }
function slug(text: string) { return text.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase().slice(0, 80); }
function caption(themeCategory: string, themeOption: string, draftType: string) { return `✨ ${themeOption.toUpperCase()} COM TECNOLOGIA DE PONTA! ✨\n\nA CÓDIGO-BASE transforma ${themeCategory} em soluções digitais que chamam atenção, geram autoridade e ajudam sua empresa a vender mais com estratégia.\n\n${draftType === 'carousel' ? 'ARRASTE PARA O LADO E VEJA COMO APLICAR ISSO NO SEU NEGÓCIO! ➡️' : 'RESPONDA ESTE STORY E DESCUBRA COMO APLICAR ISSO NO SEU NEGÓCIO! 🚀'}\n\n━━━━━━━━━━━━━━━━━━━━━━━━\n\n💡 O QUE VOCÊ PODE GANHAR:\n\n✅ Atendimento mais rápido e profissional\n✅ Menos tarefas manuais no dia a dia\n✅ Mais presença digital, leads e oportunidades\n✅ Tecnologia sob medida para crescer com resultado\n\n━━━━━━━━━━━━━━━━━━━━━━━━\n\n📲 FALE COM A CÓDIGO-BASE:\n\n🌐 Site: ${BRAND_SITE}\n📱 WhatsApp: ${BRAND_WHATSAPP}\n📸 Instagram: ${BRAND_INSTAGRAM}\n📧 E-mail: ${BRAND_EMAIL}\n\n#CodigoBase #Tecnologia #InteligenciaArtificial #MarketingDigital #DesenvolvimentoDeSoftware #SaaS #PowerBI #ChatbotIA #TransformacaoDigital #Resultados #Inovacao #Negocios #SaoPaulo #Brasil #Tech`; }
function imagePrompt(themeCategory: string, themeOption: string, draftType: string, index: number) {
  const themeGuides: Record<string, Record<string, { hook: string; subtext: string; visual: string; cta: string }>> = {
    'IA / Chatbot': {
      Vendas: { hook: 'Seu WhatsApp pode vender 24h', subtext: 'Atenda leads automaticamente e não perca clientes fora do horário comercial.', visual: 'celular com conversa de WhatsApp, chatbot IA respondendo, gráficos de vendas subindo, ícones de automação', cta: 'Automatize seu atendimento com a Código-Base' },
      Suporte: { hook: 'Pare de responder sempre as mesmas perguntas', subtext: 'IA tira dúvidas e reduz atendimento manual.', visual: 'chatbot de suporte, base de conhecimento, mensagens organizadas', cta: 'Reduza tarefas repetitivas' },
      Agendamentos: { hook: 'Agenda cheia sem confusão', subtext: 'Automatize horários, confirmações e lembretes.', visual: 'calendário digital, notificações, celular com confirmação', cta: 'Organize seus agendamentos' },
      'Dúvidas frequentes': { hook: 'Seu cliente não quer esperar', subtext: 'Responda perguntas repetitivas automaticamente.', visual: 'FAQ inteligente, balões de conversa, atendimento rápido', cta: 'Atenda melhor com IA' },
    },
    'Sistemas / Apps': {
      'Site profissional': { hook: 'Site bonito é bom. Site que gera cliente é melhor', subtext: 'Presença digital profissional com foco em conversão.', visual: 'landing page premium em notebook, métricas de conversão, botões CTA', cta: 'Crie sua presença digital' },
      'Sistema com login/painel': { hook: 'Sua empresa ainda depende de planilha?', subtext: 'Centralize processos em um painel sob medida.', visual: 'dashboard SaaS com login, usuários, relatórios e cards', cta: 'Transforme seu processo' },
      'App/PWA': { hook: 'Seu negócio na tela do cliente', subtext: 'Aplicativo web moderno, responsivo e instalável.', visual: 'smartphone com PWA, interface moderna, ícones de app', cta: 'Crie seu app web' },
      'Loja virtual': { hook: 'Venda online com estrutura profissional', subtext: 'Catálogo, pagamentos e WhatsApp integrados.', visual: 'e-commerce premium, carrinho, catálogo e WhatsApp', cta: 'Leve sua loja para o digital' },
    },
    'Dashboards / Dados': {
      'Power BI': { hook: 'Veja suas vendas em tempo real', subtext: 'Dashboards profissionais para decidir com clareza.', visual: 'painel Power BI futurista, gráficos, KPIs, mapas e indicadores', cta: 'Decida com dados' },
      'Planilhas automáticas': { hook: 'Planilha manual custa tempo e dinheiro', subtext: 'Automatize relatórios e reduza retrabalho.', visual: 'planilhas conectadas a dashboards, robôs e fluxos automáticos', cta: 'Automatize suas planilhas' },
      'Indicadores financeiros': { hook: 'Sem dados, sua empresa cresce no escuro', subtext: 'Lucro, faturamento, custos e metas em uma visão clara.', visual: 'indicadores financeiros, gráficos de margem, cartões KPI', cta: 'Controle seus números' },
      'Relatórios gerenciais': { hook: 'Você está decidindo no achismo?', subtext: 'Relatórios gerenciais aceleram decisões.', visual: 'sala executiva, dashboard gerencial, gráficos de produtividade', cta: 'Tenha relatórios claros' },
    },
    'Marketing / Instagram': {
      'Posts e artes': { hook: 'Conteúdo profissional gera mais confiança', subtext: 'Artes premium para posicionar sua marca.', visual: 'feed Instagram premium, mockups de posts, calendário visual', cta: 'Transforme seu Instagram' },
      Stories: { hook: 'Seu concorrente aparece todos os dias. E você?', subtext: 'Stories com CTA para gerar presença e venda.', visual: 'stories verticais, stickers elegantes, setas CTA', cta: 'Apareça todos os dias' },
      'Reels/vídeos': { hook: 'Vídeo curto vende atenção', subtext: 'Roteiros e criativos para Reels com estratégia.', visual: 'timeline de vídeo, celular com reels, luzes neon', cta: 'Crie vídeos com estratégia' },
      'Gestão de conteúdo': { hook: 'Postar sem estratégia não gera cliente', subtext: 'Calendário, conteúdo e automação para vender melhor.', visual: 'calendário editorial, painel de métricas, automação de postagens', cta: 'Organize seu conteúdo' },
    },
    'Hardware / Suporte': {
      'Computador lento': { hook: 'Computador lento custa produtividade', subtext: 'Diagnóstico técnico para sua equipe parar de perder tempo.', visual: 'PC lento versus PC rápido, medidores de performance, técnico premium', cta: 'Acelere sua máquina' },
      'Formatação/limpeza': { hook: 'Manutenção certa evita prejuízo', subtext: 'Sistema limpo, seguro e pronto para trabalhar.', visual: 'notebook com escudo de segurança, limpeza digital, antivírus', cta: 'Faça uma revisão técnica' },
      'Rede/Wi-Fi/firewall': { hook: 'Internet caindo trava sua empresa', subtext: 'Rede, Wi-Fi e firewall configurados com segurança.', visual: 'mapa de rede, firewall, roteadores, escudo cyber', cta: 'Proteja sua rede' },
      'Upgrade SSD/RAM': { hook: 'SSD pode transformar sua máquina', subtext: 'Mais velocidade para trabalhar sem travamentos.', visual: 'SSD, memória RAM, velocímetro de performance, notebook high-tech', cta: 'Faça upgrade com segurança' },
    },
  };
  const fallback = { hook: themeOption.toUpperCase().slice(0, 34), subtext: 'Solução tecnológica sob medida para sua empresa.', visual: 'telas de sistema, automação, dashboards e elementos high-tech', cta: 'Fale com a Código-Base' };
  const guide = themeGuides[themeCategory]?.[themeOption] || fallback;
  const format = draftType === 'story' ? 'STORY 9:16 vertical' : 'CARROSSEL 9:16 vertical com visual consistente e páginas numeradas';
  return `PROMPT MESTRE PARA GEMINI — IMAGENS CÓDIGO-BASE
Você é um designer profissional especialista em marketing digital, tecnologia, inteligência artificial, automação, desenvolvimento de sistemas, infraestrutura e criação de artes premium para Instagram.

Crie uma imagem profissional para a marca CÓDIGO-BASE — Software & Hardware Solutions.
Formato: ${format}. Slide: ${index + 1}.
Tema: ${themeCategory}.
Opção: ${themeOption}.
Objetivo: criar uma arte persuasiva, impactante, profissional, moderna e pronta para postagem.

IDENTIDADE VISUAL OBRIGATÓRIA
Use sempre fundo escuro tecnológico, preto profundo, azul neon/ciano, laranja neon, branco metálico, elementos de circuito, luzes holográficas, dashboards futuristas, ícones de IA, telas de sistema, celular com WhatsApp, computador/notebook, gráficos e elementos de software/hardware.
Estilo visual: premium, moderno, tecnológico, elite, profissional, high-tech, alto contraste, visual de empresa de tecnologia, design limpo, impactante e sofisticado.
Não criar arte infantil. Não criar design simples demais. Não usar cartoon. Não poluir visualmente. Não deixar texto ilegível. Não inventar outra marca. Não alterar o nome Código-Base.

LOGO E MARCA
Inserir o logo ou nome em destaque: CÓDIGO-BASE — Software & Hardware Solutions. O nome deve aparecer claro e profissional no topo ou rodapé.

CONTATOS OBRIGATÓRIOS EM TODAS AS IMAGENS
WhatsApp: ${BRAND_WHATSAPP}
Instagram: ${BRAND_INSTAGRAM}
Site: ${BRAND_SITE}
E-mail: ${BRAND_EMAIL}
Os contatos devem ficar legíveis, organizados e com aparência profissional.

ESTRUTURA DE COPY
Título principal: "${guide.hook}"
Subtítulo: "${guide.subtext}"
CTA: "${guide.cta}"
Use frases curtas, fortes e legíveis.

ELEMENTOS VISUAIS
${guide.visual}. Manter coerência com ${themeCategory} / ${themeOption}. Usar composição de marketing com gancho forte, dor do cliente, solução Código-Base, benefício claro e CTA para WhatsApp.

COMANDO FINAL
Agora gere uma imagem premium, moderna e tecnológica para Instagram da Código-Base, seguindo exatamente a identidade visual, cores, logo, contatos e estilo descritos acima. A imagem deve ser impactante, profissional, persuasiva, com design de alto nível e pronta para postagem.`;
}
async function logEvent(draftId: string | null, eventType: string, status: string, message?: string, response?: unknown) { await supabase.from('cb_ai_creative_logs').insert({ draft_id: draftId, event_type: eventType, status, message, response: response || null }); }
let fontCache: Uint8Array | null = null;
let logoCache: Uint8Array | null = null;
async function fetchBytes(url: string) { const res = await fetch(url); if (!res.ok) throw new Error(`Falha ao carregar asset de marca: ${url} (${res.status})`); return new Uint8Array(await res.arrayBuffer()); }
async function getBrandFont() { if (!fontCache) fontCache = await fetchBytes(BRAND_FONT_URL); return fontCache; }
async function getBrandLogo() { if (!logoCache) logoCache = await fetchBytes(BRAND_LOGO_URL); return logoCache; }
async function getGeminiKey() { if (GEMINI_API_KEY) return GEMINI_API_KEY; const { data } = await supabase.from('cb_ai_settings').select('gemini_api_key').eq('id', 1).maybeSingle(); return data?.gemini_api_key || ''; }
async function applyBrandOverlay(b64: string) {
  const image = await Image.decode(bytesFromBase64(b64));
  const width = image.width;
  const height = image.height;
  const margin = Math.round(width * 0.045);
  const footerHeight = Math.round(height * 0.15);
  image.drawBox(0, height - footerHeight, width, footerHeight, 0x05070de8);
  const font = await getBrandFont();
  const logo = await Image.decode(await getBrandLogo());
  logo.resize(Math.round(width * 0.13), Image.RESIZE_AUTO);
  image.composite(logo, margin, height - footerHeight + Math.round(footerHeight * 0.15));
  const title = Image.renderText(font, Math.round(width * 0.04), 'CÓDIGO-BASE', 0xffffffff);
  const contact = Image.renderText(font, Math.round(width * 0.022), `${BRAND_SITE}  •  ${BRAND_WHATSAPP}\n${BRAND_INSTAGRAM}  •  ${BRAND_EMAIL}`, 0xd7f8ffff);
  image.composite(title, margin + Math.round(width * 0.16), height - footerHeight + Math.round(footerHeight * 0.18));
  image.composite(contact, margin + Math.round(width * 0.16), height - footerHeight + Math.round(footerHeight * 0.55));
  const branded = await image.encode(2);
  let bin = '';
  for (const byte of branded) bin += String.fromCharCode(byte);
  return btoa(bin);
}
async function generateOpenAiImage(prompt: string) { const res = await fetch('https://api.openai.com/v1/images/generations', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENAI_API_KEY}` }, body: JSON.stringify({ model: OPENAI_IMAGE_MODEL, prompt, size: OPENAI_IMAGE_SIZE, n: 1 }) }); const data = await res.json().catch(() => ({})); if (!res.ok) throw new Error(data?.error?.message || `OpenAI image ${res.status}`); const b64 = data?.data?.[0]?.b64_json; if (!b64) throw new Error('OpenAI não retornou imagem base64'); return { b64: await applyBrandOverlay(b64), provider: 'openai', response: data }; }
async function generateGeminiImage(prompt: string, apiKey: string) { const ai = new GoogleGenAI({ apiKey }); if (GEMINI_IMAGE_MODEL.startsWith('imagen-')) { const data = await ai.models.generateImages({ model: GEMINI_IMAGE_MODEL, prompt, config: { numberOfImages: 1, aspectRatio: '9:16', outputMimeType: 'image/png', includeRaiReason: true } }); const b64 = data?.generatedImages?.[0]?.image?.imageBytes; if (!b64) throw new Error('Gemini/Imagen não retornou imagem base64'); return { b64: await applyBrandOverlay(b64), provider: 'gemini', response: data }; } const config = GEMINI_IMAGE_MODEL.includes('pro-image') ? { imageConfig: { aspectRatio: '9:16', imageSize: '1K' } } : undefined; const data = await ai.models.generateContent({ model: GEMINI_IMAGE_MODEL, contents: prompt, config }); const part = data?.candidates?.[0]?.content?.parts?.find((item: any) => item.inlineData?.data); const b64 = part?.inlineData?.data; if (!b64) throw new Error('Gemini não retornou imagem base64'); return { b64: await applyBrandOverlay(b64), provider: 'gemini', response: data }; }
async function generateImage(prompt: string, provider: 'openai' | 'gemini') { if (provider === 'gemini') { const apiKey = await getGeminiKey(); if (!apiKey) throw new Error('GEMINI_API_KEY não configurada'); return generateGeminiImage(prompt, apiKey); } if (!OPENAI_API_KEY) throw new Error('OPENAI_API_KEY não configurada'); return generateOpenAiImage(prompt); }
async function createDraft(userId: string, draftType: 'story' | 'carousel', platformTargets: string[], themeCategory: string, themeOption: string, slideCount: number, scheduledAt: string | null, provider: 'openai' | 'gemini') {
  const title = `${draftType === 'story' ? 'Story' : 'Carrossel'} • ${themeCategory} • ${themeOption} • ${provider === 'gemini' ? 'Gemini' : 'OpenAI'}`;
  const { data: draft, error } = await supabase.from('cb_ai_creative_drafts').insert({ draft_type: draftType, platform_targets: platformTargets, theme_category: themeCategory, theme_option: themeOption, title, caption: caption(themeCategory, themeOption, draftType), status: 'generated', scheduled_at: scheduledAt || null, created_by: userId }).select('id').single();
  if (error) throw new Error(error.message);
  for (let i = 0; i < slideCount; i++) {
    const prompt = imagePrompt(themeCategory, themeOption, draftType, i);
    await logEvent(draft.id, 'image_generation_started', 'running', `${provider}: ${prompt}`);
    const generated = await generateImage(prompt, provider);
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
    const body = await req.json();
    const themeCategory = body.themeCategory || 'IA / Chatbot';
    const themeOption = body.themeOption || 'Vendas';
    const platforms = Array.isArray(body.platforms) && body.platforms.length ? body.platforms : ['instagram', 'whatsapp'];
    const storyCount = Math.max(0, Math.min(10, Number(body.storyCount ?? 3)));
    const carouselSlideCount = Math.max(0, Math.min(10, Number(body.carouselSlideCount ?? 5)));
    const scheduledAt = body.scheduledAt || null;
    const provider = body.provider === 'gemini' ? 'gemini' : 'openai';
    const drafts: string[] = [];
    for (let i = 0; i < storyCount; i++) drafts.push(await createDraft(user.id, 'story', platforms, themeCategory, themeOption, 1, scheduledAt, provider));
    if (carouselSlideCount > 0) drafts.push(await createDraft(user.id, 'carousel', platforms, themeCategory, themeOption, carouselSlideCount, scheduledAt, provider));
    return json({ ok: true, drafts });
  } catch (error) {
    const message = String(error?.message || error);
    return json({ ok: false, error: message === 'unauthorized' ? 'Não autorizado.' : message }, { status: message === 'unauthorized' ? 401 : 500 });
  }
});
