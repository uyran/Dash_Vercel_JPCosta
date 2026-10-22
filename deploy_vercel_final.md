# Deploy: VS Code → Git → Vercel (qualquer app)

> **Como usar este arquivo:** peça à IA: _"Leia `deploy_vercel_final.md` e siga esse passo a passo para este projeto."_
>
> Regras para a IA seguir:
>
> 1. Execute as etapas **na ordem** e **confirme cada resultado** antes de avançar.
> 2. Antes de qualquer ação que altere estado (commit, push, criação de projeto, deploy), **peça autorização ao usuário** listando exatamente o que será feito.
> 3. Se algum comando falhar, **não siga em frente**: diagnostique (ver seção 10) e corrija até o objetivo estar cumprido.
> 4. Nunca exiba, copie ou comita tokens, chaves ou `.env`.

---

## 1. Pré-requisitos

| Item         | Onde        | Conferência                                      |
| ------------ | ----------- | ------------------------------------------------ |
| Conta GitHub | github.com  | dono do repositório                              |
| Conta Vercel | vercel.com  | Hobby basta; mesma identidade do GitHub facilita |
| Node.js LTS  | nodejs.org  | `node -v`                                        |
| Git          | git-scm.com | `git --version`                                  |

---

## 2. Conferir localmente antes de versionar

1. Abra a pasta do projeto no VS Code (`File → Open Folder`) e use o terminal integrado, que abre com `` Ctrl+` ``.
2. Instale dependências e rode o que o projeto tiver:

```bash
npm install
npm run dev      # app sobe em local (ex.: http://localhost:3000)
npm run lint     # se existir
npm test         # se existir
npm run build    # OBRIGATÓRIO: precisa terminar com "built in Xs"
```

3. **Confirme a saída do build** — se não existir localmente, a Vercel também falha:
   - Vite / SPA estático → pasta `dist/`
   - Nitro / TanStack Start → arquivo `.vercel/output/config.json`
   - Next.js → a própria Vercel gera a saída na nuvem
4. **`package.json` precisa ter o script `build`** — a Vercel o usa automaticamente; sem ele a detecção de framework falha. Também deve existir `dev`.
5. **Segredos** nunca vão no código: `.env.local` (gitignorado) localmente e as Environment Variables do painel da Vercel em produção.

---

## 3. Versionamento com Git

### 3.1 Autor do commit (uma vez por máquina)

```bash
git config --global user.name  "Seu Nome"
git config --global user.email "seu@email.com"   # mesmo e-mail do GitHub
```

> Sem isso o Git grava autor automático (`Admin <Admin@maquina>`). Para corrigir um commit **ainda não enviado**: `git commit --amend --reset-author`.

### 3.2 `.gitignore` mínimo

```gitignore
node_modules
dist
dist-ssr
.output
.nitro
.vinxi
*.local

# Vercel (gerado pela CLI)
.vercel
.env*
```

> **Nunca versione:** `.vercel/` (contém `project.json` do vínculo local), `.env*` (tokens/segredos), `node_modules`, `dist`. Os dois primeiros padrões (`*.local`, `.env*`) já cobrem o `.env.local`.

### 3.3 Primeiro commit e push

```bash
git init
git add .
git status                    # confira NADA sensível sendo incluído
git commit -m "mensagem curta e descritiva"
git branch -M main
git remote add origin https://github.com/<usuario>/<repo>.git
git push -u origin main
```

Mensagem de commit: curta, em português, no imperativo (ex.: `adiciona tabela de votos por cidade`).

**Antes de cada push:** `npm run lint && npm test && npm run build`.

Não reescreva histórico já enviado (`push --force`, `commit --amend` em commit publicado) — quebra o repositório dos outros.

---

## 4. Como a Vercel constrói o projeto

- **Detecção automática:** a Vercel lê `package.json` e os arquivos de config (`vite.config.*`, `next.config.*`...) e preenche _Build Command_ e _Output Directory_ sozinha.
- **Saídas comuns:**
  - SPA/Vite estático → `dist/`
  - Next.js → gerenciado pela Vercel
  - Nitro/TanStack Start (preset `vercel`) → **Build Output API**: `.vercel/output/` (`static/` + `functions/`). Se existir `.vercel/output/config.json`, a Vercel o usa automaticamente.
- **`vercel.json` só é necessário** em casos especiais (detecção falha, saída fora do padrão):

```jsonc
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "tanstack-start", // quando a detecção falhar
  "buildCommand": "npm run build", // quando o padrão estiver errado
  "outputDirectory": "dist", // quando a saída não for a padrão
  "installCommand": "npm ci",
}
```

- Se a detecção sair errada e não quiser `vercel.json`: `Settings → Build & Development Settings` no painel.

---

## 5. Deploy — Opção A: Integração Git (recomendada)

Cada `git push` em `main` gera um deploy automático de produção.

### 5.1 Login

```bash
npx --yes vercel@latest login
npx --yes vercel@latest whoami     # deve mostrar seu usuário
```

### 5.2 Criar projeto e linkar a pasta

```bash
# nome do projeto: minúsculas, SEM espaço, travessão ou maiúsculas
npx vercel project create meu-projeto

# linka a pasta local ao projeto (cria .vercel/project.json, gitignorado)
npx vercel link --yes --project meu-projeto --scope <seu-escopo>
```

> O `--scope` é o time/conta (aparece em `npx vercel project ls`).

### 5.3 Conectar o repositório GitHub

```bash
npx vercel git connect https://github.com/<usuario>/<repo>.git \
  --project meu-projeto --scope <escopo> --yes
# esperado: > Connected
```

**Se falhar com `Failed to connect ... Make sure there aren't any typos...`:**

