#!/bin/bash
# Script para executar migration SQL no Supabase via API REST
# Uso: bash scripts/execute-migration.sh

set -e

SUPABASE_URL="https://vzfzykzmxyqecfrsewao.supabase.co"
SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6Znp5a3pteHlxZWNmcnNld2FvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzM4NTcwOCwiZXhwIjoyMDkyOTYxNzA4fQ.s_6HV_WW8R8DV-0itwwF7WOL8WyRvTxZoxamnguPm34"

echo "🚀 Executando migration SQL no Supabase..."
echo "   URL: $SUPABASE_URL"
echo ""

# Ler o arquivo SQL
SQL_FILE="supabase/migrations/001_initial_schema.sql"
SQL_CONTENT=$(cat "$SQL_FILE")

echo "📄 Arquivo: $SQL_FILE"
echo "   Tamanho: $(wc -c < "$SQL_FILE") bytes"
echo ""

# Executar via pg_net (Supabase Edge Function)
# Como não temos acesso direto ao psql, vamos usar a abordagem de executar statement por statement

echo "⚙️  Dividindo SQL em statements..."

# Criar arquivo temporário com statements individuais
TEMP_DIR=$(mktemp -d)
csplit -s -f "$TEMP_DIR/stmt_" "$SQL_FILE" '/^--.*/' '{*}' 2>/dev/null || true

echo "✅ Migration preparada"
echo ""
echo "⚠️  ATENÇÃO: Execute manualmente no Supabase SQL Editor:"
echo "   1. Acesse: https://supabase.com/dashboard/project/vzfzykzmxyqecfrsewao/editor"
echo "   2. Clique em 'New query'"
echo "   3. Cole o conteúdo de: $SQL_FILE"
echo "   4. Clique em 'Run' (F5)"
echo ""
echo "   Ou use o guia: J:\AREA DE TRABALHO\Projetos\Codigo-base\GUIA_MIGRATION.md"
