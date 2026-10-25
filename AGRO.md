# Comp AI CRM — versão Agro (add-on)

Este repositório é um fork de [trycompai/crm](https://github.com/trycompai/crm)
(licença MIT, mantida em `LICENSE`; todo o crédito do código original é da Comp AI).
Por cima dele mantemos uma **camada add-on** com a tradução pt-BR e as nossas
funcionalidades, organizada para receber as atualizações do upstream sem
reescrever código.

## Branches

| Branch | Para quê |
|---|---|
| `main` | Espelho do `upstream/main`. **Nunca** commitar nada nosso aqui. |
| `agro` | Todo o nosso trabalho: `main` + add-on. É a branch que roda em produção. |

## Arquitetura do add-on

1. **`packages/agro-i18n/`** (pacote `@crm/agro-i18n`) — é nosso, o upstream nunca mexe nele:
   - `src/pt-BR.json`: catálogo de traduções. **A chave é o texto original em inglês.**
   - `src/index.ts`: `tr("Texto em inglês", { var })` e `trPlural(...)`. Síncrono, sem
     provider: funciona em Server Components, Client Components e módulos comuns.
   - `src/format.ts`: `formatBRL`, `formatNumber`, `formatDate` e a constante de locale `pt-BR`.
2. **Alterações em arquivos do upstream são mínimas**: apenas envolver textos com
   `tr("...")`, `lang="pt-BR"` no layout, e locale `pt-BR` nos formatadores de
   número/moeda (`packages/ui/src/lib/format.ts`, paginação).
3. **Fallback seguro**: se uma chave não está no catálogo, aparece o texto em inglês.
   Textos novos do upstream nunca quebram a tela — só aparecem em inglês até serem
   traduzidos. O idioma é fixo em pt-BR (sem detecção, sem rotas por idioma).
4. **Etapas do funil** (`apps/app/lib/deal-stage.ts`) e status de enriquecimento
   (`apps/app/lib/enrichment-status.ts`) passam pelo catálogo via `tr()`.

> Por que não `next-intl`? A versão 4.x é compatível com o Next 16, mas exige chaves
> estruturadas (sem pontos), provider no layout e configuração por requisição, o que
> conflita com `cacheComponents` e obrigaria a mexer em muito mais arquivos do upstream.
> O catálogo "chave = texto em inglês" reduz conflitos ao mínimo. Se um dia for preciso
> mais de um idioma, o `tr()` pode passar a delegar para o next-intl sem mudar as chamadas.

## Como atualizar a partir do upstream

```bash
git fetch upstream
# 1. Atualizar o espelho (só fast-forward)
git checkout main && git merge --ff-only upstream/main && git push origin main
# 2. Trazer para a nossa branch
git checkout agro && git merge main
# 3. Resolver conflitos: normalmente é só um texto que mudou ao lado de um tr().
#    Regra: aceite o código do upstream e reaplique o tr() no texto.
# 4. Conferir o catálogo
bun scripts/agro/check-i18n.ts              # chaves faltando / sem uso
bun scripts/agro/check-i18n.ts --hardcoded  # textos ainda sem tr() (heurística)
# 5. Traduzir o que faltar em packages/agro-i18n/src/pt-BR.json e validar
cd apps/app && bunx next typegen && bunx tsc --noEmit && bunx biome check . && bunx next build
git push origin agro
```

## Como traduzir uma tela nova

1. No componente, `import { tr } from "@crm/agro-i18n";` e troque `"Texto"` por `tr("Texto")`
   (em JSX: `{tr("Texto")}`; com variável: `tr("Showing {n}", { n })`).
2. Rode `bun scripts/agro/check-i18n.ts` e adicione as chaves que faltam no `pt-BR.json`.

## Progresso da tradução

- **Etapa 1 (feita):** infraestrutura; menu lateral e cabeçalho; tela de login;
  listas de Negócios, Empresas e Contatos (títulos, busca, filtros, ordenação, colunas,
  arquivados, ações em massa, paginação, visualizações salvas); etapas do funil.
- **Próximas etapas:** painel do negócio (cabeçalho e abas Visão geral, Contatos,
  Atividade, Agente); painéis de empresa e contato; tarefas; configurações; chat/agentes;
  onboarding; mensagens de erro da API.
