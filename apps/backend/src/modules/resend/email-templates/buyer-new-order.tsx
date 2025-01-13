interface EmailTemplateProps {
  data: {
		user_name: string,
		host: string,
		order_id: string,
		order: {
			display_id: string,
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

export const BuyerNewOrderEmailTemplate: React.FC<Readonly<EmailTemplateProps>> = ({ data }) => {
  return (
    <div>
      <h1>
        Thank you for your order, {data.user_name}
        Your order #{data.order.display_id} has been placed!
      </h1>
      <p>
        Thank you for placing order #{data.order.display_id}. We have received a total of {data.order.item_total}.
      </p>
      <p>
        <a href=''>Order details</a>
        If you can’t click the button, no worries! Here’s your link: {data.host}/orders/{data.order_id}
        Here’s the breakdown:
      </p>
      <table>
        <thead>
          <tr>
            <th>Product</th>
            <th style={{ textAlign: 'left', padding: '10px' }} />
            <th style={{ textAlign: 'right', padding: '10px' }}>Amount</th>
            <th style={{ textAlign: 'right', padding: '10px' }}>Qty</th>
            <th style={{ textAlign: 'right', padding: '10px' }}>Total</th>
          </tr>
        </thead>
        <tbody style={{ fontSize: '15px !important' }}>
          {data.order.items.map((item: any, index: number) => (
            <tr key={index}>
              <td>
                <img
                  src={item.thumbnail}
                  alt={`Thumbnail of ${item.product_title}`}
                  style={{
                    width: '50px',
                    height: '50px',
                    objectFit: 'cover'
                  }}
                />
              </td>
              <td>
                <p>{item.product_title}</p>
                <p>Variant: {item.variant_title}</p>
              </td>
              <td>
                {item.unit_price} {data.order.currency_code}
              </td>
              <td>{item.quantity}</td>
              <td>
                {item.unit_price * item.quantity} {data.order.currency_code}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td>Items:</td>
            <td>
              {data.order.item_total} {data.order.currency_code}
            </td>
          </tr>
          <tr>
            <td>Delivery:</td>
            <td>
              {data.order.shipping_methods[0].amount} {data.order.currency_code}
            </td>
          </tr>
          <tr>
            <td>Total:</td>
            <td>
              {data.order.total} {data.order.currency_code}
            </td>
          </tr>
        </tfoot>
      </table>
      <div>
        <div>
          <p>
            <strong>Shipping address:</strong>
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
        <div>
          <p>
            <strong>Delivery method:</strong>
          </p>
          <p>{data.order.shipping_methods[0].name}</p>
        </div>
      </div>
      <div>
        <p>
          You received this email because you made a purchase or sale on the Mercur marketplace. If you have any
          questions, please contact our support team. Best regards, The Mercur Team mercurjs.com
        </p>
      </div>
    </div>
  )
}
