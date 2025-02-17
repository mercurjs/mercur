interface EmailTemplateProps {
  data: {
		user_name: string
	}
}

export const BuyerAccountCreatedEmailTemplate: React.FC<Readonly<EmailTemplateProps>> = ({ data }) => {
  return (
    <div>
      <h1>Hello, {data.user_name}</h1>
      <p>Welcome to Mercur! We’re excited to have you join us on this journey.</p>
      <p>Best regards, The Mercur Team</p>
      <p>mercur.js</p>
    </div>
  )
}
