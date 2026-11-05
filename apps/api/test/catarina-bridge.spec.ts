import { describe, expect, it, mock } from "bun:test";
import {
	ForbiddenException,
	ServiceUnavailableException,
} from "@nestjs/common";
import { BridgeKeyVerifier } from "../src/support/bridge-key.verifier";
import { CrmSupportActivityGateway } from "../src/support/crm-support-activity.gateway";
import { IsidoroActivitiesController } from "../src/support/isidoro-activities.controller";
import { isidoroActivityInput } from "../src/support/isidoro-activity.contracts";
import type { SupportActivityGateway } from "../src/support/support-activity.gateway";

const KEY = "test-bridge-key-0123456789abcdef";

const validPayload = {
	idempotencyKey: "isidoro-update-123",
	user: { tenantId: "tenant-1", userId: "user-1", email: "joao@fazenda.test" },
	problem: {
		description: "Não consigo lançar o abastecimento da colheitadeira.",
	},
	context: { module: "maquinas", conversationId: "conv-9", severity: "high" },
};

function fakeGateway(): SupportActivityGateway & {
	createSupportActivity: ReturnType<typeof mock>;
} {
	return {
		createSupportActivity: mock(async () => ({ activityId: "act-1" })),
	};
}

describe("BridgeKeyVerifier", () => {
	it("refuses when the key is not configured", () => {
		const verifier = new BridgeKeyVerifier(undefined);
		expect(() => verifier.assert(`Bearer ${KEY}`)).toThrow(
			ServiceUnavailableException,
		);
	});

	it("rejects a missing header", () => {
		expect(() => new BridgeKeyVerifier(KEY).assert(undefined)).toThrow(
			ForbiddenException,
		);
	});

	it("rejects a wrong key, including one of different length", () => {
		const verifier = new BridgeKeyVerifier(KEY);
		expect(() => verifier.assert("Bearer wrong")).toThrow(ForbiddenException);
		expect(() => verifier.assert(`Bearer ${KEY.slice(0, -1)}x`)).toThrow(
			ForbiddenException,
		);
		expect(() => verifier.assert(KEY)).toThrow(ForbiddenException);
	});

	it("accepts the right bearer key", () => {
		expect(() =>
			new BridgeKeyVerifier(KEY).assert(`Bearer ${KEY}`),
		).not.toThrow();
	});
});

describe("isidoroActivityInput", () => {
	it("accepts a valid payload", () => {
		expect(isidoroActivityInput.safeParse(validPayload).success).toBe(true);
	});

	it("accepts a payload without optional context", () => {
		const { context: _context, ...rest } = validPayload;
		expect(isidoroActivityInput.safeParse(rest).success).toBe(true);
	});

	it("requires the idempotency key", () => {
		const { idempotencyKey: _key, ...rest } = validPayload;
		expect(isidoroActivityInput.safeParse(rest).success).toBe(false);
	});

	it("requires a non-blank problem description", () => {
		const payload = { ...validPayload, problem: { description: "   " } };
		expect(isidoroActivityInput.safeParse(payload).success).toBe(false);
	});

	it("requires tenantId and userId", () => {
		const payload = { ...validPayload, user: { email: "a@b.test" } };
		expect(isidoroActivityInput.safeParse(payload).success).toBe(false);
	});

	it("requires a name or an email", () => {
		const payload = {
			...validPayload,
			user: { tenantId: "tenant-1", userId: "user-1" },
		};
		expect(isidoroActivityInput.safeParse(payload).success).toBe(false);
	});

	it("rejects an unknown severity", () => {
		const payload = { ...validPayload, context: { severity: "panic" } };
		expect(isidoroActivityInput.safeParse(payload).success).toBe(false);
	});
});

describe("IsidoroActivitiesController", () => {
	it("rejects without calling the CRM when the key is wrong", async () => {
		const gateway = fakeGateway();
		const controller = new IsidoroActivitiesController(
			new BridgeKeyVerifier(KEY),
			gateway,
		);
		await expect(
			controller.create(validPayload, "Bearer nope"),
		).rejects.toThrow(ForbiddenException);
		expect(gateway.createSupportActivity).not.toHaveBeenCalled();
	});

	it("returns 400 for an invalid payload without calling the CRM", async () => {
		const gateway = fakeGateway();
		const controller = new IsidoroActivitiesController(
			new BridgeKeyVerifier(KEY),
			gateway,
		);
		await expect(
			controller.create({ problem: {} }, `Bearer ${KEY}`),
		).rejects.toMatchObject({ status: 400 });
		expect(gateway.createSupportActivity).not.toHaveBeenCalled();
	});

	it("creates the support activity through the gateway", async () => {
		const gateway = fakeGateway();
		const controller = new IsidoroActivitiesController(
			new BridgeKeyVerifier(KEY),
			gateway,
		);
		const result = await controller.create(validPayload, `Bearer ${KEY}`);
		expect(result).toEqual({ activityId: "act-1", status: "created" });
		expect(gateway.createSupportActivity).toHaveBeenCalledTimes(1);
		expect(gateway.createSupportActivity.mock.calls[0]?.[0]).toMatchObject({
			idempotencyKey: "isidoro-update-123",
			user: { tenantId: "tenant-1" },
		});
	});
});

describe("CrmSupportActivityGateway", () => {
	it("creates a CRM TASK on the configured company as the bridge user", async () => {
		const create = mock(async () => ({ id: "act-42" }));
		const gateway = new CrmSupportActivityGateway({ create } as never, {
			companyId: "company-support",
			actingUserId: "user-catarina",
		});
		const input = isidoroActivityInput.parse(validPayload);

		const result = await gateway.createSupportActivity(input);

		expect(result).toEqual({ activityId: "act-42" });
		const [activity, actingUserId] = create.mock.calls[0] as unknown as [
			Record<string, unknown>,
			string,
		];
		expect(actingUserId).toBe("user-catarina");
		expect(activity).toMatchObject({
			type: "TASK",
			companyId: "company-support",
		});
		expect(String(activity.subject)).toContain("[Isidoro]");
		expect(String(activity.body)).toContain("abastecimento");
		expect(String(activity.body)).toContain("isidoro-update-123");
	});

	it("refuses when the CRM target is not configured", async () => {
		const gateway = new CrmSupportActivityGateway({ create: mock() } as never, {
			companyId: undefined,
			actingUserId: undefined,
		});
		await expect(
			gateway.createSupportActivity(isidoroActivityInput.parse(validPayload)),
		).rejects.toThrow(ServiceUnavailableException);
	});
});
