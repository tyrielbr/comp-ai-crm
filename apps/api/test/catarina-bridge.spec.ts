import { describe, expect, it, mock } from "bun:test";
import {
	ForbiddenException,
	ServiceUnavailableException,
} from "@nestjs/common";
import { BridgeKeyVerifier } from "../src/support/bridge-key.verifier";
import { IsidoroActivitiesController } from "../src/support/isidoro-activities.controller";
import {
	type IsidoroActivityRequest,
	isidoroActivityInput,
} from "../src/support/isidoro-activity.contracts";
import type { SupportTicketGateway } from "../src/support/support-activity.gateway";
import { SUPPORT } from "../src/support/support-config";
import { SupportTicketService } from "../src/support/support-ticket.service";
import {
	DuplicateSupportTicket,
	type NewSupportTicket,
	type SupportTicketRecord,
	type SupportTicketStore,
} from "../src/support/support-ticket.store";

const KEY = "test-bridge-key-0123456789abcdef";
const OPENED_AT = new Date("2026-11-05T15:00:00.000Z");

const validPayload = {
	idempotencyKey: "isidoro-update-123",
	user: { tenantId: "tenant-1", userId: "user-1", email: "joao@fazenda.test" },
	problem: {
		description: "Não consigo lançar o abastecimento da colheitadeira.",
	},
	context: { module: "maquinas", conversationId: "conv-9", severity: "high" },
} as const;

function fakeGateway(): SupportTicketGateway & {
	openTicket: ReturnType<typeof mock>;
} {
	return {
		openTicket: mock(async () => ({
			ticketId: "ticket-1",
			ticketNumber: 7,
			slaDueAt: OPENED_AT,
			status: "created" as const,
		})),
	};
}

class MemorySupportTicketStore implements SupportTicketStore {
	readonly records: SupportTicketRecord[] = [];
	readonly inserted: NewSupportTicket[] = [];

	async findByIdempotencyKey(key: string): Promise<SupportTicketRecord | null> {
		return this.records.find((row) => row.idempotencyKey === key) ?? null;
	}

	async insert(ticket: NewSupportTicket): Promise<SupportTicketRecord> {
		if (
			this.records.some((row) => row.idempotencyKey === ticket.idempotencyKey)
		) {
			throw new DuplicateSupportTicket();
		}
		const saved: SupportTicketRecord = {
			id: `ticket-${this.records.length + 1}`,
			number: this.records.length + 1,
			idempotencyKey: ticket.idempotencyKey,
			subject: ticket.subject,
			body: ticket.body,
			slaDueAt: ticket.slaDueAt,
		};
		this.records.push(saved);
		this.inserted.push(ticket);
		return saved;
	}

	async saveCopy(id: string, subject: string, body: string): Promise<void> {
		const row = this.records.find((item) => item.id === id);
		if (!row) throw new Error(`Missing ticket ${id}.`);
		row.subject = subject;
		row.body = body;
	}
}

function serviceWith(
	store: SupportTicketStore,
	actingUserId: string | null = "user-catarina",
): SupportTicketService {
	return new SupportTicketService(
		store,
		{
			companyId: "company-support",
			actingUserId: actingUserId ?? undefined,
		},
		() => OPENED_AT,
	);
}

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

describe("isidoroActivityInput", () => {
	it("accepts a valid payload", () => {
		expect(isidoroActivityInput.safeParse(validPayload).success).toBe(true);
	});

	it("accepts a payload without optional context", () => {
		const { context: _context, ...rest } = validPayload;
		expect(isidoroActivityInput.safeParse(rest).success).toBe(true);
	});

	it("requires the idempotency key", () => {
		const { idempotencyKey: _key, ...rest } = validPayload;
		expect(isidoroActivityInput.safeParse(rest).success).toBe(false);
	});

	it("requires a non-blank problem description", () => {
		const payload = { ...validPayload, problem: { description: "   " } };
		expect(isidoroActivityInput.safeParse(payload).success).toBe(false);
	});

	it("requires tenantId and userId", () => {
		const payload = { ...validPayload, user: { email: "a@b.test" } };
		expect(isidoroActivityInput.safeParse(payload).success).toBe(false);
	});

	it("requires a name or an email", () => {
		const payload = {
			...validPayload,
			user: { tenantId: "tenant-1", userId: "user-1" },
		};
		expect(isidoroActivityInput.safeParse(payload).success).toBe(false);
	});

	it("rejects an unknown severity", () => {
		const payload = { ...validPayload, context: { severity: "panic" } };
		expect(isidoroActivityInput.safeParse(payload).success).toBe(false);
	});
});

