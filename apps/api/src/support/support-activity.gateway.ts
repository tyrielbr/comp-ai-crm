import type { IsidoroActivityInput } from "./isidoro-activity.contracts";

export const SUPPORT_ACTIVITY_GATEWAY = Symbol("SUPPORT_ACTIVITY_GATEWAY");

/** Port: anything that can turn an Isidoro request into a CRM support activity. */
export interface SupportActivityGateway {
	createSupportActivity(
		input: IsidoroActivityInput,
	): Promise<{ activityId: string }>;
}
