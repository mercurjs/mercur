interface EmailTemplateProps {
  data: any
}

export const VendorCanceledOrderEmailTemplate: React.FC<Readonly<EmailTemplateProps>> = ({ data }) => {
  return (
    <div>
      <h1>
        An order #{data.order.display_id} for {data.order.item.name} has been cancelled.
      </h1>
      <p>
        The Mercur Support Team has cancelled an order for {data.order.item.name} from {data.userName}. If you have any
        questions, please contact our support team.
      </p>
      <p>Best regards, The Mercur Team</p>
      <p>mercur.js</p>
    </div>
  )
}
