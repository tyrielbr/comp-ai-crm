# Bridge Catarina — Isidoro → atividade de suporte no CRM (esqueleto)

Quando o usuário tem um problema, o Isidoro chama esta rota e a Catarina
(o suporte técnico) recebe uma **tarefa** (`Activity` do tipo `TASK`) no CRM.

> Esqueleto para revisão: rota, contrato, autenticação e a chamada ao CRM
> funcionam; dedupe, retries e mapeamento para Contact estão como TODO.

## Endpoint

`POST /api/support/isidoro-activities` (API Nest, porta padrão 3001 / 3011 no ambiente do Felipe)

Header: `Authorization: Bearer <CATARINA_BRIDGE_API_KEY>`

```json
{
  "idempotencyKey": "isidoro-update-123",
  "user": {
    "tenantId": "tenant-1",
    "userId": "user-1",
    "name": "João",
    "email": "joao@fazenda.test"
  },
  "problem": { "description": "Não consigo lançar o abastecimento da colheitadeira." },
  "context": { "module": "maquinas", "conversationId": "conv-9", "severity": "high" }
}
```

- `user.tenantId`, `user.userId` obrigatórios; `name` **ou** `email` obrigatório.
- `problem.description` obrigatório (até 10.000 caracteres).
- `context` opcional; `severity` ∈ `low | medium | high | critical`.
- `idempotencyKey` obrigatório (ainda **não** é usado para dedupe — TODO).

Respostas: `201 {"activityId": "...", "status": "created"}` · `400` payload
inválido (com `issues`) · `403` chave errada/ausente · `503` bridge não configurada.

## Autenticação

Mesmo padrão das rotas internas (`CRON_SECRET`): Bearer com segredo de env,
mas comparado com `crypto.timingSafeEqual` sobre SHA-256 dos dois lados (sem
vazar tamanho). A rota usa `@AllowAnonymous()` para pular a sessão Better Auth.
Sem `CATARINA_BRIDGE_API_KEY` a rota responde 503 e nunca aceita.

## Como cria a atividade

`CrmSupportActivityGateway` (adapter da porta `SupportActivityGateway`) chama o
`ActivitiesService.create` existente — o mesmo usado pelo tRPC
`activities.create` — com `type: TASK`, `subject` `[Isidoro] <módulo>: <resumo>`,
`body` com descrição + tenant/usuário/contexto/idempotency key, `companyId`
fixo e `createdById` do usuário de serviço. Nenhum campo novo no schema.

## Variáveis de ambiente

| Var | Para quê |
|---|---|
| `CATARINA_BRIDGE_API_KEY` | segredo compartilhado com o Isidoro (≥ 32 chars) |
| `CATARINA_SUPPORT_COMPANY_ID` | Company do CRM que recebe as tarefas |
| `CATARINA_BRIDGE_USER_ID` | User do CRM autor das tarefas |

## Testes

`cd apps/api && CRM_TELEMETRY_DISABLED=1 bun test --preload ./test/setup.ts test/catarina-bridge.spec.ts`
(sem banco: verifier, schema, controller e adapter com `ActivitiesService` mockado).

## Perguntas em aberto (Felipe)

1. **Onde pendurar a tarefa?** Hoje uma Company fixa. Mapear `tenantId` → Company
   e `userId/email` → Contact (criar se não existir?).
2. **Dedupe:** onde guardar a `idempotencyKey` (tabela nova, Redis/`REDIS_URL`,
   ou `Activity.meta` — que hoje é validado por `@crm/validation/activity-meta`
   e não aceita um tipo novo sem mudar o schema)? Repetição deve devolver 200 com
   o mesmo `activityId`?
3. **Tipo da atividade:** `TASK` (aparece em "Minhas tarefas", com dono) ou `NOTE`?
   Precisa de `dueAt` por severidade?
4. **Autor/responsável:** criar um User de serviço "Catarina"? Atribuir a alguém do suporte?
5. **Auth:** basta Bearer compartilhado, ou usar as API keys do CRM (`api-keys`)
   / HMAC com timestamp contra replay? Rotação da chave?
6. **Retorno ao Isidoro:** precisa de callback/status quando a Catarina resolver?
7. **Retries:** quem re-tenta em falha transitória — o Isidoro (com a mesma
   idempotencyKey) ou a bridge?
