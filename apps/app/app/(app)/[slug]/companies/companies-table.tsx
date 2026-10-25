"use client";

import Archive from "@carbon/icons-react/es/Archive";
import { tr } from "@crm/agro-i18n";
import { Button } from "@crm/ui/components/button";
import {
	DataTable,
	type DataTableColumn,
	type DataTableFacet,
} from "@crm/ui/components/data-table";
import { EmptyCellValue } from "@crm/ui/components/empty-cell";
import {
	EntityLogo,
	type EntityLogoTone,
} from "@crm/ui/components/entity-logo";
import { useTableSelection } from "@crm/ui/hooks/use-table-selection";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { EnrichmentIndicator } from "@/components/crm/enrichment-status";
import { useFieldColumns } from "@/components/crm/fields/field-columns";
import { useFieldFacets } from "@/components/crm/fields/field-facets";
import { OwnerCell } from "@/components/crm/owner-cell";
import { usePrefetchRecord } from "@/components/crm/record-sheet/record-prefetch";
import { useOpenRecord } from "@/components/crm/record-sheet/record-stack";
import { ListSearch } from "@/components/data-table/list-search";
import { SavedViewsMenu } from "@/components/data-table/saved-views-menu";
import { useTableQuery } from "@/components/data-table/use-table-query";
import { LocalRelativeTime } from "@/components/local-date-time";
import { ACTIVITY_FACET_OPTIONS } from "@/lib/activity-recency";
import { HIDDEN_WHEN_EMPTY } from "@/lib/agro-fields";
import {
	ENRICHMENT_FACET_OPTIONS,
	ENRICHMENT_POLL_MS,
	isEnriching,
} from "@/lib/enrichment-status";
import { useTRPC } from "@/lib/trpc/client";
import type { RouterOutputs } from "@/lib/trpc/types";
import { CompaniesBulkActions } from "./companies-bulk-actions";
import { companiesSearchParams } from "./companies-search-params";

type CompanyRow = RouterOutputs["companies"]["list"]["rows"][number];

const COLUMNS: DataTableColumn<CompanyRow>[] = [
	{
		id: "name",
		header: tr("Company"),
		sortable: true,
		hideable: false,
		width: "w-[26%]",
		cell: (row) => (
			<span className="flex min-w-0 items-center gap-2.5">
				<EntityLogo
					src={row.iconUrl ?? row.logoUrl}
					darkSrc={row.iconDarkUrl}
					tone={row.iconTone as EntityLogoTone | null | undefined}
					name={row.name}
					size="sm"
				/>
				<span className="truncate font-medium">{row.name}</span>
			</span>
		),
	},
	{
		id: "domain",
		header: tr("Domain"),
		sortable: true,
		width: "w-[16%]",
		hideBelow: "md",
		cell: (row) =>
			row.domain ? (
				<span className="truncate text-muted-foreground">{row.domain}</span>
			) : (
				<EmptyCellValue />
			),
	},
	{
		id: "industry",
		header: tr("Industry"),
		sortable: true,
		width: "w-[16%]",
		hideBelow: "lg",
		cell: (row) =>
			row.industry ? (
				<span className="truncate">{row.industry}</span>
			) : (
				<EmptyCellValue />
			),
	},
	{
		id: "owner",
		header: tr("Owner"),
		sortable: true,
		width: "w-[16%]",
		hideBelow: "md",
		cell: (row) => <OwnerCell owner={row.owner} />,
	},
	{
		id: "contacts",
		header: tr("Contacts"),
		sortable: true,
		align: "right",
		width: "w-[9%]",
		hideBelow: "lg",
		cell: (row) => <span className="tabular-nums">{row.contactCount}</span>,
	},
	{
		id: "deals",
		header: tr("Open deals"),
		sortable: true,
		align: "right",
		width: "w-[9%]",
		cell: (row) => <span className="tabular-nums">{row.openDealCount}</span>,
	},
	{
		id: "createdAt",
		header: tr("Created"),
		label: tr("Created date"),
		sortable: true,
		align: "right",
		width: "w-[10%]",
		defaultHidden: true,
		cell: (row) => (
			<span className="text-muted-foreground">
				<LocalRelativeTime date={row.createdAt} />
			</span>
		),
	},
	{
		id: "lastActivity",
		header: tr("Last activity"),
		sortable: true,
		align: "right",
		width: "w-[12%]",
		hideBelow: "sm",
		cell: (row) => (
			<span className="text-muted-foreground">
				{row.lastActivityAt ? (
					<LocalRelativeTime date={row.lastActivityAt} />
				) : (
					<EmptyCellValue />
				)}
			</span>
		),
	},
	{
		id: "enrichment",
		header: tr("Enrichment"),
		label: tr("Enrichment status"),
		defaultHidden: true,
		width: "w-[14%]",
		cell: (row) => (
			<EnrichmentIndicator status={row.enrichmentStatus} queued={row.queued} />
		),
	},
];

