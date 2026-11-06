import { describe, expect, it, mock } from "bun:test";
import {
	ForbiddenException,
	NotFoundException,
	ServiceUnavailableException,
} from "@nestjs/common";
import { BridgeKeyVerifier } from "../src/support/bridge-key.verifier";
import {
	type IsidoroTicketRequest,
	isidoroTicketInput,
} from "../src/support/isidoro-ticket.contracts";
import { IsidoroTicketsController } from "../src/support/isidoro-tickets.controller";
import {
	SUPPORT,
	SUPPORT_OPENER_ROLES,
	supportSlaDurationMs,
} from "../src/support/support-config";
import type { SupportTicketGateway } from "../src/support/support-ticket.gateway";
import { SupportTicketService } from "../src/support/support-ticket.service";
import {
	DuplicateSupportTicket,
	type NewSupportTicket,
	type SupportTicketRecord,
	type SupportTicketStore,
} from "../src/support/support-ticket.store";

const KEY = "test-bridge-key-0123456789abcdef";
const OPENED_AT = new Date("2026-11-05T15:00:00.000Z");
const HOUR_MS = 60 * 60 * 1000;

const validPayload = {
	idempotencyKey: "isidoro-update-123",
	user: {
		tenantId: "tenant-1",
		userId: "user-1",
		email: "joao@fazenda.test",
		role: "Gerente",
	},
	problem: {
		description: "Não consigo lançar o abastecimento da colheitadeira.",
	},
	context: { module: "maquinas", conversationId: "conv-9", severity: "high" },
} as const;

function fakeGateway(): SupportTicketGateway & {
	openTicket: ReturnType<typeof mock>;
	readTicket: ReturnType<typeof mock>;
} {
	return {
		openTicket: mock(async () => ({
			ticketId: "ticket-1",
			ticketNumber: 7,
			slaDueAt: OPENED_AT,
			status: "created" as const,
		})),
		readTicket: mock(async () => ({
			ticketId: "ticket-1",
			ticketNumber: 7,
			status: "OPEN" as const,
			slaDueAt: OPENED_AT,
			closedAt: null,
			assigneeId: null,
		})),
	};
}

class MemorySupportTicketStore implements SupportTicketStore {
	readonly records: SupportTicketRecord[] = [];

	async findByIdempotency(
		tenantId: string,
		idempotencyKey: string,
	): Promise<SupportTicketRecord | null> {
		return (
			this.records.find(
				(row) =>
					row.tenantId === tenantId && row.idempotencyKey === idempotencyKey,
			) ?? null
		);
	}

	async findByNumber(
		tenantId: string,
		ticketNumber: number,
	): Promise<SupportTicketRecord | null> {
		return (
			this.records.find(
				(row) => row.tenantId === tenantId && row.number === ticketNumber,
			) ?? null
		);
	}

	async create(
		ticket: NewSupportTicket,
		name: (number: number) => { subject: string; body: string },
	): Promise<SupportTicketRecord> {
		if (
			this.records.some(
				(row) =>
					row.tenantId === ticket.tenantId &&
					row.idempotencyKey === ticket.idempotencyKey,
			)
		) {
			throw new DuplicateSupportTicket();
		}
		const number = this.records.length + 1;
		const named = name(number);
		const saved: SupportTicketRecord = {
			id: `ticket-${number}`,
			number,
			tenantId: ticket.tenantId,
			idempotencyKey: ticket.idempotencyKey,
			subject: named.subject,
			body: named.body,
			slaDueAt: ticket.slaDueAt,
			status: "OPEN",
			closedAt: null,
			assigneeId: null,
		};
		this.records.push(saved);
		return saved;
	}
}

function serviceWith(
	store: SupportTicketStore,
	actingUserId: string | null = "user-catarina",
	slaDurationMs = SUPPORT.sla.defaultHours * HOUR_MS,
): SupportTicketService {
	return new SupportTicketService(
		store,
		{
			companyId: "company-support",
			actingUserId: actingUserId ?? undefined,
		},
		{
			now: () => OPENED_AT,
			slaDurationMs,
		},
	);
}

