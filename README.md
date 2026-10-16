# Espaço Thaís Helena — Fichas de clientes

Sistema para cadastrar clientes e manter as fichas (Anamnese, Orçamento Estrias, Orçamento Flacidez e Capa)
**sempre editáveis**, sessão após sessão. O PDF é gerado na hora pelo botão **Imprimir / PDF** — a ficha nunca "trava".

## Como funciona

- **Dashboard**: clientes, atendidas no mês, recebido no mês, pendências de pagamento, fichas recentes.
- **Clientes**: busca por nome, CPF ou telefone. Cada cliente tem sua "pasta" com todas as fichas.
- **Fichas**: o mesmo layout dos formulários originais. Abrem já preenchidas com os dados do cadastro e
  salvam sozinhas a cada alteração (aparece "Salvo ✓" no topo). Na 2ª, 3ª, 4ª sessão é só abrir e continuar.
- **Duplicar** uma ficha cria uma cópia (útil para um novo pacote de tratamento).

Os modelos das fichas ficam em `templates/` (HTML original, apenas com o salvamento trocado para o banco).

## Rodar no computador

```bash
npm install
cp .env.example .env.local   # e preencha ADMIN_USER, ADMIN_PASSWORD, AUTH_SECRET
npm run dev                  # http://localhost:3000
```

Localmente o banco é o arquivo `data/local.db` (SQLite), criado automaticamente.

## Publicar no Vercel

O Vercel não guarda arquivos em disco, então em produção o banco é um **Turso** (mesmo formato SQLite, plano grátis):

1. Suba este projeto para o GitHub e importe no Vercel.
2. No projeto do Vercel → **Storage / Marketplace → Turso** → criar banco e conectar ao projeto.
   Isso cria sozinho as variáveis `TURSO_DATABASE_URL` e `TURSO_AUTH_TOKEN`.
   (Ou crie em turso.tech e cole as duas variáveis manualmente.)
3. Em **Settings → Environment Variables** adicione:
   - `ADMIN_USER` — usuário de login
   - `ADMIN_PASSWORD` — senha de login
   - `AUTH_SECRET` — texto aleatório longo (ex.: resultado de `openssl rand -hex 32`)
4. Deploy. As tabelas são criadas automaticamente no primeiro acesso.

Para trocar a senha, altere `ADMIN_PASSWORD` no Vercel e faça redeploy. Trocar `AUTH_SECRET` desconecta todos os aparelhos.
