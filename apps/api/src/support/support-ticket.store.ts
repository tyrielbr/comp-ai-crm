import { type Db, Prisma } from "@crm/db";
import { Injectable } from "@nestjs/common";
import { InjectDatabase } from "../database/database.constants";

export class DuplicateSupportTicket extends Error {
	constructor() {
		super("A support ticket already uses this idempotency key.");
		this.name = "DuplicateSupportTicket";
	}
}

export type SupportTicketRecord = {
	id: string;
	number: number;
	idempotencyKey: string;
	subject: string;
	body: string;
	slaDueAt: Date;
};

export type NewSupportTicket = {
	idempotencyKey: string;
	subject: string;
	body: string;
	slaDueAt: Date;
	tenantId: string;
	isidoroUserId: string;
	requesterName: string | null;
	requesterEmail: string | null;
	module: string | null;
	conversationId: string | null;
	severity: string | null;
	companyId: string | null;
	createdById: string;
};

export interface SupportTicketStore {
	findByIdempotencyKey(key: string): Promise<SupportTicketRecord | null>;
	insert(ticket: NewSupportTicket): Promise<SupportTicketRecord>;
	saveCopy(id: string, subject: string, body: string): Promise<void>;
}

const TICKET_SELECT = {
	id: true,
	number: true,
	idempotencyKey: true,
	subject: true,
	body: true,
	slaDueAt: true,
} as const;

@Injectable()
export class PrismaSupportTicketStore implements SupportTicketStore {
	constructor(@InjectDatabase() private readonly db: Db) {}

	findByIdempotencyKey(key: string): Promise<SupportTicketRecord | null> {
		return this.db.supportTicket.findUnique({
			where: { idempotencyKey: key },
			select: TICKET_SELECT,
		});
	}

	async insert(ticket: NewSupportTicket): Promise<SupportTicketRecord> {
		try {
			return await this.db.supportTicket.create({
				data: ticket,
				select: TICKET_SELECT,
			});
		} catch (error) {
			if (
				error instanceof Prisma.PrismaClientKnownRequestError &&
				error.code === "P2002"
			) {
				const target = error.meta?.target;
				const idempotencyConflict =
					target === "idempotencyKey" ||
					(Array.isArray(target) && target.includes("idempotencyKey"));
				if (idempotencyConflict) throw new DuplicateSupportTicket();
			}
			throw error;
		}
	}

	async saveCopy(id: string, subject: string, body: string): Promise<void> {
		await this.db.supportTicket.update({
			where: { id },
			data: { subject, body },
		});
	}
}
