interface EmailTemplateProps {
  data: any
}

export const BuyerOrderShippedEmailTemplate: React.FC<Readonly<EmailTemplateProps>> = ({ data }) => {
  return (
    <div>
      <h1>Your order #{data.order.trackingNumber} has been shipped!</h1>
      <p>The package is on its way and will be in your hands soon.</p>
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
      <p>
        <a href={`${data.host}/orders/${data.order.id}`}>View Order Details</a>
        If you can’t click the button, no worries! Here’s your link: {`${data.host}/orders/${data.order.id}`}
      </p>

      <p>
        You received this email because you made a purchase or sale on the Mercur marketplace. If you have any
        questions, please contact our support team. Best regards, The Mercur Team mercurjs.com
      </p>
    </div>
  )
}
