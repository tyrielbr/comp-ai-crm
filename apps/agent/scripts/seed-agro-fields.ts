import { CAMPOS_AGRO } from "../agent/lib/agro-campos";
import { createField } from "../agent/lib/fields";

const results: string[] = [];

for (const campo of CAMPOS_AGRO) {
	const created = await createField({
		entity: campo.entity,
		label: campo.label,
		type: campo.type,
		options: campo.options,
		agentBrief: campo.agentBrief,
	});

	if ("created" in created) {
		results.push(`existe ${campo.entity} ${campo.label}: ${created.reason}`);
		continue;
	}

	results.push(`criado ${campo.entity} ${created.key}`);
}

console.log(results.join("\n"));
