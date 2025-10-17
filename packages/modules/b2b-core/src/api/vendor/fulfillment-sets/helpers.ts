import { ServiceZoneDTO } from '@medusajs/framework/types'

export const remapServiceZoneFieldsToSellerServiceZone = (fields: string[]) => {
  return fields.map((field) => `service_zone.${field}`)
}

export const remapSellerServiceZoneQuery = (
  data: { service_zone: ServiceZoneDTO }[]
) => data.map((it) => it.service_zone)
