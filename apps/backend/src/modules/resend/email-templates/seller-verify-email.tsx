interface EmailTemplateProps {
  data: {
		user_name: string
		link: string
	}
}

export const SellerEmailVerifyEmailTemplate: React.FC<Readonly<EmailTemplateProps>> = ({ data }) => {
  return (
    <div>
      <h1>
        Hello, {data.user_name} 👋
        <br />
        Thank you for submiting your account to Mercur Marketplace
      </h1>
      <p>
        Before we proceed with account submission there is but one last thing to do - verify your email.
				Please <a href={data.link}>click here</a> to verify your email.
      </p>
      <p>Thank you for choosing us. We are excited about you joining us and will support you every step of the way.</p>
      <p>Best regards, The Mercur Team</p>
      <p>mercur.js</p>
    </div>
  )
}
