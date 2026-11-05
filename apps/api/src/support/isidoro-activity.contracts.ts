import { z } from "zod";

export const SUPPORT_SEVERITIES = [
	"low",
	"medium",
	"high",
	"critical",
] as const;

const userInput = z
	.object({
		tenantId: z.string().trim().min(1),
		userId: z.string().trim().min(1),
		name: z.string().trim().min(1).optional(),
		email: z.string().trim().email().optional(),
	})
	.refine((user) => user.name || user.email, {
		message: "The user needs a name or an email.",
	});

export const isidoroActivityInput = z.object({
	idempotencyKey: z.string().trim().min(1).max(200),
	user: userInput,
	problem: z.object({
		description: z.string().trim().min(1).max(10_000),
	}),
	context: z
		.object({
			module: z.string().trim().min(1).max(100).optional(),
			conversationId: z.string().trim().min(1).max(200).optional(),
			severity: z.enum(SUPPORT_SEVERITIES).optional(),
		})
		.optional(),
});

export type IsidoroActivityInput = z.infer<typeof isidoroActivityInput>;

export type IsidoroActivityResult = {
	activityId: string;
	status: "created";
};
