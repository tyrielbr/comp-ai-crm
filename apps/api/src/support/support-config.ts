const HOUR_MS = 60 * 60 * 1000;

export const SUPPORT_OPENER_ROLES = [
	"Gerente",
	"Administrador",
	"Diretor Financeiro",
	"Proprietário",
] as const;

export const SUPPORT = {
	sla: { defaultHours: 8, minHours: 1, maxHours: 24 * 14 },
	subject: { maxLength: 120 },
} as const;

export function supportSlaDurationMs(raw: string | undefined): number {
	const hours = Number(raw);
	if (
		!Number.isInteger(hours) ||
		hours < SUPPORT.sla.minHours ||
		hours > SUPPORT.sla.maxHours
	) {
		return SUPPORT.sla.defaultHours * HOUR_MS;
	}
	return hours * HOUR_MS;
}
