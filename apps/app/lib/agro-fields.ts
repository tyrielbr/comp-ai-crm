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
export const HIDDEN_WHEN_EMPTY_LABELS = {
	COMPANY: ["Domain", "Website", "Country"],
	CONTACT: ["LinkedIn", "X", "GitHub"],
	DEAL: [],
} satisfies Record<"COMPANY" | "CONTACT" | "DEAL", readonly string[]>;

type Entity = keyof typeof HIDDEN_WHEN_EMPTY;

export function showStandardField(
	entity: Entity,
	key: string,
	value: string | null | undefined,
): boolean {
	const hidden = HIDDEN_WHEN_EMPTY[entity] as readonly string[];
	return !hidden.includes(key) || Boolean(value && value.trim());
}

/** Agro: campos personalizados agrupados na seção "Propriedade e CAR" dos painéis. */
export const CAR_GROUP_TITLE = "Propriedade e CAR";

const CAR_FIELD_LABELS = [
	"localização (pino)",
	"código car",
	"área car (ha)",
	"situação do car",
	"confiança do vínculo car",
	"código ibge",
	"pivôs",
	"pivôs (ha)",
];

const fold = (text: string) =>
	text
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.trim()
		.toLowerCase();

const CAR_FOLDED = new Set(CAR_FIELD_LABELS.map(fold));

export function isCarField(label: string): boolean {
	return CAR_FOLDED.has(fold(label));
}
