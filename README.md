# LiftPage · Painel de criação de landing pages com IA

Painel onde o cliente responde um questionário, recebe um prompt pronto e publica a landing page no GitHub + Railway. No plano Premium, um agente Claude cria a página e publica tudo sozinho.

## Stack

| Parte | Escolha |
|---|---|
| App | Next.js 15 (App Router, Server Actions), React 19, TypeScript, Tailwind 3 |
| Banco | PostgreSQL + Prisma 6 (Railway Postgres em produção) |
| Login | E-mail e senha (bcrypt) com sessão JWT em cookie httpOnly |
| IA | Claude API (`@anthropic-ai/sdk`), modelo `claude-opus-5-5` por padrão, com fallback automático em recusas |
| Repositórios | GitHub REST via Octokit (OAuth App ou token pessoal) |
| Hospedagem | API GraphQL pública do Railway (projeto + serviço a partir do repo + domínio) |
| Estatísticas | Script leve injetado em cada página publicada → `POST /api/track` |

## Telas (menu lateral, sempre no modo escuro)

- **Dashboard**: receita total (soma do que os clientes pagaram), domínios no ar, visitas, visitantes únicos, cliques em CTA, gráfico de 30 dias.
- **Criar página**: questionário em 7 passos (cliente com nome, domínio e valor pago, nicho, tipo de site, modelo, cores, logo e imagens, dados do negócio) → gera o prompt.
- **Páginas publicadas** (com contador no menu): cliente, domínio, valor pago, status e visitas; o detalhe mostra o prompt, o botão de criar ou publicar, o progresso e as estatísticas (visitas, conversão, CTAs mais clicados).
- **Perfil**: dados de cadastro e troca de senha.
- **Assinatura**: plano atual, cobrança (mensal ou vitalício), status, próxima cobrança (o vitalício não tem) e botões de compra pelo Stripe e link para gerenciar ou cancelar o mensal. Não existe plano anual.

## Regras dos planos (`src/lib/plans.ts` e `src/lib/niches.ts`)

| | Pro (R$ 49,90/mês) | Premium (R$ 149,90 vitalício) |
|---|---|---|
| Nichos | 30 | 50 |
| Página única e página com sessões | ✓ | ✓ |
| Prompt para colar no Claude + publicação no GitHub/Railway do cliente | ✓ | ✓ |
| Agente Claude cria a página sozinho | | ✓ |
| Hospedagem automática (contas da plataforma) | | ✓ |
| Prospecção | | ✓ (módulo ainda não construído) |

Os limites são conferidos no servidor, não só na tela. Sem acesso ativo (mensal vencido ou cancelado) o cliente não cria nem publica páginas; o vitalício ativo nunca expira.

Preços em `src/lib/plans.ts`: Pro R$ 49,90/mês e Premium R$ 149,90 vitalício (pagamento único). Não existe plano Basic nem anual.

## Hospedagem

- **Hospedar na LiftPage** (padrão): a página fica em `{PUBLIC_SITE_URL}/{nome-da-empresa}`, servida pelo próprio painel (rota `src/app/[slug]`), em sandbox isolado do painel. Não precisa de GitHub nem Railway.
- **Domínio próprio**: repositório e serviço criados com as contas da plataforma (`PLATFORM_GITHUB_TOKEN`, `PLATFORM_GITHUB_OWNER`, `PLATFORM_RAILWAY_TOKEN`, `PLATFORM_RAILWAY_WORKSPACE_ID`).
- O agente precisa de `ANTHROPIC_API_KEY`.

## Fluxo "Criar página"

1. Questionário salvo como rascunho, com logo e imagens, e o prompt montado em `src/lib/prompt.ts`.
2. **Pro**: o cliente copia o prompt, cola no Claude, cola o HTML de volta e clica em publicar.
   **Premium**: o agente (`src/lib/services/generator.ts`) gera o `index.html` vendo o logo e as fotos.
3. `src/lib/services/pipeline.ts` monta o site (HTML + imagens + `server.js` sem dependências + script de estatísticas), cria o repositório `lp-<slug>` e envia tudo num commit.
4. Cria projeto e serviço no Railway a partir do repositório, gera o domínio `*.up.railway.app` e acompanha o deploy até ficar **No ar**.

## Rodando local

```bash
cp .env.example .env    # preencha DATABASE_URL, SESSION_SECRET e ENCRYPTION_KEY
npm install
npx prisma migrate dev
npm run db:seed         # conta demo Premium: demo@liftpage.dev / demo12345
npm run dev
```

## Deploy do painel no Railway

1. Novo projeto no Railway → adicionar PostgreSQL → adicionar serviço a partir deste repositório.
2. Variáveis: as do `.env.example` (`DATABASE_URL` vem do Postgres). `npm run build` e `npm start` já rodam o Prisma.
3. Criar um GitHub OAuth App com callback `https://SEU-DOMINIO/api/github/callback`.

## Pendências conhecidas

- As chamadas à API do Railway seguem o schema público v2, mas ainda não foram testadas com um token real. Fazer um teste ponta a ponta antes do lançamento.
- A conta Railway (do cliente ou da plataforma) precisa ter o app do GitHub do Railway com acesso aos repositórios criados.
- A publicação roda em segundo plano dentro do próprio servidor. Com muito volume, vale mover para uma fila (por exemplo BullMQ + Redis).
- Checkout pelo Stripe: `/api/checkout/pro` (assinatura mensal) e `/api/checkout/premium` (pagamento único). Fluxo do cliente novo: landing page (`/`, arquivo `public/landing.html`, atualizado com `scripts/sync-landing.sh`) → plano → Stripe Checkout sem conta → `/cadastro?session_id=...` confere o pagamento no Stripe e pede e-mail, senha e confirmação → "Login criado" → painel. Cada pagamento libera um login só. Webhook em `/api/webhooks/stripe` (eventos `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `customer.subscription.updated`, `customer.subscription.deleted`). Variáveis: `STRIPE_SECRET_KEY` e `STRIPE_WEBHOOK_SECRET`.
- Marca LiftPage aplicada a partir de `/mnt/project-files/marca` (`src/app/tokens.css`, `tailwind.config.ts`, logo em `public/`).
