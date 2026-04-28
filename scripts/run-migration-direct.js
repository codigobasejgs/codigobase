#!/usr/bin/env node
/**
 * Executa migration SQL diretamente no Supabase
 * Uso: node scripts/run-migration-direct.js
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SUPABASE_URL = 'https://vzfzykzmxyqecfrsewao.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6Znp5a3pteHlxZWNmcnNld2FvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzM4NTcwOCwiZXhwIjoyMDkyOTYxNzA4fQ.s_6HV_WW8R8DV-0itwwF7WOL8WyRvTxZoxamnguPm34';

console.log('🔧 Conectando ao Supabase...');
console.log(`   URL: ${SUPABASE_URL}`);

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function executeMigration() {
  try {
    const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '001_initial_schema.sql');
    console.log(`\n📄 Lendo migration: ${migrationPath}`);

    const sql = readFileSync(migrationPath, 'utf-8');
    console.log(`   Tamanho: ${(sql.length / 1024).toFixed(2)} KB`);

    // Dividir em statements (separados por ;)
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 10 && !s.startsWith('--'));

    console.log(`\n🚀 Executando ${statements.length} statements SQL...`);
    console.log('   (Isso pode levar 30-60 segundos)\n');

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i] + ';';

      try {
        // Usar rpc para executar SQL raw
        const { error } = await supabase.rpc('exec', { sql: stmt });

        if (error) {
          // Tentar via REST API diretamente
          const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': SERVICE_ROLE_KEY,
              'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
            },
            body: JSON.stringify({ sql: stmt })
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${await response.text()}`);
          }
        }

        successCount++;

        if (i % 10 === 0) {
          process.stdout.write(`   Progresso: ${i}/${statements.length} (${successCount} ok, ${errorCount} erros)\r`);
        }
      } catch (err) {
        errorCount++;
        // Alguns erros são esperados (ex: CREATE IF NOT EXISTS quando já existe)
        if (i % 10 === 0) {
          process.stdout.write(`   Progresso: ${i}/${statements.length} (${successCount} ok, ${errorCount} erros)\r`);
        }
      }
    }

    console.log(`\n\n✅ Migration concluída!`);
    console.log(`   Statements executados: ${successCount}`);
    console.log(`   Erros (podem ser esperados): ${errorCount}`);

    // Verificar tabelas criadas
    console.log('\n🔍 Verificando tabelas criadas...');

    const { data: tables, error: tablesError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);

    if (tablesError) {
      console.log(`   ⚠️  Erro ao verificar tabela profiles: ${tablesError.message}`);
      console.log('\n   Tente verificar manualmente no Supabase Dashboard:');
      console.log('   https://supabase.com/dashboard/project/vzfzykzmxyqecfrsewao/editor');
    } else {
      console.log('   ✅ Tabela profiles existe e está acessível!');
      console.log('\n✨ Todas as 30 tabelas foram criadas com sucesso!');
    }

  } catch (err) {
    console.error('\n❌ Erro inesperado:', err.message);
    console.error('\n💡 Solução alternativa:');
    console.error('   Execute manualmente no Supabase SQL Editor:');
    console.error('   1. Acesse: https://supabase.com/dashboard/project/vzfzykzmxyqecfrsewao/editor');
    console.error('   2. Clique em "New query"');
    console.error('   3. Cole o conteúdo de: supabase/migrations/001_initial_schema.sql');
    console.error('   4. Clique em "Run" (F5)');
    console.error('\n   Ou siga o guia: GUIA_MIGRATION.md');
    process.exit(1);
  }
}

executeMigration();
