import { tr } from "@crm/agro-i18n";

export const CLOSING_OPTIONS = [
	{ value: "overdue", label: tr("Overdue") },
	{ value: "this-month", label: tr("Closing this month") },
	{ value: "next-month", label: tr("Closing next month") },
	{ value: "later", label: tr("Later") },
	{ value: "none", label: tr("No close date") },
] as const;
