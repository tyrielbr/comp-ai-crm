import { tr } from "@crm/agro-i18n";
import {
	BadRequestException,
	Body,
	Controller,
	ForbiddenException,
	Get,
	Headers,
	HttpCode,
	Inject,
	Param,
	Post,
	Query,
} from "@nestjs/common";
import {
	ApiBadRequestResponse,
	ApiCreatedResponse,
	ApiForbiddenResponse,
	ApiHeader,
	ApiNotFoundResponse,
	ApiOkResponse,
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
	type IsidoroTicketRequest,
	type IsidoroTicketResult,
	type IsidoroTicketStatusResult,
	isidoroTicketInput,
} from "./isidoro-ticket.contracts";
import { SUPPORT_OPENER_ROLES } from "./support-config";
import {
	SUPPORT_TICKET_GATEWAY,
	type SupportTicketGateway,
} from "./support-ticket.gateway";

@ApiTags("Support — Catarina")
@ApiHeader({
	name: "authorization",
	description: "`Bearer <CATARINA_BRIDGE_API_KEY>`",
	required: true,
})
@Controller("api/support/tickets")
export class IsidoroTicketsController {
	constructor(
		@Inject(BRIDGE_KEY_VERIFIER) private readonly verifier: BridgeKeyVerifier,
		@Inject(SUPPORT_TICKET_GATEWAY)
		private readonly tickets: SupportTicketGateway,
	) {}

	@Post()
	@HttpCode(201)
	@AllowAnonymous()
	@ApiOperation({
		summary: "Open a technical support ticket requested by Isidoro",
	})
	@ApiCreatedResponse({
		description:
			"The support ticket was opened, or the same tenant key already had one.",
	})
	@ApiBadRequestResponse({ description: "The payload is invalid." })
	@ApiForbiddenResponse({
		description: "The bridge key or the opener role did not match.",
	})
	@ApiServiceUnavailableResponse({ description: "The bridge is not set up." })
	async create(
		@Body() body: IsidoroTicketRequest,
		@Headers("authorization") authorization?: string,
	): Promise<IsidoroTicketResult> {
		this.verifier.assert(authorization);
		const parsed = isidoroTicketInput.safeParse(body);
		if (!parsed.success) {
			throw new BadRequestException({
				message: "Invalid payload",
				issues: parsed.error.issues.map(({ path, message }) => ({
					path: path.join("."),
					message,
				})),
			});
		}
		if (
			!(SUPPORT_OPENER_ROLES as readonly string[]).includes(
				parsed.data.user.role,
			)
		) {
			throw new ForbiddenException(
				tr("That role cannot open a support ticket."),
			);
		}

		const opened = await this.tickets.openTicket(parsed.data);
		return {
			ticketId: opened.ticketId,
			ticketNumber: opened.ticketNumber,
			slaDueAt: opened.slaDueAt.toISOString(),
			status: opened.status,
		};
	}

	@Get(":ticketNumber")
	@AllowAnonymous()
	@ApiOperation({ summary: "Read a technical support ticket for one tenant" })
	@ApiOkResponse({ description: "The ticket status for that tenant." })
	@ApiNotFoundResponse({
		description: "No ticket with that number for the tenant.",
	})
	async read(
		@Param("ticketNumber") ticketNumber: string,
		@Query("tenantId") tenantId: string | undefined,
		@Headers("authorization") authorization?: string,
	): Promise<IsidoroTicketStatusResult> {
		this.verifier.assert(authorization);
		const number = Number(ticketNumber);
		if (!tenantId?.trim() || !Number.isInteger(number) || number < 1) {
			throw new BadRequestException({ message: "Invalid ticket lookup" });
		}
		const ticket = await this.tickets.readTicket(tenantId.trim(), number);
		return {
			ticketId: ticket.ticketId,
			ticketNumber: ticket.ticketNumber,
			status: ticket.status,
			slaDueAt: ticket.slaDueAt.toISOString(),
			closedAt: ticket.closedAt?.toISOString() ?? null,
			assigneeId: ticket.assigneeId,
		};
	}
}
