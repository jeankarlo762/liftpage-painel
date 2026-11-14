#!/usr/bin/env bash
# Copia a landing page da pasta do projeto para public/landing.html, servida em "/" para quem não está logado.
# Uso: scripts/sync-landing.sh [caminho/do/index.html]
set -euo pipefail
src="${1:-/mnt/project-files/landing/index.html}"
sed -e 's#\.\./marca/logo-simbolo\.svg#/logo-simbolo.svg#g' \
    -e 's#https://painel-production-55efb48d\.up\.railway\.app/#/#g' \
    "$src" > "$(dirname "$0")/../public/landing.html"
echo "landing atualizada a partir de $src"
