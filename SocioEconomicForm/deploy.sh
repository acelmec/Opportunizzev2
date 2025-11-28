#!/bin/bash
# ========================================
# SeguroPro / Opportunizze
# Script de Deploy para VPS
# ========================================

set -e

echo "🚀 Iniciando deploy do Opportunizze..."

# Configurações
APP_DIR="/var/www/Opportunizze"
BRANCH="main"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Funções
print_step() {
    echo -e "${GREEN}[STEP]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar se está no diretório correto
if [ ! -d "$APP_DIR" ]; then
    print_error "Diretório $APP_DIR não encontrado!"
    exit 1
fi

cd "$APP_DIR"

# 1. Fazer backup do .env (se existir)
print_step "Fazendo backup do .env..."
if [ -f ".env" ]; then
    cp .env .env.backup
fi

# 2. Pull das alterações
print_step "Baixando alterações do GitHub..."
git fetch origin
git checkout $BRANCH
git pull origin $BRANCH

# 3. Restaurar .env
if [ -f ".env.backup" ]; then
    cp .env.backup .env
fi

# 4. Instalar dependências
print_step "Instalando dependências..."
npm ci --only=production

# 5. Build do projeto
print_step "Fazendo build do projeto..."
npm run build

# 6. Reiniciar aplicação via PM2
print_step "Reiniciando aplicação..."
if pm2 list | grep -q "opportunizze"; then
    pm2 restart opportunizze
else
    pm2 start dist/index.cjs --name "opportunizze"
fi

# 7. Salvar configuração do PM2
pm2 save

# 8. Verificar status
print_step "Verificando status..."
pm2 status opportunizze

# 9. Health check
print_step "Verificando health check..."
sleep 5
if curl -s http://localhost:5000/api/health | grep -q "healthy"; then
    echo -e "${GREEN}✅ Deploy concluído com sucesso!${NC}"
else
    print_warning "Health check falhou. Verifique os logs:"
    pm2 logs opportunizze --lines 20
fi

echo ""
echo "📊 Para ver logs: pm2 logs opportunizze"
echo "🔄 Para reiniciar: pm2 restart opportunizze"
echo "❌ Para parar: pm2 stop opportunizze"
