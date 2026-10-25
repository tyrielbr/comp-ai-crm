"use client";

import Copy from "@carbon/icons-react/es/Copy";
import { tr } from "@crm/agro-i18n";
import { Button } from "@crm/ui/components/button";
import { Icon } from "@crm/ui/components/icon";
import { toast } from "sonner";

export function CopyValue({ value, label }: { value: string; label: string }) {
	const unavailable = () =>
		toast.error(
			tr("Could not copy the {v}. Select it instead.", {
				v: label.toLowerCase(),
			}),
		);

	return (
		<Button
			variant="ghost"
			size="icon"
			type="button"
			onClick={() => {
				const clipboard = navigator.clipboard;

				if (!clipboard) {
					unavailable();
					return;
				}

				clipboard
					.writeText(value)
					.then(() => toast.success(tr("{label} copied.", { label })))
					.catch(unavailable);
			}}
		>
			<Icon icon={Copy} />
			<span className="sr-only">
				{tr("Copy {label}", { label: label.toLowerCase() })}
			</span>
		</Button>
	);
}
