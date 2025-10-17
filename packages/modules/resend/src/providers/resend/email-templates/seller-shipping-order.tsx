interface EmailTemplateProps {
  data: {
		user_name: string,
		host: string,
		order_id: string,
		order: {
			id: string,
			display_id: string,
			trackingNumber: string,
			items: any[],
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

export const SellerOrderShippingEmailTemplate: React.FC<Readonly<EmailTemplateProps>> = ({ data }) => {
  return (
    <div>
      <h1>The order #{data.order.display_id} has been marked as shipped.</h1>
      <p>
        <div>
          <p>
            <strong>Delivery Address:</strong>
          </p>
          <p>
            {data.order.shipping_address.first_name} {data.order.shipping_address.last_name}
            ,<br />
            {data.order.shipping_address?.company ? `${data.order.shipping_address.company}, ` : ''}
            {data.order.shipping_address.address_1}
            {data.order.shipping_address.address_2}, {data.order.shipping_address.postal_code}{' '}
            {data.order.shipping_address.city}
            {data.order.shipping_address.province ? `, ${data.order.shipping_address.province}` : ''}
            <br />
            {data.order.email}, {data.order.shipping_address.phone}
          </p>
        </div>
      </p>
      <p>Thank you for updating the status of the order. If you have any questions, please contact our support team.</p>
      <div style={{ marginTop: 32 }}>
        <div>Best regards,</div>
        <div style={{ fontWeight: 600 }}>The Mercur Team</div>
        <div style={{ color: '#888', marginTop: 4 }}>mercurjs.com</div>
      </div>
    </div>
  )
}
