interface EmailTemplateProps {
  data: {
		user_name: string,
		host: string,
		order_id: string,
		order: {
			id: string,
			display_id: string,
			trackingNumber: string,
			items: {
				name: string
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

export const SellerCanceledOrderEmailTemplate: React.FC<Readonly<EmailTemplateProps>> = ({ data }) => {
  return (
    <div>
      <h1>
        An order #{data.order.display_id} for {data.order.items[0].name} has been cancelled.
      </h1>
      <p>
        The Mercur Support Team has cancelled an order for {data.order.items[0].name} from {data.user_name}. If you have any
        questions, please contact our support team.
      </p>
      <p>Best regards, The Mercur Team</p>
      <p>mercur.js</p>
    </div>
  )
}
