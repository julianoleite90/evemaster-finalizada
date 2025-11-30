#!/bin/bash

# ============================================
# Script para atualizar senha via API
# Usuário: julianodesouzaleite@gmail.com
# Senha: Password90!#%90
# ============================================

# Configurações
EMAIL="julianodesouzaleite@gmail.com"
PASSWORD="Password90!#%90"
API_URL="${API_URL:-http://localhost:3000}/api/admin/update-user-password"

echo "============================================"
echo "Atualizando senha via API"
echo "============================================"
echo "Email: $EMAIL"
echo "API URL: $API_URL"
echo ""

# Fazer requisição
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$EMAIL\",
    \"password\": \"$PASSWORD\"
  }")

# Separar body e status code
HTTP_BODY=$(echo "$RESPONSE" | head -n -1)
HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)

echo "Status Code: $HTTP_CODE"
echo "Response:"
echo "$HTTP_BODY" | jq '.' 2>/dev/null || echo "$HTTP_BODY"
echo ""

if [ "$HTTP_CODE" -eq 200 ]; then
  echo "✅ Senha atualizada com sucesso!"
else
  echo "❌ Erro ao atualizar senha. Verifique:"
  echo "  1. Se a API está rodando"
  echo "  2. Se as variáveis de ambiente estão configuradas (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)"
  echo "  3. Se o usuário existe no banco de dados"
fi

