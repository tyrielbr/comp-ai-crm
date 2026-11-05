import {
	BadRequestException,
	Body,
	Controller,
	Headers,
	HttpCode,
	Inject,
	Post,
} from "@nestjs/common";
import {
	ApiBadRequestResponse,
	ApiCreatedResponse,
	ApiForbiddenResponse,
	ApiHeader,
	ApiOperation,
	ApiServiceUnavailableResponse,
	ApiTags,
} from "@nestjs/swagger";
import { AllowAnonymous } from "@thallesp/nestjs-better-auth";
import {
	BRIDGE_KEY_VERIFIER,
	type BridgeKeyVerifier,
} from "./bridge-key.verifier";
import {
	type IsidoroActivityResult,
	isidoroActivityInput,
} from "./isidoro-activity.contracts";
import {
	SUPPORT_ACTIVITY_GATEWAY,
	type SupportActivityGateway,
} from "./support-activity.gateway";

@ApiTags("Support — Catarina")
@ApiHeader({
	name: "authorization",
	description: "`Bearer <CATARINA_BRIDGE_API_KEY>`",
	required: true,
})
@Controller("api/support")
export class IsidoroActivitiesController {
	constructor(
		@Inject(BRIDGE_KEY_VERIFIER) private readonly verifier: BridgeKeyVerifier,
		@Inject(SUPPORT_ACTIVITY_GATEWAY)
		private readonly gateway: SupportActivityGateway,
	) {}

	@Post("isidoro-activities")
	@HttpCode(201)
	@AllowAnonymous()
	@ApiOperation({ summary: "Create a support activity requested by Isidoro" })
	@ApiCreatedResponse({ description: "The CRM activity was created." })
	@ApiBadRequestResponse({ description: "The payload is invalid." })
	@ApiForbiddenResponse({ description: "The bridge key did not match." })
	@ApiServiceUnavailableResponse({ description: "The bridge is not set up." })
	async create(
		@Body() body: unknown,
		@Headers("authorization") authorization?: string,
	): Promise<IsidoroActivityResult> {
		this.verifier.assert(authorization);

		const parsed = isidoroActivityInput.safeParse(body);
		if (!parsed.success) {
			throw new BadRequestException({
				message: "Invalid payload",
				issues: parsed.error.issues.map(({ path, message }) => ({
					path: path.join("."),
					message,
				})),
			});
		}

		const { activityId } = await this.gateway.createSupportActivity(
			parsed.data,
		);
		return { activityId, status: "created" };
	}
}