| #   | Causa provável                                                                         | Correção                                                                                                                          |
| --- | -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| 1   | O **App GitHub da Vercel** não foi autorizado (login com GitHub **não** instala o App) | Painel `.../settings/git` → **Connect** → GitHub → **Authorize Vercel** → escolha o repositório → Connect; rode o comando de novo |
| 2   | CLI em modo agente/CI **sem TTY** (não abre o navegador)                               | Use o painel (item 1) ou rode em um terminal interativo normal                                                                    |
| 3   | Conta GitHub conectada ≠ dono do repositório                                           | Confirme o usuário logado em github.com e na Vercel                                                                               |
| 4   | Repo privado sem acesso do App                                                         | `github.com/settings/installations` → Vercel → dar acesso ao repo                                                                 |

Confirme o vínculo: `npx vercel project ls`.

### 5.4 Validar o pipeline (teste de fogo)

1. Commit real (mesmo pequeno) + `git push origin main`.
2. `npx vercel ls` (deployments) e `npx vercel inspect <deployment-url>` (logs do build).
3. Sucesso: deployment com `state = READY` e `target = production`.

---

## 6. Deploy — Opção B: Manual via CLI (sem integração Git)

```bash
npx vercel deploy --prod            # build roda NA Vercel
# ou build local + upload pré-construído:
npx vercel build
npx vercel deploy --prebuilt --prod
```

- Sem `--prod` o deploy vira **preview** (URL temporária).
- Repita o comando para atualizar (nada automático).

---

## 7. Variáveis de ambiente

- Cadastro: `Project → Settings → Environment Variables` (Production/Preview/Development).
- **Só variáveis com o prefixo certo chegam ao código:**
  - Vite/SPA → `VITE_`
  - Next.js (client) → `NEXT_PUBLIC_`
  - Nitro/TanStack Start (servidor) → `NITRO_` (vira `runtimeConfig`)
- Baixar as variáveis do painel para o local:

```bash
npx vercel env pull .env.local
npx vercel env ls          # listar cadastradas
```

---

## 8. Checklist antes de considerar "pronto"

- [ ] `npm run lint` sem erros · `npm test` sem falhas · `npm run build` conclui
- [ ] Saída do build existe (`dist/` ou `.vercel/output/config.json`)
- [ ] `git status` limpo; sem `.env`, `.vercel` ou `node_modules` versionados
- [ ] Git com `user.name`/`user.email` corretos (autor = você)
- [ ] `vercel link` feito e `vercel git connect` → **Connected**
- [ ] Push em `main` gera deployment automático `READY`
- [ ] URL de produção responde **HTTP 200** e mostra o conteúdo esperado:

```powershell
$r = Invoke-WebRequest "https://<projeto>.vercel.app" -UseBasicParsing
$r.StatusCode                      # 200
if ($r.Content -match '<title>([^<]+)</title>') { $Matches[1] }
```

- [ ] Acesso **anônimo** funciona — se vier a página de login da Vercel, desative em `Settings → Deployment Protection` (previews podem continuar protegidos)
- [ ] Se for site público: `<title>`/description, favicon e `robots.txt` presentes
- [ ] Variáveis de ambiente cadastradas no painel (se o app precisar)

---

## 9. Comandos de referência rápida

```bash
npx vercel --version          # versão da CLI
npx vercel whoami             # quem está logado
npx vercel project ls         # projetos do escopo atual
npx vercel link --yes --project <nome> --scope <escopo>
npx vercel git connect <url-do-repo> --project <nome> --scope <escopo> --yes
npx vercel git disconnect     # desconecta o repositório
npx vercel ls                 # deployments
npx vercel inspect <url>      # detalhes/logs
npx vercel logs <url>         # logs da função
npx vercel env ls             # variáveis cadastradas
npx vercel env pull <arquivo> # baixa variáveis para local
npx vercel deploy --prod      # deploy manual de produção
npx vercel logout             # sair
```

Token de API fica em `%APPDATA%\com.vercel.cli\Data\auth.json` no Windows — **nunca imprima o token**.

---

## 10. Solução de problemas

| Erro / sintoma                              | Causa                                                | Correção                                                                                   |
| ------------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `Logged out`                                | sessão expirada/não autenticado                      | `npx vercel login`                                                                         |
| `Failed to connect <repo> to project` (400) | App GitHub não autorizado, CLI sem TTY, conta errada | Seção 5.3                                                                                  |
| `Output directory ... not found`            | framework/saída mal detectados                       | `vercel.json` (`framework`/`outputDirectory`) ou `Settings → Build & Development Settings` |
| Deploy cria página vazia/404                | build publica em pasta diferente da servida          | mesma correção acima; com Build Output API confirme `.vercel/output/config.json`           |
| Site exige login da Vercel                  | Deployment Protection em "Protection Everywhere"     | `Settings → Deployment Protection` → desative para produção                                |
| CI/push não gera deploy                     | webhook/App desconectado ou branch errada            | `settings/git` → reconecte; branch de produção = `main`                                    |
| Commit com autor errado                     | `user.name`/`user.email` ausentes                    | §3.1 + `git commit --amend --reset-author` (só se não enviado)                             |
| `npm run lint` falha antes do commit        | formatação/erros                                     | `npx prettier --write .` e corrija o ESLint; nunca use `--no-verify`                       |
| Erro de permissão em repo privado           | App sem acesso                                       | GitHub → Settings → Installations → Vercel → conceder acesso                               |
| Variável de ambiente "não existe" no app    | prefixo errado ou não cadastrada                     | §7: confirme o prefixo e o ambiente no painel                                              |
