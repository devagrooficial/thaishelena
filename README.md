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

O Vercel não guarda arquivos em disco, então em produção o banco é um **Turso** (mesmo formato SQLite, plano grátis).

> ⚠️ **Use um banco FIXO.** A integração Turso do Vercel pode criar *um banco novo a cada deploy*
> (nome começando com `dpl-…`). Nesse caso cada atualização do sistema começa com o banco vazio.
> O sistema mostra um aviso vermelho quando detecta isso. A solução é criar um banco próprio e
> informá-lo em `BANCO_URL` / `BANCO_TOKEN`, que têm prioridade sobre as variáveis da integração.

1. Crie o banco fixo no Turso (https://app.turso.tech → **Create Database**, ex.: `thaishelena`).
   - Copie a **URL** (`libsql://thaishelena-<usuario>.<regiao>.turso.io`).
   - Gere um **token** (botão *Create Token* do banco, sem expiração, permissão de leitura e escrita).
   Pelo terminal, o mesmo com a CLI do Turso:
   ```bash
   turso db create thaishelena
   turso db show thaishelena --url
   turso db tokens create thaishelena
   ```
2. No Vercel → **Settings → Environment Variables** (marque Production e Preview):
   - `BANCO_URL` — a URL do passo 1
   - `BANCO_TOKEN` — o token do passo 1
   - `ADMIN_USER`, `ADMIN_PASSWORD`, `AUTH_SECRET` (login; `AUTH_SECRET` = texto aleatório longo)
3. Faça **Redeploy**. No menu lateral, "Banco: Turso" deve mostrar o endereço do seu banco
   (sem `dpl-` no começo) com a bolinha verde.

As tabelas são criadas automaticamente no primeiro acesso. A partir daí, atualizar o sistema não
afeta os dados.

### Recuperar dados de um banco antigo

Se dados ficaram num banco `dpl-…` de um deploy anterior, copie-os para o banco fixo
(nada é apagado; registros que já existem no destino são mantidos):

```bash
ORIGEM_URL=libsql://dpl-....turso.io ORIGEM_TOKEN=... BANCO_URL=libsql://thaishelena-....turso.io BANCO_TOKEN=... node scripts/copiar-banco.mjs
```

Os bancos de cada deploy aparecem na lista de bancos do painel do Turso (ou `turso db list`).

Para trocar a senha, altere `ADMIN_PASSWORD` no Vercel e faça redeploy. Trocar `AUTH_SECRET` desconecta todos os aparelhos.
