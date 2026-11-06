import type { IsidoroTicketInput } from "./isidoro-ticket.contracts";
import type { SupportTicketGateway } from "./support-ticket.gateway";
import type {
	OpenedSupportTicket,
	SupportTicketService,
	SupportTicketStatusView,
} from "./support-ticket.service";

export class CrmSupportTicketGateway implements SupportTicketGateway {
	constructor(private readonly tickets: SupportTicketService) {}

	openTicket(input: IsidoroTicketInput): Promise<OpenedSupportTicket> {
		return this.tickets.open(input);
	}

	readTicket(
		tenantId: string,
		ticketNumber: number,
	): Promise<SupportTicketStatusView> {
		return this.tickets.read(tenantId, ticketNumber);
	}
}
