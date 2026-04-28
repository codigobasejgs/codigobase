-- ============================================================================
-- PARTE 2: TABELA LEADS (Execute depois da Parte 1)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.leads (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome                TEXT NOT NULL DEFAULT '',
    email               TEXT NOT NULL DEFAULT '',
    whatsapp            TEXT NOT NULL DEFAULT '',
    empresa             TEXT NOT NULL DEFAULT '',
    cargo               TEXT NOT NULL DEFAULT '',
    mensagem            TEXT NOT NULL DEFAULT '',
    tipo_servico        TEXT NOT NULL DEFAULT '',
    orcamento_estimado  TEXT NOT NULL DEFAULT '',
    prazo               TEXT NOT NULL DEFAULT '',
    fonte               TEXT NOT NULL DEFAULT '',
    utm_source          TEXT NOT NULL DEFAULT '',
    utm_medium          TEXT NOT NULL DEFAULT '',
    utm_campaign        TEXT NOT NULL DEFAULT '',
    utm_term            TEXT NOT NULL DEFAULT '',
    utm_content         TEXT NOT NULL DEFAULT '',
    ip                  TEXT NOT NULL DEFAULT '',
    user_agent          TEXT NOT NULL DEFAULT '',
    geo_pais            TEXT NOT NULL DEFAULT '',
    geo_estado          TEXT NOT NULL DEFAULT '',
    geo_cidade          TEXT NOT NULL DEFAULT '',
    status              TEXT NOT NULL DEFAULT 'novo'
                        CHECK (status IN ('novo', 'qualificado', 'em_atendimento', 'ganho', 'perdido')),
    owner_id            UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    score               INT NOT NULL DEFAULT 0,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_email ON public.leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_owner ON public.leads(owner_id);
CREATE INDEX IF NOT EXISTS idx_leads_created ON public.leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_score ON public.leads(score DESC);

CREATE TRIGGER set_leads_updated_at
    BEFORE UPDATE ON public.leads
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Admins podem fazer tudo
CREATE POLICY leads_admin_all ON public.leads
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Anônimos podem inserir (formulário de contato)
CREATE POLICY leads_anon_insert ON public.leads
    FOR INSERT TO anon
    WITH CHECK (true);

-- ============================================================================
-- PARTE 2.1: TABELA LEAD_EVENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.lead_events (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id      UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    tipo         TEXT NOT NULL,
    payload_json JSONB,
    ator_tipo    TEXT NOT NULL CHECK (ator_tipo IN ('sistema', 'admin', 'bot', 'cliente')),
    ator_id      UUID,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lead_events_lead ON public.lead_events(lead_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lead_events_tipo ON public.lead_events(tipo);

CREATE TRIGGER set_lead_events_updated_at
    BEFORE UPDATE ON public.lead_events
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.lead_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY lead_events_admin_all ON public.lead_events
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());
