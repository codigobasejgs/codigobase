import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeBrazilianPhone, parseProspectsCsv } from './prospectsCsv.ts';

test('normaliza celular brasileiro para E.164', () => {
  assert.equal(normalizeBrazilianPhone('(11) 91563-4520'), '+5511915634520');
});

test('preserva número brasileiro já normalizado', () => {
  assert.equal(normalizeBrazilianPhone('+55 11 91563-4520'), '+5511915634520');
});

test('rejeita telefone ambíguo', () => {
  assert.equal(normalizeBrazilianPhone('91563-4520'), null);
});

test('lê BOM, ponto-e-vírgula, aspas e CRLF', () => {
  const result = parseProspectsCsv('﻿name;company;phone;website;email;address;audit_finding;notes;source\r\n"Ana";"Clínica, Centro";"(11) 91563-4520";"https://example.com";"ana@example.com";"Rua A, 1";"Site indisponível";"Disse ""olá""";"Google Maps"');
  assert.deepEqual(result.valid[0], {
    name: 'Ana',
    company: 'Clínica, Centro',
    phone: '+5511915634520',
    website: 'https://example.com',
    email: 'ana@example.com',
    address: 'Rua A, 1',
    audit_finding: 'Site indisponível',
    notes: 'Disse "olá"',
    source: 'Google Maps',
  });
});

test('aceita CSV separado por vírgula com campo citado', () => {
  const result = parseProspectsCsv('name,company,phone\nAna,"Clínica, Centro",11915634520');
  assert.equal(result.valid[0]?.company, 'Clínica, Centro');
});

test('marca telefones repetidos no mesmo arquivo', () => {
  const result = parseProspectsCsv('name,phone\nAna,11915634520\nBia,+55 11 91563-4520');
  assert.equal(result.invalid[0]?.reason, 'Telefone duplicado no arquivo');
});

test('exige cabeçalho phone', () => {
  assert.throws(() => parseProspectsCsv('name,company\nAna,Clínica'), /Cabeçalho obrigatório ausente: phone/);
});

test('rejeita arquivo com mais de 12 registros', () => {
  const rows = Array.from({ length: 13 }, (_, index) => `Pessoa ${index},119${String(10000000 + index)}`).join('\n');
  assert.throws(() => parseProspectsCsv(`name,phone\n${rows}`), /máximo de 12 registros/);
});

test('ignora linhas vazias', () => {
  const result = parseProspectsCsv('name,phone\n\nAna,11915634520\n');
  assert.equal(result.valid.length, 1);
});
