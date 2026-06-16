update public.cb_ai_settings
set bot_detection_keywords = array[
  'sou assistente virtual',
  'mensagem automática',
  'resposta automática',
  'sou um bot',
  'assistente de ia respondendo',
  'atendimento automático',
  'não responda esta mensagem'
]
where id = 1;

update public.cb_whatsapp_conversations
set ai_paused = false,
    pause_reason = null,
    suspected_bot = false,
    updated_at = now()
where remote_jid = '5511986262240@s.whatsapp.net'
  and pause_reason = 'suspected_bot';
