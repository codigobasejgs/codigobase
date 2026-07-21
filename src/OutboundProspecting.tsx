import React, { useEffect, useMemo, useState } from 'react';
import { Ban, CheckCircle2, FileUp, RefreshCw, Save, Search, Send, ShieldCheck, Users } from 'lucide-react';
import { supabase, supabaseFunctionsUrl } from './lib/supabaseClient';
import { parseProspectsCsv, type InvalidProspectCsvRow, type ProspectCsvRow } from './lib/prospectsCsv';

const OPT_OUT_NOTICE = 'Se não quiser receber novas mensagens, responda SAIR.';

type Prospect = Omit<ProspectCsvRow, 'phone'> & { id: string; phone_e164: string; remote_jid: string; status: 'new' | 'ready' | 'contacted' | 'replied' | 'opted_out' | 'blocked' | 'invalid'; created_at: string };
type Draft = { id: string; prospect_id: string; body: string; status: 'draft' | 'approved' | 'sending' | 'sent' | 'pending_confirmation' | 'error' | 'blocked' | 'cancelled'; approved_at: string | null; sent_at: string | null; attempt_count: number; error_message: string | null; created_at: string };
type ImportPreview = { valid: ProspectCsvRow[]; invalid: InvalidProspectCsvRow[] };

function defaultMessage(prospect: Prospect) {
  const name = prospect.name ? `, ${prospect.name}` : '';
  const finding = prospect.audit_finding || 'há uma oportunidade clara de modernizar o site e facilitar os agendamentos';
  return `Olá${name}, tudo bem? Aqui é Jefferson, da Código Base. Encontrei ${prospect.company || 'seu consultório'} no Google e notei que ${finding.charAt(0).toLowerCase()}${finding.slice(1)}.\n\nPosso preparar gratuitamente uma prévia modernizada da página inicial, sem entrada ou compromisso? Você avalia primeiro e só paga R$ 599 se gostar e quiser publicar. Um projeto desse nível costuma custar entre R$ 2 mil e R$ 3 mil.\n\n${OPT_OUT_NOTICE}`;
}