const ARCHIVED_COLUMN: DataTableColumn<CompanyRow> = {
	id: "archivedAt",
	header: tr("Archived"),
	label: tr("Archived date"),
	sortable: true,
	align: "right",
	width: "w-[12%]",
	cell: (row) => (
		<span className="text-muted-foreground">
			{row.archivedAt ? (
				<LocalRelativeTime date={row.archivedAt} />
			) : (
				<EmptyCellValue />
			)}
		</span>
	),
};

// Agro: sem coluna Domínio na lista (ver lib/agro-fields.ts).
const AGRO_COLUMNS = COLUMNS.filter(
	(column) =>
		!(HIDDEN_WHEN_EMPTY.COMPANY as readonly string[]).includes(column.id),
);

export function CompaniesTable() {
	const openRecord = useOpenRecord();
	const trpc = useTRPC();
	const prefetchRecord = usePrefetchRecord();
	const table = useTableQuery(companiesSearchParams);
	const { query, input, setArchived } = table;

	const companies = useQuery({
		...trpc.companies.list.queryOptions(input),
		placeholderData: (previous) => previous,
		refetchInterval: (query) =>
			query.state.data?.rows.some((row) =>
				isEnriching(row.enrichmentStatus, row.queued),
			)
				? ENRICHMENT_POLL_MS
				: false,
	});
	const users = useQuery(trpc.users.list.queryOptions());

	const rows = companies.data?.rows ?? [];
	const selection = useTableSelection(
		useMemo(() => rows.map((row) => row.id), [rows]),
	);

	const facetCounts = companies.data?.facetCounts;
	const fieldFacets = useFieldFacets("COMPANY", facetCounts);

	const facets: DataTableFacet[] = [
		{
			id: "owner",
			label: tr("Owner"),
			options: [
				{ value: "unassigned", label: tr("Unassigned") },
				...(users.data ?? []).map((user) => ({
					value: user.id,
					label: user.name,
				})),
			].filter((option) => (facetCounts?.owner?.[option.value] ?? 0) > 0),
		},
		{
			id: "industry",
			label: tr("Industry"),
			options: Object.keys(facetCounts?.industry ?? {})
				.sort()
				.map((value) => ({ value, label: value })),
		},
		{
			id: "enrichment",
			label: tr("Enrichment"),
			options: ENRICHMENT_FACET_OPTIONS.filter(
				(option) => (facetCounts?.enrichment?.[option.value] ?? 0) > 0,
			),
		},
		{
			id: "activity",
			label: tr("Activity"),
			options: ACTIVITY_FACET_OPTIONS.filter(
				(option) => (facetCounts?.activity?.[option.value] ?? 0) > 0,
			),
		},
		...fieldFacets,
	];

	const fieldColumns = useFieldColumns<CompanyRow>("COMPANY");
	const columns = useMemo(
		() =>
			input.archived
				? [...AGRO_COLUMNS, ARCHIVED_COLUMN, ...fieldColumns]
				: [...AGRO_COLUMNS, ...fieldColumns],
		[fieldColumns, input.archived],
	);

	return (
		<DataTable
			query={query}
			search={
				<ListSearch placeholder={tr("Search companies by name or domain…")} />
			}
			actions={
				<>
					<SavedViewsMenu entity="COMPANY" table={table} />
					<Button
						variant={input.archived ? "contrast" : "outline"}
						size="sm"
						className="justify-start sm:justify-center"
						onClick={() => setArchived(!input.archived)}
					>
						<Archive data-icon="inline-start" />
						{tr("Archived")}
					</Button>
				</>
			}
			columns={columns}
			rows={rows}
			total={companies.data?.total ?? 0}
			facetCounts={facetCounts}
			facets={facets}
			selection={{
				state: selection,
				actions: (
					<CompaniesBulkActions
						ids={selection.ids}
						onDone={selection.clear}
						archived={input.archived}
					/>
				),
				rowLabel: (row) => row.name,
			}}
			getRowId={(row) => row.id}
			loading={companies.isFetching}
			onRowHover={(row) => prefetchRecord({ kind: "company", id: row.id })}
			onRowClick={(row) => openRecord({ kind: "company", id: row.id })}
			empty={
				input.archived
					? tr("No archived companies.")
					: tr("No companies match this view.")
			}
		/>
	);
}
