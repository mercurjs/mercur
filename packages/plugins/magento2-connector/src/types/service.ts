import {
  Context,
  FindConfig,
  IModuleService,
} from "@medusajs/framework/types"

import {
  CreateMagentoWebhookDeliveryDTO,
  CreateMagentoWebhookEndpointDTO,
  FilterableMagentoWebhookDeliveryProps,
  FilterableMagentoWebhookEndpointProps,
  MagentoWebhookDeliveryDTO,
  MagentoWebhookEndpointDTO,
  UpdateMagentoWebhookDeliveryDTO,
  UpdateMagentoWebhookEndpointDTO,
} from "./common"

export interface IMagentoWebhookModuleService extends IModuleService {
  retrieveMagentoWebhookEndpoint(
    id: string,
    config?: FindConfig<MagentoWebhookEndpointDTO>,
    sharedContext?: Context
  ): Promise<MagentoWebhookEndpointDTO>
  listMagentoWebhookEndpoints(
    filters?: FilterableMagentoWebhookEndpointProps,
    config?: FindConfig<MagentoWebhookEndpointDTO>,
    sharedContext?: Context
  ): Promise<MagentoWebhookEndpointDTO[]>
  createMagentoWebhookEndpoints(
    data: CreateMagentoWebhookEndpointDTO,
    sharedContext?: Context
  ): Promise<MagentoWebhookEndpointDTO>
  createMagentoWebhookEndpoints(
    data: CreateMagentoWebhookEndpointDTO[],
    sharedContext?: Context
  ): Promise<MagentoWebhookEndpointDTO[]>
  updateMagentoWebhookEndpoints(
    data: UpdateMagentoWebhookEndpointDTO,
    sharedContext?: Context
  ): Promise<MagentoWebhookEndpointDTO>
  updateMagentoWebhookEndpoints(
    data: UpdateMagentoWebhookEndpointDTO[],
    sharedContext?: Context
  ): Promise<MagentoWebhookEndpointDTO[]>
  softDeleteMagentoWebhookEndpoints(
    ids: string | string[],
    config?: unknown,
    sharedContext?: Context
  ): Promise<Record<string, string[]> | void>
  restoreMagentoWebhookEndpoints(
    ids: string | string[],
    config?: unknown,
    sharedContext?: Context
  ): Promise<Record<string, string[]> | void>

  retrieveMagentoWebhookDelivery(
    id: string,
    config?: FindConfig<MagentoWebhookDeliveryDTO>,
    sharedContext?: Context
  ): Promise<MagentoWebhookDeliveryDTO>
  listMagentoWebhookDeliveries(
    filters?: FilterableMagentoWebhookDeliveryProps,
    config?: FindConfig<MagentoWebhookDeliveryDTO>,
    sharedContext?: Context
  ): Promise<MagentoWebhookDeliveryDTO[]>
  createMagentoWebhookDeliveries(
    data: CreateMagentoWebhookDeliveryDTO[],
    sharedContext?: Context
  ): Promise<MagentoWebhookDeliveryDTO[]>
  updateMagentoWebhookDeliveries(
    data: UpdateMagentoWebhookDeliveryDTO[],
    sharedContext?: Context
  ): Promise<MagentoWebhookDeliveryDTO[]>
  deleteMagentoWebhookDeliveries(
    ids: string | string[],
    sharedContext?: Context
  ): Promise<void>
}
