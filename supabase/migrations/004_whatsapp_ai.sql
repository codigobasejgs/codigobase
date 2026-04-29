-- ============================================================
-- Migration 004 — WhatsApp Conversations + AI Settings
-- ============================================================

-- Adicionar colunas de contexto às mensagens
ALTER TABLE whatsapp_messages
  ADD COLUMN IF NOT EXISTS remote_jid TEXT,
  ADD COLUMN IF NOT EXISTS contact_name TEXT,
  ADD COLUMN IF NOT EXISTS conversation_id UUID;

-- Tabela de conversas (uma por contato por instância)
CREATE TABLE IF NOT EXISTS whatsapp_conversations (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id    UUID        NOT NULL REFERENCES whatsapp_instances(id) ON DELETE CASCADE,
  remote_jid     TEXT        NOT NULL,
  contact_name   TEXT,
  contact_photo  TEXT,
  last_message   TEXT,
  last_message_at TIMESTAMPTZ,
  unread_count   INT         NOT NULL DEFAULT 0,
  ai_paused      BOOLEAN     NOT NULL DEFAULT false,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(instance_id, remote_jid)
);

-- FK de whatsapp_messages para whatsapp_conversations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_wamsg_conversation'
    AND table_name = 'whatsapp_messages'
  ) THEN
    ALTER TABLE whatsapp_messages
      ADD CONSTRAINT fk_wamsg_conversation
      FOREIGN KEY (conversation_id)
      REFERENCES whatsapp_conversations(id)
      ON DELETE SET NULL;
  END IF;
END $$;

-- Configurações de IA (uma linha singleton)
CREATE TABLE IF NOT EXISTS ai_settings (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  provider            TEXT        NOT NULL DEFAULT 'anthropic',
  api_key             TEXT,
  model               TEXT        NOT NULL DEFAULT 'claude-opus-4-7',
  system_prompt       TEXT        NOT NULL DEFAULT '',
  auto_reply          BOOLEAN     NOT NULL DEFAULT false,
  auto_reply_delay_ms INT         NOT NULL DEFAULT 3000,
  max_tokens          INT         NOT NULL DEFAULT 500,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed: linha padrão (se não existir)
INSERT INTO ai_settings (provider, model, system_prompt, auto_reply)
SELECT 'anthropic', 'claude-opus-4-7', '', false
WHERE NOT EXISTS (SELECT 1 FROM ai_settings);

-- Índices úteis
CREATE INDEX IF NOT EXISTS idx_wa_conversations_instance
  ON whatsapp_conversations(instance_id, last_message_at DESC);

CREATE INDEX IF NOT EXISTS idx_wa_messages_conversation
  ON whatsapp_messages(conversation_id, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_wa_messages_remote_jid
  ON whatsapp_messages(remote_jid, created_at ASC);
