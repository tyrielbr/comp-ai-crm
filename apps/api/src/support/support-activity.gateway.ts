import type { IsidoroActivityInput } from "./isidoro-activity.contracts";
import type { OpenedSupportTicket } from "./support-ticket.service";

export const SUPPORT_TICKET_GATEWAY = Symbol("SUPPORT_TICKET_GATEWAY");

export interface SupportTicketGateway {
	openTicket(input: IsidoroActivityInput): Promise<OpenedSupportTicket>;
}
