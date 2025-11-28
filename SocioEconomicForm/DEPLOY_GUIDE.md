# Guia de Deploy - SeguroPro/Opportunizze
## Docker Swarm + Portainer + Traefik

---

## Passo 1: Sincronizar com GitHub

No Replit, vá em **Version Control** (Git) no painel lateral e:
1. Faça commit das alterações
2. Push para o GitHub

---

## Passo 2: Configurar VPS

### 2.1 Instalar Docker
```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
```

### 2.2 Inicializar Docker Swarm
```bash
docker swarm init --advertise-addr <IP_DO_SERVIDOR>
```

### 2.3 Criar Rede do Traefik
```bash
docker network create --driver=overlay --attachable traefik-public
```

---

## Passo 3: Instalar Portainer

```bash
docker volume create portainer_data

docker service create \
  --name portainer \
  --publish 9443:9443 \
  --publish 9000:9000 \
  --replicas=1 \
  --constraint 'node.role == manager' \
  --mount type=bind,src=/var/run/docker.sock,dst=/var/run/docker.sock \
  --mount type=volume,src=portainer_data,dst=/data \
  portainer/portainer-ce:latest
```

Acesse: `https://SEU_IP:9443`

---

## Passo 4: Instalar Traefik

Crie um arquivo `traefik-stack.yml`:

```yaml
version: '3.8'

services:
  traefik:
    image: traefik:v3.0
    command:
      - "--api.dashboard=true"
      - "--providers.docker=true"
      - "--providers.docker.swarmMode=true"
      - "--providers.docker.exposedbydefault=false"
      - "--entrypoints.web.address=:80"
      - "--entrypoints.websecure.address=:443"
      - "--certificatesresolvers.letsencrypt.acme.httpchallenge=true"
      - "--certificatesresolvers.letsencrypt.acme.httpchallenge.entrypoint=web"
      - "--certificatesresolvers.letsencrypt.acme.email=seu@email.com"
      - "--certificatesresolvers.letsencrypt.acme.storage=/letsencrypt/acme.json"
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - traefik-letsencrypt:/letsencrypt
    networks:
      - traefik-public
    deploy:
      mode: replicated
      replicas: 1
      placement:
        constraints:
          - node.role == manager
      labels:
        - "traefik.enable=true"
        - "traefik.http.middlewares.https-redirect.redirectscheme.scheme=https"
        - "traefik.http.middlewares.https-redirect.redirectscheme.permanent=true"

networks:
  traefik-public:
    external: true

volumes:
  traefik-letsencrypt:
```

Deploy do Traefik:
```bash
docker stack deploy -c traefik-stack.yml traefik
```

---

## Passo 5: Criar Secrets no Portainer

No Portainer, vá em **Secrets** e crie:

| Nome do Secret | Valor |
|----------------|-------|
| `database_url` | `postgresql://seguropro:SUA_SENHA@db:5432/seguropro` |
| `session_secret` | Uma string aleatória de 32+ caracteres |
| `db_password` | A mesma senha usada no database_url |

**Gerar session_secret:**
```bash
openssl rand -hex 32
```

---

## Passo 6: Deploy da Aplicação

### Opção A: Via Portainer (Recomendado)

1. No Portainer, vá em **Stacks** > **Add Stack**
2. Nome: `opportunizze`
3. Cole o conteúdo do `docker-compose.yml`
4. Clique em **Deploy the stack**

### Opção B: Via Linha de Comando

```bash
# Baixar o docker-compose.yml
curl -O https://raw.githubusercontent.com/acelmec/Opportunizze/main/docker-compose.yml

# Deploy
docker stack deploy -c docker-compose.yml opportunizze
```

---

## Passo 7: Configurar DNS

Configure o DNS do seu domínio:

| Tipo | Nome | Valor |
|------|------|-------|
| A | opportunizze.amsolucoes.net.br | IP_DO_SERVIDOR |

---

## Passo 8: Verificar Deploy

```bash
# Ver serviços
docker service ls

# Ver logs da aplicação
docker service logs opportunizze_app -f

# Testar health check
curl https://opportunizze.amsolucoes.net.br/api/health
```

---

## Atualizações Automáticas

### Configurar Webhook no Portainer

1. No Portainer, vá em **Stacks** > `opportunizze`
2. Ative **Enable webhook**
3. Copie a URL do webhook
4. No GitHub, vá em **Settings** > **Secrets and variables** > **Actions**
5. Adicione uma variável `PORTAINER_WEBHOOK_URL` com a URL copiada

Agora, a cada push no `main`, o GitHub Actions vai:
1. Buildar a nova imagem Docker
2. Publicar no GitHub Container Registry
3. Disparar o webhook do Portainer
4. Portainer atualiza o stack automaticamente

---

## Comandos Úteis

```bash
# Escalar réplicas
docker service scale opportunizze_app=3

# Atualizar imagem manualmente
docker service update --image ghcr.io/acelmec/opportunizze:latest opportunizze_app

# Rollback para versão anterior
docker service rollback opportunizze_app

# Ver estatísticas
docker stats

# Limpar imagens antigas
docker image prune -a
```

---

## Sobre as 2 Réplicas

O `docker-compose.yml` configura 2 réplicas da aplicação por:

1. **Alta Disponibilidade**: Se uma cair, a outra continua funcionando
2. **Zero Downtime Updates**: Atualiza uma réplica por vez
3. **Balanceamento de Carga**: Traefik distribui tráfego entre as duas
4. **Tolerância a Falhas**: Swarm recria containers que falharem

Para uma aplicação pequena, você pode reduzir para 1 réplica:
```yaml
replicas: 1
```

---

## Sobre o Traefik

**Vantagens do Traefik:**
- SSL automático com Let's Encrypt
- Roteamento automático por labels
- Dashboard de monitoramento
- Suporte nativo a Docker Swarm

**Alternativa sem Traefik:**
Use o `docker-compose.simple.yml` + Nginx externo ou Cloudflare Tunnel.

---

## Migrações de Banco de Dados

Para manter o banco sincronizado com novas versões:

### Antes do Deploy (no Replit)
```bash
# Gerar migrações
npm run db:push
```

### Em Produção
O Drizzle ORM sincroniza automaticamente na inicialização se configurado.

Para migrações manuais:
```bash
# Conectar ao container
docker exec -it $(docker ps -q -f name=opportunizze_app) sh

# Rodar migração
npm run db:push
```

---

## Troubleshooting

### App não inicia
```bash
docker service logs opportunizze_app -f
```

### Erro de conexão com banco
Verifique se o secret `database_url` está correto e o serviço `db` está rodando.

### SSL não funciona
1. Verifique se o DNS está apontando para o servidor
2. Verifique se as portas 80 e 443 estão abertas
3. Aguarde alguns minutos para o Let's Encrypt gerar o certificado

---

## Arquitetura Final

```
Internet
    │
    ▼
┌──────────────┐
│   Traefik    │ ← SSL + Load Balancing
└──────────────┘
    │
    ▼
┌──────────────┐
│  App (x2)    │ ← 2 réplicas Node.js
└──────────────┘
    │
    ▼
┌──────────────┐
│  PostgreSQL  │ ← Banco de dados
└──────────────┘
```
