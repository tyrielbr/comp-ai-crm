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
	type IsidoroActivityRequest,
	type IsidoroActivityResult,
	isidoroActivityInput,
} from "./isidoro-activity.contracts";
import {
	SUPPORT_TICKET_GATEWAY,
	type SupportTicketGateway,
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
		@Inject(SUPPORT_TICKET_GATEWAY)
		private readonly tickets: SupportTicketGateway,
	) {}

	@Post("isidoro-activities")
	@HttpCode(201)
	@AllowAnonymous()
	@ApiOperation({
		summary: "Open a technical support ticket requested by Isidoro",
	})
	@ApiCreatedResponse({
		description:
			"The support ticket was opened, or the same key already had one.",
	})
	@ApiBadRequestResponse({ description: "The payload is invalid." })
	@ApiForbiddenResponse({ description: "The bridge key did not match." })
	@ApiServiceUnavailableResponse({ description: "The bridge is not set up." })
	async create(
		@Body() body: IsidoroActivityRequest,
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

		const opened = await this.tickets.openTicket(parsed.data);
		return {
			ticketId: opened.ticketId,
			ticketNumber: opened.ticketNumber,
			slaDueAt: opened.slaDueAt.toISOString(),
			status: opened.status,
		};
	}
}
