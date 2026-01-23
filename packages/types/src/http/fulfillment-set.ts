import { FulfillmentSetDTO, ServiceZoneDTO } from "@medusajs/types"

export interface VendorFulfillmentSetResponse {
  /**
   * The fulfillment set's details.
   */
  fulfillment_set: FulfillmentSetDTO
}

export interface VendorServiceZoneResponse {
  /**
   * The service zone's details.
   */
  service_zone: ServiceZoneDTO
}

export interface VendorServiceZoneDeleteResponse {
  /**
   * The ID of the deleted service zone.
   */
  id: string
  /**
   * The type of the deleted resource.
   */
  object: "service_zone"
  /**
   * Whether the service zone was deleted.
   */
  deleted: boolean
}
