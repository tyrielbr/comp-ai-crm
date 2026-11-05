import { tr } from "@crm/agro-i18n";
import { ActivityType } from "@crm/db";
import { Logger, ServiceUnavailableException } from "@nestjs/common";
import type { ActivitiesService } from "../activities/activities.service";
import type { IsidoroActivityInput } from "./isidoro-activity.contracts";
import type { SupportActivityGateway } from "./support-activity.gateway";

export const CRM_SUPPORT_TARGET = Symbol("CRM_SUPPORT_TARGET");

export type CrmSupportTarget = {
	/** CRM Company the support tasks hang on (CATARINA_SUPPORT_COMPANY_ID). */
	companyId: string | undefined;
	/** CRM User recorded as the task author (CATARINA_BRIDGE_USER_ID). */
	actingUserId: string | undefined;
};

type ActivityCreator = Pick<ActivitiesService, "create">;

const SUBJECT_MAX = 120;

/** Adapter: creates the support activity through the CRM's ActivitiesService. */
export class CrmSupportActivityGateway implements SupportActivityGateway {
	private readonly logger = new Logger(CrmSupportActivityGateway.name);

	constructor(
		private readonly activities: ActivityCreator,
		private readonly target: CrmSupportTarget,
	) {}

	async createSupportActivity(
		input: IsidoroActivityInput,
	): Promise<{ activityId: string }> {
		const { companyId, actingUserId } = this.target;
		if (!companyId || !actingUserId) {
			this.logger.error({
				message: "Catarina bridge CRM target is not configured.",
			});
			throw new ServiceUnavailableException(
				tr("The support bridge is not configured."),
			);
		}

		// TODO(catarina): dedupe by input.idempotencyKey before creating
		// (storage still to be decided; see README open questions).
		// TODO(catarina): map input.user to a CRM Contact (contactId) instead
		// of hanging every task on one support company.
		// TODO(catarina): retry/backoff policy on transient database errors.
		const activity = await this.activities.create(
			{
				type: ActivityType.TASK,
				subject: buildSubject(input),
				body: buildBody(input),
				companyId,
			},
			actingUserId,
		);

		this.logger.log({
			message: "Isidoro support activity created",
			activityId: activity.id,
			tenantId: input.user.tenantId,
		});

		return { activityId: activity.id };
	}
}

function buildSubject(input: IsidoroActivityInput): string {
	const module = input.context?.module ? ` ${input.context.module}:` : "";
	const subject = `[Isidoro]${module} ${input.problem.description}`;
	return subject.length > SUBJECT_MAX
		? `${subject.slice(0, SUBJECT_MAX - 1)}…`
		: subject;
}

function buildBody(input: IsidoroActivityInput): string {
	const { user, context } = input;
	const lines = [
		input.problem.description,
		"",
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
