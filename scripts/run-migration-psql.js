#!/usr/bin/env node
/**
 * Executa migration SQL no Supabase via psql (PostgreSQL client)
 * Requer: psql instalado
 */

import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Credenciais do Supabase
const DB_HOST = 'aws-0-us-east-1.pooler.supabase.com';
const DB_PORT = '6543';
const DB_NAME = 'postgres';
const DB_USER = 'postgres.vzfzykzmxyqecfrsewao';
const DB_PASSWORD = 'F+f0hXxYRgwOQ5KmFrjCHEtMLHaYq9rCppozvxkly2tCPH2LPZwu00ickulJBvXev3c4tvKlYMZ4pSIYB1Za2g==';

console.log('🔧 Executando migration via psql...\n');

try {
  const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '001_initial_schema.sql');
  const sql = readFileSync(migrationPath, 'utf-8');

  console.log(`📄 Migration: ${migrationPath}`);
  console.log(`   Tamanho: ${(sql.length / 1024).toFixed(2)} KB\n`);

  // Construir connection string
  const connectionString = `postgresql://${DB_USER}:${encodeURIComponent(DB_PASSWORD)}@${DB_HOST}:${DB_PORT}/${DB_NAME}`;

  console.log('🚀 Executando SQL...\n');

  // Executar via psql
  execSync(`psql "${connectionString}" -f "${migrationPath}"`, {
    stdio: 'inherit',
    encoding: 'utf-8'
  });

  console.log('\n✅ Migration executada com sucesso!');
  console.log('\n🔍 Verificando tabelas criadas...');

  // Verificar tabelas
  const result = execSync(
    `psql "${connectionString}" -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;"`,
    { encoding: 'utf-8' }
  );

  console.log(result);
  console.log('✨ Processo concluído!');

} catch (error) {
  console.error('\n❌ Erro ao executar migration:', error.message);
  console.error('\n💡 Solução alternativa:');
  console.error('   Execute manualmente no Supabase SQL Editor:');
  console.error('   1. Acesse: https://supabase.com/dashboard/project/vzfzykzmxyqecfrsewao/editor');
  console.error('   2. Clique em "New query"');
  console.error('   3. Cole o conteúdo de: supabase/migrations/001_initial_schema.sql');
  console.error('   4. Clique em "Run" (F5)');
  console.error('\n   Ou siga o guia: EXECUTAR_AGORA.md');
  process.exit(1);
}
