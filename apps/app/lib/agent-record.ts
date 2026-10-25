export type AgentRecordKind = "contact" | "company" | "deal";

import { tr } from "@crm/agro-i18n";

export type AgentRecord = { kind: AgentRecordKind; id: string };

type RecordCopy = {
	header: string;
	field: "contactId" | "companyId" | "dealId";
	title: string;
	blurb: string;
	placeholder: string;
	suggestions: string[];
};

type RecordCopyByKind = Record<AgentRecordKind, RecordCopy>;

export type AgentRecordHeader = Record<string, string>;

export type AgentRecordFilter = {
	contactId?: string;
	companyId?: string;
	dealId?: string;
};

const COPY: RecordCopyByKind = {
	contact: {
		header: "x-crm-contact",
		field: "contactId",
		title: tr("Ask about this person"),
		blurb: tr(
			"Every step is shown as it happens — including the leads it throws away.",
		),
		placeholder: tr("Are they still there?"),
		suggestions: [
			tr("Who is this person?"),
			tr("Are they still there?"),
			tr("What should I know before a call?"),
		],
	},
	company: {
		header: "x-crm-company",
		field: "companyId",
		title: tr("Ask about this company"),
		blurb: tr(
			"It reads their site and our own history with them, and shows its working.",
		),
		placeholder: tr("What do they sell?"),
		suggestions: [
			tr("What do they do?"),
			tr("Who do we know here?"),
			tr("What has changed recently?"),
		],
	},
	deal: {
		header: "x-crm-deal",
		field: "dealId",
		title: tr("Ask about this deal"),
		blurb: tr(
			"It can read the thread, the meetings and the people on both sides of it.",
		),
		placeholder: tr("Where has this stalled?"),
		suggestions: [
			tr("Where does this stand?"),
			tr("Who else should be involved?"),
			tr("What is the risk here?"),
		],
	},
};

export function recordCopy(kind: AgentRecordKind): RecordCopy {
	return COPY[kind];
}

export function recordHeader(record: AgentRecord): AgentRecordHeader {
	return { [COPY[record.kind].header]: record.id };
}

export function recordFilter(record: AgentRecord): AgentRecordFilter {
	return { [COPY[record.kind].field]: record.id };
}
