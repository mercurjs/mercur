interface EmailTemplateProps {
  data: {
		user_name: string,
	}
}

export const SellerAccountSubmissionEmailTemplate: React.FC<Readonly<EmailTemplateProps>> = ({ data }) => {
  return (
    <div style={{
      maxWidth: 600,
      margin: '0 auto',
      fontFamily: 'Arial, sans-serif',
      color: '#222',
      background: '#fff',
      padding: 24,
      borderRadius: 10
    }}>
      <h1>Hello, {data.user_name} 👋</h1>
      <p>We are thrilled about your interest in collaborating with us.</p>
      <p>
        Your application is currently being reviewed by our team. Please expect a response within [three] business days.
        If your submission meets our criteria and is accepted, you will receive a confirmation email from us.
      </p>
      <p>
        In the meantime, if you have any questions or need further assistance, feel free to reach out to us.
      </p>
      <div style={{ marginTop: 32 }}>
        <div>Best regards,</div>
        <div style={{ fontWeight: 600 }}>The Mercur Team</div>
        <div style={{ color: '#888', marginTop: 4 }}>mercur.js</div>
      </div>
    </div>
  )
}
