interface EmailTemplateProps {
  data: {
		url: string,
	}
}

export const ForgotPasswordEmailTemplate: React.FC<Readonly<EmailTemplateProps>> = ({ data }) => {
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
      <h1>Have you forgotten your password?</h1>
      <p>
        We have received a request to reset the password for your Mercur account. Please click the button below to set a
        new password. Please note, the link is valid for the next 24 hours only.
      </p>
      <div>
        <a href={`${data.url}`}>
          <button>Reset Password</button>
        </a>
      </div>
      <p>If you did not request this change, please ignore this email.</p>
      <div style={{ marginTop: 32 }}>
        <div>Best regards,</div>
        <div style={{ fontWeight: 600 }}>The Mercur Team</div>
        <div style={{ color: '#888', marginTop: 4 }}>mercurjs.com</div>
      </div>
    </div>
  )
}
