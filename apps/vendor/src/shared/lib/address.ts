import { VendorOrderAddress } from '@mercurjs/http-client/types'

export const formatAddress = (address: VendorOrderAddress) => {
  return `${address.address_1} ${address.address_2} ${address.city} ${address.province} ${address.postal_code} ${address.country_code}`
}