describe("IsidoroActivitiesController", () => {
	it("rejects without opening a ticket when the key is wrong", async () => {
		const tickets = fakeGateway();
		const controller = new IsidoroActivitiesController(
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
		const controller = new IsidoroActivitiesController(
			new BridgeKeyVerifier(KEY),
			tickets,
		);
		const body: IsidoroActivityRequest = { problem: {} };
		await expect(
			controller.create(body, `Bearer ${KEY}`),
		).rejects.toMatchObject({ status: 400 });
		expect(tickets.openTicket).not.toHaveBeenCalled();
	});

	it("returns the ticket id, number and SLA from the gateway", async () => {
		const tickets = fakeGateway();
		const controller = new IsidoroActivitiesController(
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
		expect(tickets.openTicket).toHaveBeenCalledTimes(1);
		expect(tickets.openTicket.mock.calls[0]?.[0]).toMatchObject({
			idempotencyKey: "isidoro-update-123",
			user: { tenantId: "tenant-1" },
		});
	});
});

describe("SupportTicketService", () => {
	it("opens one technical support ticket with a number and the shared SLA", async () => {
		const store = new MemorySupportTicketStore();
		const input = isidoroActivityInput.parse(validPayload);

		const opened = await serviceWith(store).open(input);

		expect(opened.status).toBe("created");
		expect(opened.ticketId).toBe("ticket-1");
		expect(opened.ticketNumber).toBe(1);
		expect(opened.slaDueAt).toEqual(
			new Date(OPENED_AT.getTime() + SUPPORT.sla.durationMs),
		);
		expect(store.records).toHaveLength(1);
		expect(store.inserted[0]?.companyId).toBe("company-support");
		expect(store.inserted[0]?.createdById).toBe("user-catarina");
		expect(store.records[0]?.subject).toContain("[Suporte #1]");
		expect(store.records[0]?.subject).toContain("abastecimento");
		expect(store.records[0]?.body).toContain(opened.slaDueAt.toISOString());
		expect(store.records[0]?.body).toContain("isidoro-update-123");
		expect(store.records[0]?.subject.includes("TASK")).toBe(false);
	});

	it("returns the same ticket when the idempotency key is sent again", async () => {
		const store = new MemorySupportTicketStore();
		const tickets = serviceWith(store);
		const input = isidoroActivityInput.parse(validPayload);

		const first = await tickets.open(input);
		const second = await tickets.open(input);

		expect(second).toEqual({ ...first, status: "existing" });
		expect(store.records).toHaveLength(1);
		expect(store.inserted).toHaveLength(1);
	});

	it("opens a second ticket for a different idempotency key", async () => {
		const store = new MemorySupportTicketStore();
		const tickets = serviceWith(store);
		const input = isidoroActivityInput.parse(validPayload);

		await tickets.open(input);
		const other = await tickets.open({
			...input,
			idempotencyKey: "isidoro-update-456",
		});

		expect(other.ticketNumber).toBe(2);
		expect(other.status).toBe("created");
		expect(store.records).toHaveLength(2);
	});

	it("returns the winner when the insert loses the idempotency race", async () => {
		const winner: SupportTicketRecord = {
			id: "ticket-winner",
			number: 4,
			idempotencyKey: validPayload.idempotencyKey,
			subject: "[Suporte #4] já aberto",
			body: "SLA: 2026-11-06T15:00:00.000Z",
			slaDueAt: new Date(OPENED_AT.getTime() + SUPPORT.sla.durationMs),
		};
		let visible = false;
		const store: SupportTicketStore = {
			async findByIdempotencyKey() {
				return visible ? winner : null;
			},
			async insert() {
				visible = true;
				throw new DuplicateSupportTicket();
			},
			async saveCopy() {
				throw new Error("The loser must not rewrite the winning ticket.");
			},
		};

		const opened = await serviceWith(store).open(
			isidoroActivityInput.parse(validPayload),
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
			serviceWith(store, null).open(isidoroActivityInput.parse(validPayload)),
		).rejects.toThrow(ServiceUnavailableException);
		expect(store.records).toHaveLength(0);
	});
});
