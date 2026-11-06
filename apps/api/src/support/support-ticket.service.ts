import { tr } from "@crm/agro-i18n";
import type { SupportTicketSeverity } from "@crm/db";
import {
	ForbiddenException,
	Logger,
	NotFoundException,
	ServiceUnavailableException,
} from "@nestjs/common";
import type { IsidoroTicketInput } from "./isidoro-ticket.contracts";
import { SUPPORT, SUPPORT_OPENER_ROLES } from "./support-config";
import {
	DuplicateSupportTicket,
	type SupportTicketRecord,
	type SupportTicketStore,
} from "./support-ticket.store";

export type OpenedSupportTicket = {
	ticketId: string;
	ticketNumber: number;
	slaDueAt: Date;
	status: "created" | "existing";
};

export type SupportTicketStatusView = {
	ticketId: string;
	ticketNumber: number;
	status: SupportTicketRecord["status"];
	slaDueAt: Date;
	closedAt: Date | null;
	assigneeId: string | null;
};

export type SupportTicketTarget = {
	companyId: string | undefined;
	actingUserId: string | undefined;
};

const SEVERITY = {
	low: "LOW",
	medium: "MEDIUM",
	high: "HIGH",
	critical: "CRITICAL",
} as const satisfies Record<
	"low" | "medium" | "high" | "critical",
	SupportTicketSeverity
>;

export class SupportTicketService {
	private readonly logger = new Logger(SupportTicketService.name);

	constructor(
		private readonly store: SupportTicketStore,
		private readonly target: SupportTicketTarget,
		private readonly clock: {
			now: () => Date;
			slaDurationMs: number;
		},
	) {}

	async open(input: IsidoroTicketInput): Promise<OpenedSupportTicket> {
		const createdById = this.target.actingUserId?.trim();
		if (!createdById) {
			this.logger.error({
				message: "CATARINA_BRIDGE_USER_ID is not set — refusing Isidoro calls.",
			});
			throw new ServiceUnavailableException(
				tr("The support bridge is not configured."),
			);
		}
		if (!isOpenerRole(input.user.role)) {
			throw new ForbiddenException(
				tr("That role cannot open a support ticket."),
			);
		}

		const existing = await this.store.findByIdempotency(
			input.user.tenantId,
			input.idempotencyKey,
		);
		if (existing) return opened(existing, "existing");

		const slaDueAt = new Date(
			this.clock.now().getTime() + this.clock.slaDurationMs,
		);
		const severity = input.context?.severity
			? SEVERITY[input.context.severity]
			: null;

		try {
			const created = await this.store.create(
				{
					idempotencyKey: input.idempotencyKey,
					tenantId: input.user.tenantId,
					slaDueAt,
					isidoroUserId: input.user.userId,
					requesterName: input.user.name ?? null,
					requesterEmail: input.user.email ?? null,
					module: input.context?.module ?? null,
					conversationId: input.context?.conversationId ?? null,
					severity,
					companyId: blankToNull(this.target.companyId),
					createdById,
				},
				(number) => ({
					subject: buildSubject(number, input),
					body: buildBody(number, slaDueAt, input),
				}),
			);
			this.logger.log({
				message: "Support ticket opened",
				ticketId: created.id,
				ticketNumber: created.number,
				tenantId: input.user.tenantId,
			});
			return opened(created, "created");
		} catch (error) {
			if (!(error instanceof DuplicateSupportTicket)) throw error;
			const winner = await this.store.findByIdempotency(
				input.user.tenantId,
				input.idempotencyKey,
			);
			if (!winner) throw error;
			return opened(winner, "existing");
		}
	}

	async read(
		tenantId: string,
		ticketNumber: number,
	): Promise<SupportTicketStatusView> {
		const ticket = await this.store.findByNumber(tenantId, ticketNumber);
		if (!ticket) throw new NotFoundException();
		return {
			ticketId: ticket.id,
			ticketNumber: ticket.number,
			status: ticket.status,
			slaDueAt: ticket.slaDueAt,
			closedAt: ticket.closedAt,
			assigneeId: ticket.assigneeId,
		};
	}
}

function isOpenerRole(role: string): boolean {
	return (SUPPORT_OPENER_ROLES as readonly string[]).includes(role);
}

function opened(
	ticket: SupportTicketRecord,
	status: OpenedSupportTicket["status"],
): OpenedSupportTicket {
	return {
		ticketId: ticket.id,
		ticketNumber: ticket.number,
		slaDueAt: ticket.slaDueAt,
		status,
	};
}

function blankToNull(value: string | undefined): string | null {
	const trimmed = value?.trim();
	return trimmed ? trimmed : null;
}

function buildSubject(number: number, input: IsidoroTicketInput): string {
	const area = input.context?.module ? ` ${input.context.module}:` : "";
	const subject = `[Suporte #${number}]${area} ${input.problem.description}`;
	return subject.length > SUPPORT.subject.maxLength
		? `${subject.slice(0, SUPPORT.subject.maxLength - 1)}…`
		: subject;
}

function buildBody(
	number: number,
	slaDueAt: Date,
	input: IsidoroTicketInput,
): string {
	const { user, context } = input;
	const lines = [
		input.problem.description,
		"",
		`Chamado: #${number}`,
		`SLA: ${slaDueAt.toISOString()}`,
		`Tenant: ${user.tenantId}`,
		`Usuário: ${user.userId}${user.name ? ` (${user.name})` : ""}`,
		user.email ? `E-mail: ${user.email}` : undefined,
		`Perfil: ${user.role}`,
		context?.module ? `Módulo: ${context.module}` : undefined,
		context?.severity ? `Severidade: ${context.severity}` : undefined,
		context?.conversationId ? `Conversa: ${context.conversationId}` : undefined,
		`Idempotency key: ${input.idempotencyKey}`,
	];
	return lines.filter((line) => line !== undefined).join("\n");
}
