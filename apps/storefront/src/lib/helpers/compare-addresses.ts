import { isEqual, pick } from "lodash"

export default function compareAddresses(address1: any, address2: any) {
  return isEqual(
    pick(address1, [
      "first_name",
      "last_name",
      "address_1",
      "city",
      "country_code",
    ]),
    pick(address2, [
      "first_name",
      "last_name",
      "address_1",
      "city",
      "country_code",
    ])
  )
}
