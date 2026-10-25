"use client";

import { tr } from "@crm/agro-i18n";
import { Button } from "@crm/ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@crm/ui/components/dialog";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from "@crm/ui/components/input-group";
import type { RouterOutputs } from "@/lib/trpc/types";
import { CopyValue } from "../copy-value";

type CreatedApiKey = RouterOutputs["apiKeys"]["create"];

export function CreatedApiKeyDialog({
	apiKey,
	onOpenChange,
}: {
	apiKey: CreatedApiKey | null;
	onOpenChange: (open: boolean) => void;
}) {
	return (
		<Dialog open={apiKey !== null} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{apiKey?.name ?? tr("API key")} created</DialogTitle>
					<DialogDescription>
						{tr("Copy it now. Nobody, including us, can show it to you again.")}
					</DialogDescription>
				</DialogHeader>

				<InputGroup>
					<InputGroupInput
						value={apiKey?.key ?? ""}
						readOnly
						className="font-mono"
					/>
					<InputGroupAddon align="inline-end">
						<CopyValue value={apiKey?.key ?? ""} label={tr("API key")} />
					</InputGroupAddon>
				</InputGroup>

				<DialogFooter>
					<Button onClick={() => onOpenChange(false)}>{tr("Done")}</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
