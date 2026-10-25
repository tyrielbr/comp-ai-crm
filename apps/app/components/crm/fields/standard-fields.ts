import { tr } from "@crm/agro-i18n";
import type { FieldEntity } from "./fields-entity";

export const STANDARD_FIELDS = {
	COMPANY: [
		"Name",
		"Domain",
		"Website",
		"Phone",
		"Email",
		"City",
		"Country",
		"Owner",
	],
	CONTACT: [
		tr("First name"),
		tr("Last name"),
		"Title",
		"Email",
		"Phone",
		"LinkedIn",
		"GitHub",
		"Company",
		"Owner",
	],
	DEAL: [
		"Name",
		"Amount",
		"Currency",
		tr("Close date"),
		"Company",
		"Owner",
		"Stage",
	],
} satisfies Record<FieldEntity, readonly string[]>;
