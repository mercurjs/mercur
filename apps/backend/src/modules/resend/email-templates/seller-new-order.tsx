interface EmailTemplateProps {
  data: {
		user_name: string,
		host: string,
		order_id: string,
		profit: number,
		order: {
			id: string,
			display_id: string,
			trackingNumber: string,
			subtotal: number,
			shipping: number,
			fee: number,
			items: {
				name: string,
				price: number,
				quantity: number,
			}[],
			currency_code: string,
			item_total: number,
			shipping_methods: {
				amount: number,
				name: string
			}[],
			total: number
			email: string
			shipping_address: {
				first_name: string,
				last_name: string,
				company: string,
				address_1: string,
				address_2: string,
				city: string,
				province: string,
				postal_code: string,
				phone: string
			}
		}
	}
}

export const SellerNewOrderEmailTemplate: React.FC<Readonly<EmailTemplateProps>> = ({ data }) => {
  return (
    <div>
      <h1>
        {data.user_name} has placed an order for {data.order.items[0].name}
      </h1>
      <p>
        New Order #{data.order.display_id} for {data.order.items[0].name}.{data.user_name} has just ordered {data.order.items[0].name}.
        Here are the details:
      </p>

      <div>
        <p>Item: {data.order.items[0].name}</p>
        <p>Unit Price: {data.order.items[0].price}</p>
        <p>Quantity: {data.order.items[0].quantity}</p>
      </div>

      <div>
        <p>Subtotal: {data.order.subtotal}</p>
        <p>Shipping: {data.order.shipping}</p>
        <p>Total Amount: {data.order.total}</p>

        <p>Fee: {data.order.fee}</p>
        <p>You Will Earn: {data.profit}</p>
      </div>

      <div>
        <p>
          You should now ship the products to {data.user_name}. The shipping address can be found in the order details.
          Once you have shipped the order, don’t forget to mark it as shipped in the order details to receive your
          payment. If the order is not marked as shipped within two weeks, it will automatically expire, and you won’t
          receive any payment. Best regards, The Mercur Team mercurjs.com
        </p>
      </div>
    </div>
  )
}
