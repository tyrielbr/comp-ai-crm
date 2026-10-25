import { tr } from "@crm/agro-i18n";
import type { Metadata } from "next";
import { MicrosoftConnection } from "../microsoft-connection";
import {
	type ConnectionQuery,
	OAuthConnectionPage,
} from "../oauth-connection-page";

export const metadata: Metadata = { title: tr("Microsoft 365") };

export default function MicrosoftConnectionPage(props: {
	params: Promise<{ slug: string }>;
	searchParams: Promise<ConnectionQuery>;
}) {
	return (
		<OAuthConnectionPage
			{...props}
			connection={MicrosoftConnection}
			provider="microsoft"
		/>
	);
}
