# Bridge Catarina — Isidoro → chamado de Suporte Técnico

O Isidoro só chama esta rota **depois do Confirmar**. Quem pode abrir o chamado
é **Gerente**, **Administrador**, **Diretor Financeiro** ou **Proprietário**.
O CRM recusa qualquer outro `user.role`. A chave da bridge continua compartilhada;
o perfil é uma segunda trava.

O SLA é **um só para todos os planos**. O valor vem de
`SUPPORT_TICKET_SLA_HOURS`. Sem variável, valor vazio, ou número inválido, o
prazo é **8 horas**. Ele fica em `slaDueAt`.

O chamado é um `SupportTicket`. Não é uma `Activity`.

O e-mail e o nome do solicitante ficam no corpo do chamado para a fila de
suporte. A retenção segue a da base do CRM. Não há prazo separado de descarte
neste esqueleto.

> `tenantId` ainda não vira Contact nem Company. O chamado guarda os ids do
> Isidoro e, se configurada, uma Company fixa.

## Endpoint

`POST /api/support/tickets`

`GET /api/support/tickets/:ticketNumber?tenantId=<tenant>`

Header: `Authorization: Bearer <CATARINA_BRIDGE_API_KEY>`

```json
{
  "idempotencyKey": "isidoro-update-123",
  "user": {
    "tenantId": "tenant-1",
    "userId": "user-1",
    "name": "João",
    "email": "joao@fazenda.test",
    "role": "Gerente"
  },
  "problem": { "description": "Não consigo lançar o abastecimento da colheitadeira." },
  "context": { "module": "maquinas", "conversationId": "conv-9", "severity": "high" }
}
```

- `user.tenantId`, `user.userId` e `user.role` obrigatórios; `name` **ou** `email`.
- `role` ∈ Gerente | Administrador | Diretor Financeiro | Proprietário. Outro perfil: `403`.
- `idempotencyKey` é única **por tenant**. Outro tenant pode repetir a mesma chave.
- A mesma chave no mesmo tenant devolve o chamado já aberto (`status: "existing"`).

Resposta `201`:

```json
{
  "ticketId": "ck...",
  "ticketNumber": 12,
  "slaDueAt": "2026-11-05T23:00:00.000Z",
  "status": "created"
}
```

`GET` devolve `status` (`OPEN`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`), `closedAt`
e `assigneeId`. Outro tenant recebe `404`.

O assunto e o corpo levam o número do chamado e o prazo do SLA. A criação e o
texto final entram na mesma transação.

## Autenticação

Bearer comparado com `crypto.timingSafeEqual` sobre SHA-256. `@AllowAnonymous()`
pula a sessão Better Auth. Sem `CATARINA_BRIDGE_API_KEY` a rota responde 503.

Rotação da chave, HMAC e anti-replay ficam para produção.

## Variáveis

| Var | Para quê |
|---|---|
| `CATARINA_BRIDGE_API_KEY` | segredo compartilhado com o Isidoro (≥ 32 chars) |
| `CATARINA_SUPPORT_COMPANY_ID` | Company opcional no chamado |
| `CATARINA_BRIDGE_USER_ID` | User do CRM autor do chamado |
| `SUPPORT_TICKET_SLA_HOURS` | prazo único em horas; padrão 8 |

## Testes

`cd apps/api && CRM_TELEMETRY_DISABLED=1 bun test --preload ./test/setup.ts test/support-ticket.spec.ts`

O spec usa um store em memória. Não precisa de banco.
