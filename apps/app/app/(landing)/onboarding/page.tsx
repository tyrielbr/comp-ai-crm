import { tr } from "@crm/agro-i18n";
import { DEFAULT_WORKSPACE_NAME } from "@crm/auth/organization";
import type { Metadata } from "next";
import { AuthHeading, AuthShell } from "@/components/auth-shell";
import { requireMailboxAccess } from "@/lib/session";
import { OnboardingForm } from "./onboarding-form";

export const metadata: Metadata = {
	title: tr("Set up"),
};

export const instant = false;

export default async function OnboardingPage() {
	await requireMailboxAccess();

	return (
		<AuthShell>
			<AuthHeading
				title={tr("Tell us about your company")}
				description={tr(
					"Two things, once. The name is what the CRM calls you; the website is how the agent learns what you sell.",
				)}
			/>

			<OnboardingForm placeholder={DEFAULT_WORKSPACE_NAME} />
		</AuthShell>
	);
}
