const HOUR_MS = 60 * 60 * 1000;

export const SUPPORT = {
	sla: { durationMs: 24 * HOUR_MS },
	subject: { maxLength: 120 },
} as const;
