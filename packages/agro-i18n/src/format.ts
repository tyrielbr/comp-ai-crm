/** Formatação pt-BR (números, moeda BRL, datas). */
export const AGRO_INTL_LOCALE = "pt-BR";
export const AGRO_CURRENCY = "BRL";

export function formatBRL(value: number, options?: Intl.NumberFormatOptions) {
	return new Intl.NumberFormat(AGRO_INTL_LOCALE, {
		style: "currency",
		currency: AGRO_CURRENCY,
		...options,
	}).format(value);
}

export function formatNumber(
	value: number,
	options?: Intl.NumberFormatOptions,
) {
	return new Intl.NumberFormat(AGRO_INTL_LOCALE, options).format(value);
}

export function formatDate(
	value: Date | string | number,
	options: Intl.DateTimeFormatOptions = { dateStyle: "short" },
) {
	return new Intl.DateTimeFormat(AGRO_INTL_LOCALE, options).format(
		new Date(value),
	);
}
