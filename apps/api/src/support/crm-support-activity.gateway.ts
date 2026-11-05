import type { IsidoroActivityInput } from "./isidoro-activity.contracts";
import type { SupportTicketGateway } from "./support-activity.gateway";
import type {
	OpenedSupportTicket,
	SupportTicketService,
} from "./support-ticket.service";

export class CrmSupportTicketGateway implements SupportTicketGateway {
	constructor(private readonly tickets: SupportTicketService) {}

	openTicket(input: IsidoroActivityInput): Promise<OpenedSupportTicket> {
		return this.tickets.open(input);
	}
}
