import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { EnvironmentVariables } from "../config/env.validation";
import { BRIDGE_KEY_VERIFIER, BridgeKeyVerifier } from "./bridge-key.verifier";
import { CrmSupportTicketGateway } from "./crm-support-activity.gateway";
import { IsidoroActivitiesController } from "./isidoro-activities.controller";
import { SUPPORT_TICKET_GATEWAY } from "./support-activity.gateway";
import { SupportTicketService } from "./support-ticket.service";
import { PrismaSupportTicketStore } from "./support-ticket.store";

type Config = ConfigService<EnvironmentVariables, true>;

@Module({
	controllers: [IsidoroActivitiesController],
	providers: [
		PrismaSupportTicketStore,
		{
			provide: BRIDGE_KEY_VERIFIER,
			inject: [ConfigService],
			useFactory: (config: Config) =>
				new BridgeKeyVerifier(
					config.get("CATARINA_BRIDGE_API_KEY", { infer: true }),
				),
		},
		{
			provide: SupportTicketService,
			inject: [PrismaSupportTicketStore, ConfigService],
			useFactory: (store: PrismaSupportTicketStore, config: Config) =>
				new SupportTicketService(store, {
					companyId: config.get("CATARINA_SUPPORT_COMPANY_ID", {
						infer: true,
					}),
					actingUserId: config.get("CATARINA_BRIDGE_USER_ID", {
						infer: true,
					}),
				}),
		},
		{
			provide: SUPPORT_TICKET_GATEWAY,
			inject: [SupportTicketService],
			useFactory: (tickets: SupportTicketService) =>
				new CrmSupportTicketGateway(tickets),
		},
	],
})
export class CatarinaBridgeModule {}
