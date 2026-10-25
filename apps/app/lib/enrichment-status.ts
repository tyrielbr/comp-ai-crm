import { tr } from "@crm/agro-i18n";
import type { EnrichmentStatus } from "@crm/db/enums";
import type { StatusTone } from "@crm/ui/components/status-indicator";

type EnrichmentPresentation = Record<
	EnrichmentStatus,
	{ label: string; tone: StatusTone; busy?: boolean }
>;

const PRESENTATION: EnrichmentPresentation = {
	PENDING: { label: tr("Not researched"), tone: "neutral" },
	RUNNING: { label: tr("Researching"), tone: "info", busy: true },
	COMPLETE: { label: tr("Enriched"), tone: "success" },
	FAILED: { label: tr("Enrichment failed"), tone: "error" },
	SKIPPED: { label: tr("Nothing found"), tone: "neutral" },
};

const QUEUED = {
	label: tr("Queued"),
	tone: "neutral" as StatusTone,
	busy: false,
};

export const ENRICHMENT_POLL_MS = 3_000;

export const ENRICHMENT_IDLE_POLL_MS = 30_000;

export const ENRICHMENT_FACET_OPTIONS = (
	Object.keys(PRESENTATION) as EnrichmentStatus[]
).map((value) => ({ value, label: tr(PRESENTATION[value].label) }));

export function enrichmentPresentation(
	status: EnrichmentStatus,
	queued: boolean,
) {
	const presentation =
		status === "PENDING" && queued ? QUEUED : PRESENTATION[status];
	return { ...presentation, label: tr(presentation.label) };
}

export function isEnriching(status: EnrichmentStatus, queued = false): boolean {
	return status === "RUNNING" || (status === "PENDING" && queued);
}
