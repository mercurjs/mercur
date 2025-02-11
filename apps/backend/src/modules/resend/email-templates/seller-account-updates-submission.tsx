interface EmailTemplateProps {
  data: {
		user_name: string,
	}
}

export const SellerAccountSubmissionEmailTemplate: React.FC<Readonly<EmailTemplateProps>> = ({ data }) => {
  return (
    <div>
      <h1>Hello, {data.user_name} 👋</h1>
      <p>We are thrilled about your interest in collaborating with us.</p>
      <p>
        Your application is currently being reviewed by our team. Please expect a response within [three] business days.
        If your submission meets our criteria and is accepted, you will receive a confirmation email from us.
      </p>
      <p>
        In the meantime, if you have any questions or need further assistance, feel free to reach out to us. Best
        regards, The Mercur Team
      </p>
      <p>mercur.js</p>
    </div>
  )
}
