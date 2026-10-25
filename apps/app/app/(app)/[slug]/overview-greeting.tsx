"use client";

import { tr } from "@crm/agro-i18n";
import { useQueryState } from "nuqs";
import { PageShellDescription, PageShellTitle } from "@/components/page-shell";
import { SEARCH_PARAM } from "@/lib/search-param-keys";
import { overviewParsers } from "./overview-search-params";

export function OverviewGreetingFallback() {
	return (
		<>
			<PageShellTitle>{tr("Welcome back")}</PageShellTitle>
			<PageShellDescription>
				{tr(
					"What you have closed, what is still in play, and what needs you today.",
				)}
			</PageShellDescription>
		</>
	);
}

export function OverviewGreeting() {
	const [scope] = useQueryState(
		SEARCH_PARAM.overview.scope,
		overviewParsers[SEARCH_PARAM.overview.scope],
	);

	return (
		<>
			<PageShellTitle>{tr("Welcome back")}</PageShellTitle>
			<PageShellDescription>
				{scope === "me"
					? tr(
							"What you have closed, what is still in play, and what needs you today.",
						)
					: tr(
							"What the team has closed, what is still in play, and what needs you today.",
						)}
			</PageShellDescription>
		</>
	);
}
