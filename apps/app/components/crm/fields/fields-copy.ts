import { tr } from "@crm/agro-i18n";
import type { RecordKind } from "@/components/crm/record-sheet/record-stack";
import type { FieldEntity } from "./fields-entity";

export const SHEET_TITLE = tr("Fields");

const SUBTITLE = {
	company: tr("This shapes every company in your CRM."),
	contact: tr("This shapes every contact in your CRM."),
	deal: tr("This shapes every deal in your CRM."),
} satisfies Record<RecordKind, string>;

export function subtitleFor(kind: RecordKind): string {
	return SUBTITLE[kind];
}

export const STANDARD_ROW = tr("Standard fields");
export const STANDARD_NOTE = tr("reorder and hide only");
export const SUGGESTED_ROW = tr("Suggested fields");
export const SUGGESTED_NOTE = tr("one click to add");
export const ADD = tr("Add");
export const CUSTOM_GROUP = tr("Custom fields");
export const DRAG_NOTE = tr("Drag to order");
export const ARCHIVED_ROW = tr("Archived");
export const ARCHIVED_NOTE = tr("values kept, hidden everywhere");
export const NEW_FIELD = tr("New field");
export const ORDER_NOTE = tr("Order here is the order on the sheet");
export const MANUAL_ONLY = tr("Manual only");
export const TABLE_NOTE = tr("also a column on the table");
export const FILTER_NOTE = tr("also a filter");

export const EMPTY_TITLE = tr("No custom fields yet");
export const EMPTY_BODY = tr(
	"Create dynamic fields that your agents can research and pre-fill.",
);

export const ERROR_TITLE = tr("We could not load your fields");
export const ERROR_BODY = tr(
	"Your fields are still there. Try again in a moment, before you create anything new.",
);
export const RETRY = tr("Try again");

export const LABEL_LABEL = tr("Label");
export const KEY_LABEL = tr("Key");
export const KEY_HELP = tr(
	"What the API and your agents call it. Set from the label, fixed once saved — renaming the label later never breaks a caller.",
);
export const AGENT_LABEL = tr("Let your agents fill this");
export const AGENT_HELP = tr(
	"They propose a value with a source, and never overwrite yours.",
);
export const BRIEF_LABEL = tr("What counts as an answer");
export const BRIEF_HELP = tr(
	"Leave it empty and your agents work from the label and type alone.",
);
export const TYPE_LABEL = tr("Type");
export const OPTIONS_LABEL = tr("Options");
export const ADD_OPTION = tr("Add option");
export const ALL_FILLED = tr("Nothing left to fill");

export function optionLabel(index: number): string {
	return tr("Option {n}", { n: index + 1 });
}
export const ADD_FIELD = tr("Create field");
export const CANCEL = tr("Cancel");
export const SAVE = tr("Save changes");
export const ARCHIVE = tr("Archive");
export const FILL_REST = tr("Fill the rest");

const SHEET_PLACEMENT = {
	COMPANY: tr("Show on the company sheet"),
	CONTACT: tr("Show on the contact sheet"),
	DEAL: tr("Show on the deal sheet"),
} satisfies Record<FieldEntity, string>;

const TABLE_PLACEMENT = {
	COMPANY: tr("Offer as a column on the Companies table"),
	CONTACT: tr("Offer as a column on the Contacts table"),
	DEAL: tr("Offer as a column on the Deals table"),
} satisfies Record<FieldEntity, string>;

const FILTER_PLACEMENT = {
	COMPANY: tr("Offer as a filter on the Companies table"),
	CONTACT: tr("Offer as a filter on the Contacts table"),
	DEAL: tr("Offer as a filter on the Deals table"),
} satisfies Record<FieldEntity, string>;

export function sheetPlacement(entity: FieldEntity): string {
	return SHEET_PLACEMENT[entity];
}

export function tablePlacement(entity: FieldEntity): string {
	return TABLE_PLACEMENT[entity];
}

export function filterPlacement(entity: FieldEntity): string {
	return FILTER_PLACEMENT[entity];
}

export const ENTITY_TABS = [
	{ kind: "company", label: tr("Companies") },
	{ kind: "contact", label: tr("Contacts") },
	{ kind: "deal", label: tr("Deals") },
] as const satisfies readonly { kind: RecordKind; label: string }[];
