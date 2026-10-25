/**
 * Agro: campos padrão fora do perfil de fazenda. Só aparecem quando já têm valor
 * (nada é apagado; dados vindos do agente ou da API continuam visíveis).
 * Lista única para manter: painéis de detalhe, formulários e o painel "Campos" leem daqui.
 */
export const HIDDEN_WHEN_EMPTY = {
	COMPANY: ["domain", "website", "country"],
	CONTACT: ["linkedinUrl", "twitterUrl", "githubUrl"],
	DEAL: [],
} as const satisfies Record<"COMPANY" | "CONTACT" | "DEAL", readonly string[]>;

/** Rótulos (em inglês, como em standard-fields.ts) dos campos acima, para o painel "Campos". */
export const HIDDEN_WHEN_EMPTY_LABELS: Record<string, readonly string[]> = {
	COMPANY: ["Domain", "Website", "Country"],
	CONTACT: ["LinkedIn", "X", "GitHub"],
	DEAL: [],
};

type Entity = keyof typeof HIDDEN_WHEN_EMPTY;

export function showStandardField(
	entity: Entity,
	key: string,
	value: string | null | undefined,
): boolean {
	const hidden = HIDDEN_WHEN_EMPTY[entity] as readonly string[];
	return !hidden.includes(key) || Boolean(value && value.trim());
}
