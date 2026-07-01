import { Card } from "@/components/atoms"
import { retrieveCustomer } from "@/lib/data/customer"
import { getRegion } from "@/lib/data/regions"

export const OrderAddresses = async ({ singleOrder }: { singleOrder: any }) => {
  const user = await retrieveCustomer()
  const region = await getRegion(singleOrder.shipping_address.country_code)

  if (!user) return null

  return (
    <Card className="px-4 grid sm:grid-cols-2 gap-4">
      <div className="flex flex-col ">
        <h4 className="label-md text-primary">Shipping address</h4>
        <p className="label-md text-secondary">
          {`${singleOrder.shipping_address.first_name} ${singleOrder.shipping_address.last_name}`}
        </p>
        <p className="label-md text-secondary">
          {`${singleOrder.shipping_address.address_1}, ${
            singleOrder.shipping_address.postal_code
          } ${singleOrder.shipping_address.city}${
            singleOrder.shipping_address.province
              ? `, ${singleOrder.shipping_address.province}`
              : ""
          }${
            region
              ? `, ${region.name}`
              : `, ${singleOrder.shipping_address.country_code?.toUpperCase()}`
          }`}
        </p>
        <p className="label-md text-secondary">
          {`${user.email}, ${singleOrder.shipping_address.phone || user.phone}`}
        </p>
      </div>
      <div>
        <h4 className="label-md text-primary">Billing address</h4>
        {singleOrder.billing_address.id === singleOrder.shipping_address.id ? (
          <p className="label-md text-secondary">Same as shipping address</p>
        ) : (
          <>
            <p className="label-md text-secondary">
              {`${singleOrder.billing_address.first_name} ${singleOrder.billing_address.last_name}`}
            </p>
            <p className="label-md text-secondary">
              {`${singleOrder.billing_address.address_1}, ${
                singleOrder.billing_address.postal_code
              } ${singleOrder.billing_address.city}${
                singleOrder.billing_address.province
                  ? `, ${singleOrder.billing_address.province}`
                  : ""
              }${
                region
                  ? `, ${region.name}`
                  : `, ${singleOrder.billing_address.country_code?.toUpperCase()}`
              }`}
            </p>
            <p className="label-md text-secondary">
              {`${user.email}, ${
                singleOrder.billing_address.phone || user.phone
              }`}
            </p>
          </>
        )}
      </div>
    </Card>
  )
}
