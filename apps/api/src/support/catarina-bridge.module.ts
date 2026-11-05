import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ActivitiesModule } from "../activities/activities.module";
import { ActivitiesService } from "../activities/activities.service";
import type { EnvironmentVariables } from "../config/env.validation";
import { BRIDGE_KEY_VERIFIER, BridgeKeyVerifier } from "./bridge-key.verifier";
import { CrmSupportActivityGateway } from "./crm-support-activity.gateway";
import { IsidoroActivitiesController } from "./isidoro-activities.controller";
import { SUPPORT_ACTIVITY_GATEWAY } from "./support-activity.gateway";

type Config = ConfigService<EnvironmentVariables, true>;

@Module({
	imports: [ActivitiesModule],
	controllers: [IsidoroActivitiesController],
	providers: [
		{
			provide: BRIDGE_KEY_VERIFIER,
			inject: [ConfigService],
			useFactory: (config: Config) =>
				new BridgeKeyVerifier(
					config.get("CATARINA_BRIDGE_API_KEY", { infer: true }),
				),
		},
		{
			provide: SUPPORT_ACTIVITY_GATEWAY,
			inject: [ActivitiesService, ConfigService],
			useFactory: (activities: ActivitiesService, config: Config) =>
				new CrmSupportActivityGateway(activities, {
					companyId: config.get("CATARINA_SUPPORT_COMPANY_ID", { infer: true }),
					actingUserId: config.get("CATARINA_BRIDGE_USER_ID", { infer: true }),
				}),
		},
	],
})
export class CatarinaBridgeModule {}
