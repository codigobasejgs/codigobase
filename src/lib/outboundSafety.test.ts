import assert from 'node:assert/strict';
import test from 'node:test';
import { hasCanonicalOptOutNotice, isOptOutMessage } from '../../supabase/functions/_shared/outboundSafety.ts';

test('detecta comandos explícitos de opt-out', () => {
  for (const text of ['SAIR', 'sair por favor', 'parar.', 'pare de enviar mensagens', 'não me envie mais mensagens', 'Remover meu contato', 'não quero mais receber mensagens']) {
    assert.equal(isOptOutMessage(text), true, text);
  }
});

test('não bloqueia frases comuns contendo palavras parecidas', () => {
  for (const text of ['Pode sair mais barato?', 'Vou parar para analisar', 'Não quero mais detalhes agora']) {
    assert.equal(isOptOutMessage(text), false, text);
  }
});

test('exige aviso canônico no final da mensagem', () => {
  assert.equal(hasCanonicalOptOutNotice('Olá.\n\nSe não quiser receber novas mensagens, responda SAIR.'), true);
  assert.equal(hasCanonicalOptOutNotice('Olá, responda sair quando puder.'), false);
});
