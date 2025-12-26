#!/bin/sh
set -e

echo "🔄 Rodando migrations do Drizzle..."
pnpm drizzle-kit migrate

echo "🚀 Iniciando aplicação..."
node -r tsconfig-paths/register dist/server.js
