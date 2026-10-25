import { tr } from "@crm/agro-i18n";
import type { Metadata } from "next";
import { GoogleConnection } from "../google-connection";
import {
	type ConnectionQuery,
	OAuthConnectionPage,
} from "../oauth-connection-page";

export const metadata: Metadata = { title: tr("Google Workspace") };

export default function GoogleConnectionPage(props: {
	params: Promise<{ slug: string }>;
	searchParams: Promise<ConnectionQuery>;
}) {
	return (
		<OAuthConnectionPage
			{...props}
			connection={GoogleConnection}
			provider="google"
		/>
	);
}
