import { tr } from "@crm/agro-i18n";
import { Logger, ServiceUnavailableException } from "@nestjs/common";
import type { IsidoroActivityInput } from "./isidoro-activity.contracts";
import { SUPPORT } from "./support-config";
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

export type SupportTicketTarget = {
	companyId: string | undefined;
	actingUserId: string | undefined;
};

export class SupportTicketService {
	private readonly logger = new Logger(SupportTicketService.name);

	constructor(
		private readonly store: SupportTicketStore,
		private readonly target: SupportTicketTarget,
		private readonly now: () => Date = () => new Date(),
	) {}

	async open(input: IsidoroActivityInput): Promise<OpenedSupportTicket> {
		const createdById = this.target.actingUserId?.trim();
		if (!createdById) {
			this.logger.error({
				message: "CATARINA_BRIDGE_USER_ID is not set — refusing Isidoro calls.",
			});
			throw new ServiceUnavailableException(
				tr("The support bridge is not configured."),
			);
		}

		const existing = await this.store.findByIdempotencyKey(
			input.idempotencyKey,
		);
		if (existing) return opened(existing, "existing");

		const slaDueAt = new Date(this.now().getTime() + SUPPORT.sla.durationMs);
		const companyId = blankToNull(this.target.companyId);

		try {
			const created = await this.store.insert({
				idempotencyKey: input.idempotencyKey,
				subject: buildSubject(null, input),
				body: buildBody(null, slaDueAt, input),
				slaDueAt,
				tenantId: input.user.tenantId,
				isidoroUserId: input.user.userId,
				requesterName: input.user.name ?? null,
				requesterEmail: input.user.email ?? null,
				module: input.context?.module ?? null,
				conversationId: input.context?.conversationId ?? null,
				severity: input.context?.severity ?? null,
				companyId,
				createdById,
			});
			const subject = buildSubject(created.number, input);
			const body = buildBody(created.number, slaDueAt, input);
			await this.store.saveCopy(created.id, subject, body);
			this.logger.log({
				message: "Support ticket opened",
				ticketId: created.id,
				ticketNumber: created.number,
				tenantId: input.user.tenantId,
			});
			return opened({ ...created, subject, body }, "created");
		} catch (error) {
			if (!(error instanceof DuplicateSupportTicket)) throw error;
			const winner = await this.store.findByIdempotencyKey(
				input.idempotencyKey,
			);
			if (!winner) throw error;
			return opened(winner, "existing");
		}
	}
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

function buildSubject(
	number: number | null,
	input: IsidoroActivityInput,
): string {
	const label = number === null ? "[Suporte]" : `[Suporte #${number}]`;
	const area = input.context?.module ? ` ${input.context.module}:` : "";
	const subject = `${label}${area} ${input.problem.description}`;
	return subject.length > SUPPORT.subject.maxLength
		? `${subject.slice(0, SUPPORT.subject.maxLength - 1)}…`
		: subject;
}

function buildBody(
	number: number | null,
	slaDueAt: Date,
	input: IsidoroActivityInput,
): string {
	const { user, context } = input;
	const lines = [
		input.problem.description,
		"",
		number === null ? undefined : `Chamado: #${number}`,
		`SLA: ${slaDueAt.toISOString()}`,
		`Tenant: ${user.tenantId}`,
		`Usuário: ${user.userId}${user.name ? ` (${user.name})` : ""}`,
		user.email ? `E-mail: ${user.email}` : undefined,
		context?.module ? `Módulo: ${context.module}` : undefined,
		context?.severity ? `Severidade: ${context.severity}` : undefined,
		context?.conversationId ? `Conversa: ${context.conversationId}` : undefined,
		`Idempotency key: ${input.idempotencyKey}`,
	];
	return lines.filter((line) => line !== undefined).join("\n");
}