function badge(status: string) {
  const tone = status === 'sent' || status === 'contacted' ? 'border-green-400/30 bg-green-400/10 text-green-200' : status === 'approved' ? 'border-cyan-400/30 bg-cyan-400/10 text-cyan-200' : ['error', 'blocked', 'opted_out', 'invalid'].includes(status) ? 'border-red-400/30 bg-red-400/10 text-red-200' : status === 'pending_confirmation' || status === 'sending' ? 'border-orange-400/30 bg-orange-400/10 text-orange-200' : 'border-white/10 bg-white/5 text-gray-300';
  return <span className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase ${tone}`}>{status}</span>;
}

export default function OutboundProspecting({ session }: { session: any }) {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [suppressedPhones, setSuppressedPhones] = useState<Set<string>>(new Set());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [body, setBody] = useState('');
  const [search, setSearch] = useState('');
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');

  async function loadAll() {
    const [prospectsRes, draftsRes, suppressionsRes] = await Promise.all([
      supabase.from('cb_outbound_prospects').select('*').order('updated_at', { ascending: false }).limit(200),
      supabase.from('cb_outbound_message_drafts').select('*').order('created_at', { ascending: false }).limit(300),
      supabase.from('cb_whatsapp_suppressions').select('phone_e164'),
    ]);
    const error = prospectsRes.error || draftsRes.error || suppressionsRes.error;
    if (error) return setNotice(`Erro ao carregar: ${error.message}`);
    setProspects(prospectsRes.data || []);
    setDrafts(draftsRes.data || []);
    setSuppressedPhones(new Set((suppressionsRes.data || []).map((row) => row.phone_e164)));
    if (!selectedId && prospectsRes.data?.[0]) setSelectedId(prospectsRes.data[0].id);
  }

  useEffect(() => { loadAll(); }, []);
  const selected = prospects.find((item) => item.id === selectedId) || null;
  const currentDraft = selected ? drafts.find((draft) => draft.prospect_id === selected.id) || null : null;
  useEffect(() => { if (selected) setBody(currentDraft?.body || defaultMessage(selected)); }, [selected?.id, currentDraft?.id]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return prospects.filter((item) => !query || [item.name, item.company, item.phone_e164, item.website].some((value) => value?.toLowerCase().includes(query)));
  }, [prospects, search]);
  const totals = useMemo(() => ({
    prospects: prospects.length,
    drafts: drafts.filter((item) => item.status === 'draft').length,
    approved: drafts.filter((item) => item.status === 'approved').length,
    sent: drafts.filter((item) => item.status === 'sent').length,
    errors: drafts.filter((item) => ['error', 'pending_confirmation'].includes(item.status)).length,
  }), [prospects, drafts]);

  async function chooseCsv(file?: File) {
    if (!file) return;
    setNotice('');
    try {
      const parsed = parseProspectsCsv(await file.text());
      const existing = new Set(prospects.map((item) => item.phone_e164));
      const valid: ProspectCsvRow[] = [];
      const invalid = [...parsed.invalid];
      parsed.valid.forEach((row, index) => {
        if (existing.has(row.phone)) invalid.push({ row: index + 2, phone: row.phone, reason: 'Telefone já cadastrado' });
        else if (suppressedPhones.has(row.phone)) invalid.push({ row: index + 2, phone: row.phone, reason: 'Telefone suprimido' });
        else valid.push(row);
      });
      setPreview({ valid, invalid });
    } catch (error: any) {
      setPreview(null);
      setNotice(`CSV inválido: ${error.message || error}`);
    }
  }

  async function importPreview() {
    if (!preview?.valid.length || !session?.user?.id) return;
    setBusy(true);
    const rows = preview.valid.map((row) => ({ name: row.name || null, company: row.company || null, phone_e164: row.phone, website: row.website || null, email: row.email || null, address: row.address || null, audit_finding: row.audit_finding || null, notes: row.notes || null, source: row.source || 'Google Maps', created_by: session.user.id }));
    const { error } = await supabase.from('cb_outbound_prospects').insert(rows);
    setNotice(error ? `Erro ao importar: ${error.message}` : `${rows.length} prospect(s) importado(s). Nenhuma mensagem foi enviada.`);
    if (!error) setPreview(null);
    await loadAll();
    setBusy(false);
  }

  async function saveDraft() {
    if (!selected || !session?.user?.id || !body.trim().endsWith(OPT_OUT_NOTICE)) return setNotice(`Mensagem deve terminar com: ${OPT_OUT_NOTICE}`);
    setBusy(true);
    const reusable = currentDraft && ['draft', 'approved'].includes(currentDraft.status);
    const query = reusable
      ? supabase.from('cb_outbound_message_drafts').update({ body: body.trim(), status: 'draft', approved_by: null, approved_at: null, error_message: null, updated_at: new Date().toISOString() }).eq('id', currentDraft.id)
      : supabase.from('cb_outbound_message_drafts').insert({ prospect_id: selected.id, body: body.trim(), created_by: session.user.id });
    const { error } = await query;
    if (!error) await supabase.from('cb_outbound_prospects').update({ status: 'ready', updated_at: new Date().toISOString() }).eq('id', selected.id);
    setNotice(error ? `Erro ao salvar: ${error.message}` : 'Rascunho salvo. Aprovação ainda necessária.');
    await loadAll(); setBusy(false);
  }

  async function approveDraft() {
    if (!currentDraft || currentDraft.status !== 'draft' || !session?.user?.id) return;
    setBusy(true);
    const now = new Date().toISOString();
    const { error } = await supabase.from('cb_outbound_message_drafts').update({ status: 'approved', approved_by: session.user.id, approved_at: now, updated_at: now }).eq('id', currentDraft.id).eq('status', 'draft');
    setNotice(error ? `Erro ao aprovar: ${error.message}` : 'Mensagem aprovada. Revise destinatário antes de enviar.');
    await loadAll(); setBusy(false);
  }

  async function sendApproved() {
    if (!selected || !currentDraft || currentDraft.status !== 'approved') return;
    if (!window.confirm(`Enviar UMA mensagem para ${selected.company || selected.name || 'prospect'} (${selected.phone_e164})?`)) return;
    setBusy(true); setNotice('Enviando uma mensagem...');
    try {
      const response = await fetch(`${supabaseFunctionsUrl}/send-outbound-message`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` }, body: JSON.stringify({ draftId: currentDraft.id }) });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.error || 'Falha no envio');
      setNotice('Envio aceito e registrado como enviado.');
    } catch (error: any) { setNotice(`Envio não confirmado: ${error.message || error}. Não reenvie até verificar logs.`); }
    await loadAll(); setBusy(false);
  }

  async function suppress() {
    if (!selected || !session?.user?.id || !window.confirm(`Bloquear qualquer novo contato com ${selected.phone_e164}?`)) return;
    setBusy(true);
    const { error } = await supabase.from('cb_whatsapp_suppressions').upsert({ phone_e164: selected.phone_e164, reason: 'manual', created_by: session.user.id }, { onConflict: 'phone_e164' });
    if (!error) {
      await Promise.all([
        supabase.from('cb_outbound_prospects').update({ status: 'blocked', updated_at: new Date().toISOString() }).eq('id', selected.id),
        supabase.from('cb_outbound_message_drafts').update({ status: 'blocked', error_message: 'Contato suprimido manualmente', updated_at: new Date().toISOString() }).eq('prospect_id', selected.id).in('status', ['draft', 'approved']),
      ]);
    }
    setNotice(error ? `Erro ao suprimir: ${error.message}` : 'Contato suprimido. Novos envios bloqueados.');
    await loadAll(); setBusy(false);
  }

  return <section className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="flex items-center gap-2 text-2xl font-bold"><Users className="text-cyan-300" /> Prospecção manual</h2><p className="mt-1 text-sm text-gray-400">Importe, revise, aprove e envie individualmente. Nada dispara em lote.</p></div><button onClick={loadAll} className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm"><RefreshCw size={16} className="mr-2 inline" />Atualizar</button></div>
    <div className="grid gap-3 sm:grid-cols-5">{Object.entries(totals).map(([label, value]) => <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"><p className="text-[10px] uppercase tracking-wider text-gray-500">{label}</p><p className="mt-1 text-2xl font-bold">{value}</p></div>)}</div>
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4"><label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-cyan-400/30 p-4 text-sm text-cyan-100"><FileUp size={20} />Selecionar CSV (máximo 12)<input type="file" accept=".csv,text/csv" className="sr-only" onChange={(event) => chooseCsv(event.target.files?.[0])} /></label>{preview && <div className="mt-4 text-sm"><p className="text-green-300">Válidos: {preview.valid.length}</p><p className="text-red-300">Inválidos/duplicados: {preview.invalid.length}</p>{preview.invalid.map((item) => <p key={`${item.row}-${item.phone}`} className="text-xs text-red-200">Linha {item.row}: {item.phone || 'sem telefone'} — {item.reason}</p>)}<button disabled={busy || !preview.valid.length} onClick={importPreview} className="mt-3 rounded-xl bg-cyan-400 px-4 py-2 font-bold text-black disabled:opacity-50">Confirmar importação sem enviar</button></div>}</div>
    {notice && <p className="rounded-xl border border-cyan-400/20 bg-cyan-400/10 p-3 text-sm text-cyan-100">{notice}</p>}
    <div className="grid gap-6 lg:grid-cols-[360px_1fr]"><div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4"><div className="mb-3 flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3"><Search size={15} className="text-gray-500" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar prospect" className="min-w-0 flex-1 bg-transparent py-2 text-sm outline-none" /></div><div className="max-h-[680px] space-y-2 overflow-auto">{filtered.map((item) => { const draft = drafts.find((entry) => entry.prospect_id === item.id); return <button key={item.id} onClick={() => setSelectedId(item.id)} className={`w-full rounded-2xl border p-4 text-left ${selectedId === item.id ? 'border-cyan-400 bg-cyan-400/10' : 'border-white/10 bg-black/20'}`}><div className="flex items-start justify-between gap-2"><div><p className="font-bold">{item.company || item.name || 'Sem nome'}</p><p className="mt-1 font-mono text-xs text-gray-400">{item.phone_e164}</p></div>{badge(draft?.status || item.status)}</div></button>; })}</div></div>
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">{selected ? <div className="space-y-4"><div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/10 pb-4"><div><h3 className="text-xl font-bold">{selected.company || selected.name}</h3><p className="text-sm text-gray-400">{selected.phone_e164} • {selected.source}</p>{selected.website && <a href={selected.website} target="_blank" rel="noreferrer" className="text-sm text-cyan-300 underline">{selected.website}</a>}</div><div className="flex gap-2">{badge(currentDraft?.status || selected.status)}{suppressedPhones.has(selected.phone_e164) && badge('blocked')}</div></div><div className="rounded-2xl border border-orange-400/20 bg-orange-400/5 p-4"><p className="text-xs font-bold uppercase text-orange-200">Achado auditado</p><p className="mt-2 text-sm text-gray-300">{selected.audit_finding || 'Sem achado registrado.'}</p></div><label className="block"><span className="mb-2 block text-sm font-bold">Mensagem final exata</span><textarea value={body} onChange={(event) => setBody(event.target.value)} disabled={busy || ['sending', 'sent', 'pending_confirmation', 'blocked'].includes(currentDraft?.status || '')} className="min-h-[260px] w-full rounded-2xl border border-white/10 bg-[#05070D] p-4 text-sm leading-relaxed outline-none focus:border-cyan-400 disabled:opacity-60" /></label><p className="text-xs text-gray-500">{body.length}/4096 • aviso de opt-out {body.trim().endsWith(OPT_OUT_NOTICE) ? 'presente' : 'ausente'}</p><div className="flex flex-wrap gap-2"><button disabled={busy || suppressedPhones.has(selected.phone_e164)} onClick={saveDraft} className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold disabled:opacity-50"><Save size={16} className="mr-1 inline" />Salvar rascunho</button><button disabled={busy || currentDraft?.status !== 'draft'} onClick={approveDraft} className="rounded-xl border border-green-400/30 bg-green-400/10 px-4 py-2 text-sm font-bold text-green-100 disabled:opacity-50"><CheckCircle2 size={16} className="mr-1 inline" />Aprovar</button><button disabled={busy || currentDraft?.status !== 'approved' || suppressedPhones.has(selected.phone_e164)} onClick={sendApproved} className="rounded-xl bg-cyan-400 px-4 py-2 text-sm font-bold text-black disabled:opacity-50"><Send size={16} className="mr-1 inline" />Enviar esta mensagem</button><button disabled={busy || suppressedPhones.has(selected.phone_e164)} onClick={suppress} className="rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-2 text-sm font-bold text-red-100 disabled:opacity-50"><Ban size={16} className="mr-1 inline" />Suprimir contato</button></div>{currentDraft?.error_message && <p className="rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-200">{currentDraft.error_message}</p>}<p className="flex items-center gap-2 text-xs text-gray-500"><ShieldCheck size={14} /> Aprovação humana, envio único e opt-out obrigatório.</p></div> : <div className="grid min-h-[560px] place-items-center text-gray-500">Selecione um prospect.</div>}</div></div>
  </section>;
}