describe("supportSlaDurationMs", () => {
	it("uses 8 hours when the env value is missing or invalid", () => {
		expect(supportSlaDurationMs(undefined)).toBe(8 * HOUR_MS);
		expect(supportSlaDurationMs("")).toBe(8 * HOUR_MS);
		expect(supportSlaDurationMs("foo")).toBe(8 * HOUR_MS);
		expect(supportSlaDurationMs("0")).toBe(8 * HOUR_MS);
		expect(supportSlaDurationMs("1.5")).toBe(8 * HOUR_MS);
	});

	it("uses a whole number of hours when the env value is in range", () => {
		expect(supportSlaDurationMs("8")).toBe(8 * HOUR_MS);
		expect(supportSlaDurationMs("3")).toBe(3 * HOUR_MS);
	});
});

describe("BridgeKeyVerifier", () => {
	it("refuses when the key is not configured", () => {
		const verifier = new BridgeKeyVerifier(undefined);
		expect(() => verifier.assert(`Bearer ${KEY}`)).toThrow(
			ServiceUnavailableException,
		);
	});

	it("rejects a missing header", () => {
		expect(() => new BridgeKeyVerifier(KEY).assert(undefined)).toThrow(
			ForbiddenException,
		);
	});

	it("rejects a wrong key, including one of different length", () => {
		const verifier = new BridgeKeyVerifier(KEY);
		expect(() => verifier.assert("Bearer wrong")).toThrow(ForbiddenException);
		expect(() => verifier.assert(`Bearer ${KEY.slice(0, -1)}x`)).toThrow(
			ForbiddenException,
		);
		expect(() => verifier.assert(KEY)).toThrow(ForbiddenException);
	});

	it("accepts the right bearer key", () => {
		expect(() =>
			new BridgeKeyVerifier(KEY).assert(`Bearer ${KEY}`),
		).not.toThrow();
	});
});

describe("isidoroTicketInput", () => {
	it("accepts a valid payload from an allowed role", () => {
		expect(isidoroTicketInput.safeParse(validPayload).success).toBe(true);
		expect(SUPPORT_OPENER_ROLES).toEqual([
			"Gerente",
			"Administrador",
			"Diretor Financeiro",
			"Proprietário",
		]);
	});

	it("requires the idempotency key", () => {
		const { idempotencyKey: _key, ...rest } = validPayload;
		expect(isidoroTicketInput.safeParse(rest).success).toBe(false);
	});

	it("requires a role", () => {
		const payload = {
			...validPayload,
			user: { tenantId: "tenant-1", userId: "user-1", email: "a@b.test" },
		};
		expect(isidoroTicketInput.safeParse(payload).success).toBe(false);
	});
});

describe("IsidoroTicketsController", () => {
	it("rejects without opening a ticket when the key is wrong", async () => {
		const tickets = fakeGateway();
		const controller = new IsidoroTicketsController(
			new BridgeKeyVerifier(KEY),
			tickets,
		);
		await expect(
			controller.create(validPayload, "Bearer nope"),
		).rejects.toThrow(ForbiddenException);
		expect(tickets.openTicket).not.toHaveBeenCalled();
	});

	it("returns 400 for an invalid payload without opening a ticket", async () => {
		const tickets = fakeGateway();
		const controller = new IsidoroTicketsController(
			new BridgeKeyVerifier(KEY),
			tickets,
		);
		const body: IsidoroTicketRequest = { problem: {} };
		await expect(
			controller.create(body, `Bearer ${KEY}`),
		).rejects.toMatchObject({ status: 400 });
		expect(tickets.openTicket).not.toHaveBeenCalled();
	});

	it("rejects a role that cannot open a ticket", async () => {
		const tickets = fakeGateway();
		const controller = new IsidoroTicketsController(
			new BridgeKeyVerifier(KEY),
			tickets,
		);
		const body: IsidoroTicketRequest = {
			...validPayload,
			user: { ...validPayload.user, role: "Operador" },
		};
		await expect(controller.create(body, `Bearer ${KEY}`)).rejects.toThrow(
			ForbiddenException,
		);
		expect(tickets.openTicket).not.toHaveBeenCalled();
	});

	it("returns the ticket id, number and SLA from the gateway", async () => {
		const tickets = fakeGateway();
		const controller = new IsidoroTicketsController(
			new BridgeKeyVerifier(KEY),
			tickets,
		);
		const result = await controller.create(validPayload, `Bearer ${KEY}`);
		expect(result).toEqual({
			ticketId: "ticket-1",
			ticketNumber: 7,
			slaDueAt: OPENED_AT.toISOString(),
			status: "created",
		});
		expect(result).not.toHaveProperty("activityId");
	});

	it("reads a ticket for the same tenant", async () => {
		const tickets = fakeGateway();
		const controller = new IsidoroTicketsController(
			new BridgeKeyVerifier(KEY),
			tickets,
		);
		const result = await controller.read("7", "tenant-1", `Bearer ${KEY}`);
		expect(result.status).toBe("OPEN");
		expect(result.ticketNumber).toBe(7);
		expect(tickets.readTicket).toHaveBeenCalledWith("tenant-1", 7);
	});
});

