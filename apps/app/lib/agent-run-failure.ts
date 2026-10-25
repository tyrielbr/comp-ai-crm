import { tr } from "@crm/agro-i18n";

type RunFailureReasons = Record<string, string>;

const REASONS: RunFailureReasons = {
	ACTION_NOT_PERFORMED: tr(
		"The agent finished without doing what it was built to do. Open the run to see which step it skipped.",
	),
	NO_EXECUTOR: tr(
		"This agent asks for something the CRM cannot do yet. It needs rebuilding.",
	),
	DEPENDENCY_UNAVAILABLE: tr(
		"A connection this agent needs is missing. Reconnect it, then run again.",
	),
	NOT_AUTHORISED: tr(
		"The connection refused this. Its access may have been revoked or narrowed.",
	),
	PROVIDER_ERROR: tr(
		"The outside service rejected this. It is usually worth trying again.",
	),
	NEVER_SETTLED: tr(
		"The agent stopped without reporting a result. Nothing was left half-done.",
	),
	TURN_FAILED: tr("The model failed part-way through this run."),
	DELIVERY_FAILED: tr("The run never reached the agent."),
	DELIVERY_EXHAUSTED: tr(
		"This never reached the agent after three attempts. Nothing ran.",
	),
	ACTION_REJECTED: tr(
		"The agent tried the action and the CRM refused it. Nothing was written.",
	),
	AGENT_UNAVAILABLE: tr(
		"The agent was paused or archived when this run started.",
	),
	AGENT_DELETED: tr("The agent was deleted before this run finished."),
	CANCELLED_BY_USER: tr("Someone stopped this run."),
	RUN_TIMED_OUT: tr(
		"This run took too long and was stopped so later runs could start.",
	),
};

export function runFailureReason(
	code: string | null | undefined,
	message: string | null | undefined,
): string {
	const known = code ? REASONS[code] : undefined;
	if (known) return known;
	if (message?.trim()) return message.trim();
	return tr("This run failed without saying why.");
}
