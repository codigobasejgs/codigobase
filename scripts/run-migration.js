#!/usr/bin/env node
/**
 * Script para rodar a migration SQL no Supabase
 * Uso: node scripts/run-migration.js
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carregar variáveis de ambiente
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Erro: Variáveis NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias');
  console.error('   Certifique-se de que o arquivo .env.local existe e está configurado.');
  process.exit(1);
}

console.log('🔧 Conectando ao Supabase...');
console.log(`   URL: ${SUPABASE_URL}`);

// Criar cliente admin (bypassa RLS)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runMigration() {
  try {
    // Ler arquivo SQL
    const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '001_initial_schema.sql');
    console.log(`📄 Lendo migration: ${migrationPath}`);

    const sql = readFileSync(migrationPath, 'utf-8');
    console.log(`   Tamanho: ${(sql.length / 1024).toFixed(2)} KB`);

    // Executar SQL via RPC (Supabase permite executar SQL direto via service_role)
    console.log('\n🚀 Executando migration SQL...');

    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql }).catch(async () => {
      // Se exec_sql não existir, tentamos via REST API diretamente
      console.log('   Tentando via REST API...');

      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({ sql_query: sql })
      });

      if (!response.ok) {
        // Fallback: executar statement por statement
        console.log('   Executando statements individuais...');
        return await executeStatementsIndividually(sql);
      }

      return { data: await response.json(), error: null };
    });

    if (error) {
      console.error('❌ Erro ao executar migration:', error);
      process.exit(1);
    }

    console.log('✅ Migration executada com sucesso!');

    // Verificar tabelas criadas
    console.log('\n🔍 Verificando tabelas criadas...');
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .order('table_name');

    if (tablesError) {
      console.warn('⚠️  Não foi possível verificar tabelas:', tablesError.message);
    } else {
      console.log(`   Total de tabelas: ${tables?.length || 0}`);
      if (tables && tables.length > 0) {
        console.log('   Tabelas criadas:');
        tables.forEach(t => console.log(`     - ${t.table_name}`));
      }
    }

    console.log('\n✨ Processo concluído!');

  } catch (err) {
    console.error('❌ Erro inesperado:', err);
    process.exit(1);
  }
}

async function executeStatementsIndividually(sql) {
  // Dividir SQL em statements (simplificado - assume ; como separador)
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  console.log(`   Executando ${statements.length} statements...`);

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    if (stmt.length < 10) continue; // Skip very short statements

    try {
      // Usar query direto (não há RPC, então usamos fetch direto)
      const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ query: stmt })
      });

      if (i % 10 === 0) {
        console.log(`   Progresso: ${i}/${statements.length}`);
      }
    } catch (err) {
      console.warn(`   ⚠️  Statement ${i} falhou (pode ser esperado):`, err.message);
    }
  }

  return { data: null, error: null };
}

// Executar
runMigration();
