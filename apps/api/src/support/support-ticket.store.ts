import { type Db, Prisma, type SupportTicketSeverity } from "@crm/db";
import { Injectable } from "@nestjs/common";
import { z } from "zod";
import { InjectDatabase } from "../database/database.constants";

export class DuplicateSupportTicket extends Error {
	constructor() {
		super("A support ticket already uses this idempotency key for the tenant.");
		this.name = "DuplicateSupportTicket";
	}
}

export type SupportTicketRecord = {
	id: string;
	number: number;
	tenantId: string;
	idempotencyKey: string;
	subject: string;
	body: string;
	slaDueAt: Date;
	status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
	closedAt: Date | null;
	assigneeId: string | null;
};

export type NewSupportTicket = {
	idempotencyKey: string;
	tenantId: string;
	slaDueAt: Date;
	isidoroUserId: string;
	requesterName: string | null;
	requesterEmail: string | null;
	module: string | null;
	conversationId: string | null;
	severity: SupportTicketSeverity | null;
	companyId: string | null;
	createdById: string;
};

export interface SupportTicketStore {
	findByIdempotency(
		tenantId: string,
		idempotencyKey: string,
	): Promise<SupportTicketRecord | null>;
	findByNumber(
		tenantId: string,
		ticketNumber: number,
	): Promise<SupportTicketRecord | null>;
	create(
		ticket: NewSupportTicket,
		name: (number: number) => { subject: string; body: string },
	): Promise<SupportTicketRecord>;
}

const TICKET_SELECT = {
	id: true,
	number: true,
	tenantId: true,
	idempotencyKey: true,
	subject: true,
	body: true,
	slaDueAt: true,
	status: true,
	closedAt: true,
	assigneeId: true,
} as const;

@Injectable()
export class PrismaSupportTicketStore implements SupportTicketStore {
	constructor(@InjectDatabase() private readonly db: Db) {}

	findByIdempotency(
		tenantId: string,
		idempotencyKey: string,
	): Promise<SupportTicketRecord | null> {
		return this.db.supportTicket.findUnique({
			where: { tenantId_idempotencyKey: { tenantId, idempotencyKey } },
			select: TICKET_SELECT,
		});
	}

	findByNumber(
		tenantId: string,
		ticketNumber: number,
	): Promise<SupportTicketRecord | null> {
		return this.db.supportTicket.findFirst({
			where: { tenantId, number: ticketNumber },
			select: TICKET_SELECT,
		});
	}

	async create(
		ticket: NewSupportTicket,
		name: (number: number) => { subject: string; body: string },
	): Promise<SupportTicketRecord> {
		try {
			return await this.db.$transaction(async (tx) => {
				const created = await tx.supportTicket.create({
					data: {
						...ticket,
						subject: "pending",
						body: "pending",
					},
					select: { id: true, number: true },
				});
				const named = name(created.number);
				return tx.supportTicket.update({
					where: { id: created.id },
					data: named,
					select: TICKET_SELECT,
				});
			});
		} catch (error) {
			if (
				error instanceof Prisma.PrismaClientKnownRequestError &&
				error.code === "P2002"
			) {
				const parsed = z
					.union([z.string(), z.array(z.string())])
					.safeParse(error.meta?.target);
				if (parsed.success) {
					const label = Array.isArray(parsed.data)
						? parsed.data.join(" ")
						: parsed.data;
					if (label.includes("idempotencyKey")) {
						throw new DuplicateSupportTicket();
					}
				}
			}
			throw error;
		}
	}
}
