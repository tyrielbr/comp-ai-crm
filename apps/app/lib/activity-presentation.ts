import ArrowRight from "@carbon/icons-react/es/ArrowRight";
import Chat from "@carbon/icons-react/es/Chat";
import Email from "@carbon/icons-react/es/Email";
import Events from "@carbon/icons-react/es/Events";
import MagicWand from "@carbon/icons-react/es/MagicWand";
import Phone from "@carbon/icons-react/es/Phone";
import Task from "@carbon/icons-react/es/Task";
import { tr } from "@crm/agro-i18n";
import type { ActivityType } from "@crm/db/enums";
import type { CarbonIcon } from "@crm/ui/components/icon";

type ActivityPresentation = Record<
	ActivityType,
	{ icon: CarbonIcon; label: string }
>;

const PRESENTATION: ActivityPresentation = {
	NOTE: { icon: Chat, label: tr("Note") },
	CALL: { icon: Phone, label: tr("Call") },
	EMAIL: { icon: Email, label: tr("Email") },
	MEETING: { icon: Events, label: tr("Meeting") },
	TASK: { icon: Task, label: tr("Task") },
	STAGE_CHANGE: { icon: ArrowRight, label: tr("Stage change") },
	ENRICHMENT: { icon: MagicWand, label: tr("Enrichment") },
};

export function activityLabel(type: ActivityType): string {
	return PRESENTATION[type].label;
}

export function activityIcon(type: ActivityType): CarbonIcon {
	return PRESENTATION[type].icon;
}
