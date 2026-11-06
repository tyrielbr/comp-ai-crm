import type { IsidoroTicketInput } from "./isidoro-ticket.contracts";
import type {
	OpenedSupportTicket,
	SupportTicketStatusView,
} from "./support-ticket.service";

export const SUPPORT_TICKET_GATEWAY = Symbol("SUPPORT_TICKET_GATEWAY");

export interface SupportTicketGateway {
	openTicket(input: IsidoroTicketInput): Promise<OpenedSupportTicket>;
	readTicket(
		tenantId: string,
		ticketNumber: number,
	): Promise<SupportTicketStatusView>;
}
