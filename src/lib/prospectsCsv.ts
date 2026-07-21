export const PROSPECT_HEADERS = ['name', 'company', 'phone', 'website', 'email', 'address', 'audit_finding', 'notes', 'source'] as const;

export type ProspectCsvRow = {
  name: string;
  company: string;
  phone: string;
  website: string;
  email: string;
  address: string;
  audit_finding: string;
  notes: string;
  source: string;
};

export type InvalidProspectCsvRow = { row: number; phone: string; reason: string };

export type ProspectCsvResult = {
  valid: ProspectCsvRow[];
  invalid: InvalidProspectCsvRow[];
};

export function normalizeBrazilianPhone(value: string): string | null {
  const digits = value.replace(/\D/g, '');
  const local = digits.startsWith('55') ? digits.slice(2) : digits;
  if (!/^\d{10,11}$/.test(local) || !/^[1-9]{2}9?\d{8}$/.test(local)) return null;
  return `+55${local}`;
}

function detectDelimiter(line: string) {
  let comma = 0;
  let semicolon = 0;
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    if (line[index] === '"') quoted = !quoted;
    if (!quoted && line[index] === ',') comma += 1;
    if (!quoted && line[index] === ';') semicolon += 1;
  }
  return semicolon > comma ? ';' : ',';
}

function parseRows(input: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    const next = input[index + 1];
    if (char === '"' && quoted && next === '"') {
      field += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === delimiter && !quoted) {
      row.push(field.trim());
      field = '';
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && next === '\n') index += 1;
      row.push(field.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }

  row.push(field.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

export function parseProspectsCsv(input: string): ProspectCsvResult {
  const normalized = input.replace(/^﻿/, '');
  const firstLine = normalized.split(/\r?\n/, 1)[0] || '';
  const rows = parseRows(normalized, detectDelimiter(firstLine));
  if (!rows.length) throw new Error('CSV vazio');

  const headers = rows[0].map((header) => header.trim().toLowerCase());
  const phoneIndex = headers.indexOf('phone');
  if (phoneIndex < 0) throw new Error('Cabeçalho obrigatório ausente: phone');

  const dataRows = rows.slice(1);
  if (dataRows.length > 12) throw new Error('CSV excede o máximo de 12 registros');

  const seen = new Set<string>();
  const valid: ProspectCsvRow[] = [];
  const invalid: InvalidProspectCsvRow[] = [];

  dataRows.forEach((values, index) => {
    const rawPhone = values[phoneIndex] || '';
    const phone = normalizeBrazilianPhone(rawPhone);
    if (!phone) {
      invalid.push({ row: index + 2, phone: rawPhone, reason: 'Telefone brasileiro inválido ou ambíguo' });
      return;
    }
    if (seen.has(phone)) {
      invalid.push({ row: index + 2, phone, reason: 'Telefone duplicado no arquivo' });
      return;
    }
    seen.add(phone);

    const get = (name: typeof PROSPECT_HEADERS[number]) => {
      const column = headers.indexOf(name);
      return column < 0 ? '' : values[column] || '';
    };

    valid.push({
      name: get('name'),
      company: get('company'),
      phone,
      website: get('website'),
      email: get('email'),
      address: get('address'),
      audit_finding: get('audit_finding'),
      notes: get('notes'),
      source: get('source'),
    });
  });

  return { valid, invalid };
}
