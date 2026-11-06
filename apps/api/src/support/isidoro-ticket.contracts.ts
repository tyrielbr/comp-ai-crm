import { z } from "zod";

export const SUPPORT_SEVERITIES = [
	"low",
	"medium",
	"high",
	"critical",
] as const;

const userInput = z.object({
	tenantId: z.string().trim().min(1),
	userId: z.string().trim().min(1),
	name: z.string().trim().min(1).optional(),
	email: z.string().trim().email().optional(),
	role: z.string().trim().min(1),
});

export const isidoroTicketInput = z
	.object({
		idempotencyKey: z.string().trim().min(1).max(200),
		user: userInput,
		problem: z.object({
			description: z.string().trim().min(1).max(10_000),
		}),
		context: z
			.object({
				module: z.string().trim().min(1).max(100).optional(),
				conversationId: z.string().trim().min(1).max(200).optional(),
				severity: z.enum(SUPPORT_SEVERITIES).optional(),
			})
			.optional(),
	})
	.refine((input) => input.user.name || input.user.email, {
		message: "The user needs a name or an email.",
	});

export type IsidoroTicketInput = z.infer<typeof isidoroTicketInput>;

export type IsidoroTicketRequest = {
	idempotencyKey?: string;
	user?: {
		tenantId?: string;
		userId?: string;
		name?: string;
		email?: string;
		role?: string;
	};
	problem?: {
		description?: string;
	};
	context?: {
		module?: string;
		conversationId?: string;
		severity?: string;
	};
};

export type IsidoroTicketResult = {
	ticketId: string;
	ticketNumber: number;
	slaDueAt: string;
	status: "created" | "existing";
};

export type IsidoroTicketStatusResult = {
	ticketId: string;
	ticketNumber: number;
	status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
	slaDueAt: string;
	closedAt: string | null;
	assigneeId: string | null;
};
