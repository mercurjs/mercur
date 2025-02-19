interface EmailTemplateProps {
  data: {
		host: string,
		order: {
			id: string,
			item: any
		}
	}
}

export const BuyerCancelOrderEmailTemplate: React.FC<Readonly<EmailTemplateProps>> = ({ data }) => {
  return (
    <div>
      <h1>
        Your order has been cancelled. The support team at Mercur has cancelled your order for {data.order.item}. You
        will receive a full refund.
      </h1>
      <p>If you have any questions, please contact Mercur Support.</p>
      <p>
        <a href={`${data.host}/orders/${data.order.id}`}>Order Details</a>
        If you can’t click the button, no worries! Here’s your link: {`${data.host}/orders/${data.order.id}`}
        You received this email because you made a purchase or sale on the Mercur marketplace. If you have any
        questions, please contact our support team.
      </p>
      <p>Best regards, The Mercur Team</p>
      <p>mercur.js</p>
    </div>
  )
}
