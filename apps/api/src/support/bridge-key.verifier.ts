import { createHash, timingSafeEqual } from "node:crypto";
import { tr } from "@crm/agro-i18n";
import {
	ForbiddenException,
	Logger,
	ServiceUnavailableException,
} from "@nestjs/common";

export const BRIDGE_KEY_VERIFIER = Symbol("BRIDGE_KEY_VERIFIER");

/** Checks `Authorization: Bearer <CATARINA_BRIDGE_API_KEY>` in constant time. */
export class BridgeKeyVerifier {
	private readonly logger = new Logger(BridgeKeyVerifier.name);
	private readonly expected: Buffer | undefined;

	constructor(secret: string | undefined) {
		this.expected = secret ? digest(`Bearer ${secret}`) : undefined;
	}

	assert(authorization: string | undefined): void {
		if (!this.expected) {
			this.logger.error({
				message: "CATARINA_BRIDGE_API_KEY is not set — refusing Isidoro calls.",
			});
			throw new ServiceUnavailableException(
				tr("The support bridge is not configured."),
			);
		}

		// Hashing both sides gives equal-length buffers, so neither the
		// comparison nor its length check leaks anything about the secret.
		if (!timingSafeEqual(digest(authorization ?? ""), this.expected)) {
			throw new ForbiddenException();
		}
	}
}

function digest(value: string): Buffer {
	return createHash("sha256").update(value).digest();
}
