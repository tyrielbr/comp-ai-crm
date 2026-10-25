import { tr } from "@crm/agro-i18n";
import type { Metadata } from "next";
import { Suspense } from "react";
import {
	PageShell,
	PageShellContent,
	PageShellDescription,
	PageShellHeader,
	PageShellHeading,
	PageShellLoading,
	PageShellTitle,
} from "@/components/page-shell";
import { workspaceUrl } from "@/lib/workspace-url";
import { ImportWizard } from "./import-wizard";

export const metadata: Metadata = {
	title: tr("Import Companies"),
};

export default function ImportCompaniesPage({
	params,
}: PageProps<"/[slug]/companies/import">) {
	return (
		<PageShell>
			<PageShellHeader>
				<PageShellHeading>
					<PageShellTitle>{tr("Import companies")}</PageShellTitle>
					<PageShellDescription>
						{tr("Upload a CSV file and match its columns to company fields.")}
					</PageShellDescription>
				</PageShellHeading>
			</PageShellHeader>
			<PageShellContent>
				<Suspense fallback={<PageShellLoading />}>
					<ImportWizardForWorkspace params={params} />
				</Suspense>
			</PageShellContent>
		</PageShell>
	);
}

async function ImportWizardForWorkspace({
	params,
}: Pick<PageProps<"/[slug]/companies/import">, "params">) {
	const { slug } = await params;
	return <ImportWizard companiesUrl={workspaceUrl(slug, "/companies")} />;
}
