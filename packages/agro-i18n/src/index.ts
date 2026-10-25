/**
 * Camada add-on Agro: tradução pt-BR.
 *
 * A chave é o próprio texto em inglês do upstream. Se a chave não estiver no
 * catálogo, o texto em inglês aparece — assim strings novas do upstream nunca
 * quebram a tela, apenas ficam em inglês até serem adicionadas ao catálogo.
 *
 * Síncrono e sem provider: funciona em Server Components, Client Components e
 * módulos comuns (ex.: lib/deal-stage.ts).
 */
import ptBR from "./pt-BR.json";

export const AGRO_LOCALE = "pt-BR" as const;

const catalog: Record<string, string> = ptBR;

// Nos testes do upstream (bun test) mantemos o texto original em inglês,
// para que as asserções existentes continuem válidas.
const passthrough =
	(globalThis as { process?: { env?: Record<string, string | undefined> } })
		.process?.env?.NODE_ENV === "test";

type Vars = Record<string, string | number | boolean | null | undefined>;

/** Traduz `source` (texto em inglês). Suporta interpolação `{nome}`. */
export function tr(source: string, vars?: Vars): string {
	const text = (!passthrough && catalog[source]) || source;
	if (!vars) return text;
	return text.replace(/\{(\w+)\}/g, (match, name: string) =>
		name in vars ? String(vars[name]) : match,
	);
}

/** Plural simples: escolhe singular/plural pela contagem e interpola `{count}`. */
export function trPlural(
	count: number,
	singular: string,
	plural: string,
	vars?: Vars,
): string {
	return tr(count === 1 ? singular : plural, { count, ...vars });
}
