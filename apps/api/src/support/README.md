# Bridge Catarina — Isidoro → Suporte Técnico no CRM

Quando o usuário tem um problema, o Isidoro só chama esta rota **depois do
Confirmar**. A Catarina grava um **chamado de Suporte Técnico** (`SupportTicket`),
não uma `Activity`.

O Isidoro só oferece a ação para estes perfis: **Gerente**, **Administrador**,
**Diretor Financeiro** e **Proprietário**. O CRM não confere o perfil de novo.
Quem chama precisa já ter passado pelo Confirmar no Isidoro.

O SLA é **um só para todos os planos**: 24 horas a partir da abertura
(`SUPPORT.sla.durationMs` em `support-config.ts`). O prazo fica em `slaDueAt`.

> Esqueleto: rota, contrato, autenticação, entidade e dedupe funcionam.
> O vínculo `tenantId` → Contact/Company continua em aberto.

## Endpoint

`POST /api/support/isidoro-activities` (API Nest, porta padrão 3001)

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
- `idempotencyKey` obrigatório e **único**. A mesma chave devolve o chamado já aberto.

Resposta `201`:

```json
{
  "ticketId": "ck...",
  "ticketNumber": 12,
  "slaDueAt": "2026-11-06T15:00:00.000Z",
  "status": "created"
}
```

Repetição da mesma chave: `201` com o mesmo `ticketId` / `ticketNumber` e
`status: "existing"`. `400` payload inválido (com `issues`). `403` chave
errada ou ausente. `503` bridge sem `CATARINA_BRIDGE_USER_ID`.

O assunto e o corpo levam o número do chamado e o prazo do SLA.

## Autenticação

Mesmo padrão das rotas internas (`CRON_SECRET`): Bearer com segredo de env,
comparado com `crypto.timingSafeEqual` sobre SHA-256 dos dois lados. A rota usa
`@AllowAnonymous()` para pular a sessão Better Auth. Sem
`CATARINA_BRIDGE_API_KEY` a rota responde 503 e nunca aceita.

## Como abre o chamado

`SupportTicketService` grava a tabela `supportTicket`:

- `number` sequencial
- `idempotencyKey` única
- `slaDueAt` = agora + 24 horas
- `createdById` = `CATARINA_BRIDGE_USER_ID`
- `companyId` = `CATARINA_SUPPORT_COMPANY_ID` quando essa variável existe

Uma chave repetida não insere outra linha. Se duas chamadas disputam a mesma
chave, a restrição única devolve o chamado que ganhou a corrida.

## Variáveis de ambiente

| Var | Para quê |
|---|---|
| `CATARINA_BRIDGE_API_KEY` | segredo compartilhado com o Isidoro (≥ 32 chars) |
| `CATARINA_SUPPORT_COMPANY_ID` | Company opcional pendurada no chamado |
| `CATARINA_BRIDGE_USER_ID` | User do CRM autor do chamado |

## Testes

`cd apps/api && CRM_TELEMETRY_DISABLED=1 bun test --preload ./test/setup.ts test/catarina-bridge.spec.ts`

O spec cobre o verifier, o contrato, o controller e o serviço com um store em
memória (dedupe e SLA), sem banco.

## Em aberto

1. **Contato:** mapear `tenantId` / `userId` / `email` para Contact e Company.
   Hoje o chamado guarda os ids do Isidoro e, se configurada, uma Company fixa.
2. **Auth:** Bearer compartilhado basta neste esqueleto. Rotação, HMAC e
   anti-replay ficam para uma revisão de produção.
3. **Retorno:** o Isidoro recebe id, número e SLA na resposta. Não há callback
   quando a Catarina resolve o chamado.
4. **Retries:** o Isidoro reenvia a mesma `idempotencyKey`. A bridge não cria
   outro chamado.
