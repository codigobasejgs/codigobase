alter table public.cb_ai_settings
  add column if not exists behavior_rules text not null default 'Tamanho da resposta: curto/médio, estilo WhatsApp. Objetivo: qualificar o cliente antes de vender. Fluxo: uma pergunta por vez, sem textão. Não começar listando tudo que a Código Base faz; comece perguntando o que o cliente precisa e aprofunde somente no serviço demonstrado.';

update public.cb_ai_settings
set behavior_rules = 'Tamanho da resposta: curto/médio, estilo WhatsApp. Objetivo: qualificar o cliente antes de vender. Fluxo: uma pergunta por vez, sem textão. Não começar listando tudo que a Código Base faz; comece perguntando o que o cliente precisa e aprofunde somente no serviço demonstrado.'
where id = 1 and (behavior_rules is null or length(trim(behavior_rules)) = 0);
