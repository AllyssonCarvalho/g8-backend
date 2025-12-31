#!/bin/sh
set -e

echo "🔄 Rodando migrations do Drizzle..."
pnpm db:push || echo "⚠️  Erro ao rodar migrations, continuando..."

echo "🚀 Iniciando aplicação..."
node -r tsconfig-paths/register dist/server.js
