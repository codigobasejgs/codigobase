export const CANONICAL_OPT_OUT_NOTICE = 'Se não quiser receber novas mensagens, responda SAIR.';

function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const OPT_OUT_PATTERNS = [
  /^(sair|parar|cancelar)( por favor)?$/,
  /^pare de (enviar|mandar) mensagens$/,
  /^remov(a|er) meu contato$/,
  /^nao (me envie|mande) mais mensagens$/,
  /^nao quero mais receber( mensagens)?$/,
];

export function isOptOutMessage(value: string) {
  const normalized = normalizeText(value);
  return OPT_OUT_PATTERNS.some((pattern) => pattern.test(normalized));
}

export function hasCanonicalOptOutNotice(value: string) {
  return value.trim().endsWith(CANONICAL_OPT_OUT_NOTICE);
}