describe("SupportTicketService", () => {
	it("opens one ticket with a number, an open status and the shared SLA", async () => {
		const store = new MemorySupportTicketStore();
		const input = isidoroTicketInput.parse(validPayload);

		const opened = await serviceWith(store).open(input);

		expect(opened.status).toBe("created");
		expect(opened.ticketNumber).toBe(1);
		expect(opened.slaDueAt).toEqual(
			new Date(OPENED_AT.getTime() + 8 * HOUR_MS),
		);
		expect(store.records[0]?.status).toBe("OPEN");
		expect(store.records[0]?.closedAt).toBeNull();
		expect(store.records[0]?.assigneeId).toBeNull();
		expect(store.records[0]?.subject).toContain("[Suporte #1]");
		expect(store.records[0]?.body).toContain(opened.slaDueAt.toISOString());
		expect(store.records[0]?.subject.includes("TASK")).toBe(false);
	});

	it("returns the same ticket when the same tenant repeats the key", async () => {
		const store = new MemorySupportTicketStore();
		const tickets = serviceWith(store);
		const input = isidoroTicketInput.parse(validPayload);

		const first = await tickets.open(input);
		const second = await tickets.open(input);

		expect(second).toEqual({ ...first, status: "existing" });
		expect(store.records).toHaveLength(1);
	});

	it("opens another ticket when a different tenant reuses the key", async () => {
		const store = new MemorySupportTicketStore();
		const tickets = serviceWith(store);
		const input = isidoroTicketInput.parse(validPayload);

		await tickets.open(input);
		const other = await tickets.open({
			...input,
			user: { ...input.user, tenantId: "tenant-2" },
		});

		expect(other.ticketNumber).toBe(2);
		expect(other.status).toBe("created");
		expect(store.records).toHaveLength(2);
	});

	it("returns the winner when the insert loses the idempotency race", async () => {
		const winner: SupportTicketRecord = {
			id: "ticket-winner",
			number: 4,
			tenantId: "tenant-1",
			idempotencyKey: validPayload.idempotencyKey,
			subject: "[Suporte #4] já aberto",
			body: "SLA: 2026-11-05T23:00:00.000Z",
			slaDueAt: new Date(OPENED_AT.getTime() + 8 * HOUR_MS),
			status: "OPEN",
			closedAt: null,
			assigneeId: "user-fila",
		};
		let visible = false;
		const store: SupportTicketStore = {
			async findByIdempotency() {
				return visible ? winner : null;
			},
			async findByNumber() {
				return null;
			},
			async create() {
				visible = true;
				throw new DuplicateSupportTicket();
			},
		};

		const opened = await serviceWith(store).open(
			isidoroTicketInput.parse(validPayload),
		);

		expect(opened).toEqual({
			ticketId: "ticket-winner",
			ticketNumber: 4,
			slaDueAt: winner.slaDueAt,
			status: "existing",
		});
	});

	it("refuses when the bridge user is not configured", async () => {
		const store = new MemorySupportTicketStore();
		await expect(
			serviceWith(store, null).open(isidoroTicketInput.parse(validPayload)),
		).rejects.toThrow(ServiceUnavailableException);
		expect(store.records).toHaveLength(0);
	});

	it("refuses a role outside the allow-list", async () => {
		const store = new MemorySupportTicketStore();
		const input = isidoroTicketInput.parse({
			...validPayload,
			user: { ...validPayload.user, role: "Gerente" },
		});
		await expect(
			serviceWith(store).open({
				...input,
				user: { ...input.user, role: "Operador" },
			}),
		).rejects.toThrow(ForbiddenException);
		expect(store.records).toHaveLength(0);
	});

	it("reads the ticket only for its tenant", async () => {
		const store = new MemorySupportTicketStore();
		const tickets = serviceWith(store);
		const opened = await tickets.open(isidoroTicketInput.parse(validPayload));

		const found = await tickets.read("tenant-1", opened.ticketNumber);
		expect(found.ticketId).toBe(opened.ticketId);
		expect(found.assigneeId).toBeNull();
		await expect(tickets.read("tenant-2", opened.ticketNumber)).rejects.toThrow(
			NotFoundException,
		);
	});
});
