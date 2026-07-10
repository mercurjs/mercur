import { Avatar } from "@/components/atoms"
import { Chat } from "../Chat/Chat"
import { retrieveCustomer } from "@/lib/data/customer"
import { OrderParcelItems } from "@/components/molecules/OrderParcelItems/OrderParcelItems"
import { OrderParcelStatus } from "@/components/molecules/OrderParcelStatus/OrderParcelStatus"
import { OrderParcelActions } from "@/components/molecules/OrderParcelActions/OrderParcelActions"

export const OrderParcels = async ({ orders }: { orders: any[] }) => {
  const user = await retrieveCustomer()

  return (
    <>
      {orders.map((order) => (
        <div key={order.id} className="w-full mb-8">
          <div className="border rounded-sm p-4 bg-component-secondary font-semibold text-secondary uppercase">
            Order #{order.display_id}
          </div>
          <div className="border rounded-sm">
            <div className="p-4 border-b">
              <OrderParcelStatus order={order} />
            </div>
            <div className="p-4 border-b md:flex items-center justify-between">
              <div className="flex items-center gap-4 mb-4 md:mb-0">
                <Avatar src={order.seller.photo} />
                <p className="text-primary">{order.seller.name}</p>
              </div>
              <Chat
                user={user}
                seller={order.seller}
                order_id={order.id}
                buttonClassNames="label-md text-action-on-secondary uppercase flex items-center gap-2"
              />
            </div>
            <div className="p-4 border-b">
              <OrderParcelItems
                items={order.items}
                currency_code={order.currency_code}
              />
            </div>
            <div className="p-4">
              <OrderParcelActions order={order} />
            </div>
          </div>
        </div>
      ))}
    </>
  )
}
