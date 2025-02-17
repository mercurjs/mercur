interface EmailTemplateProps {
  data: {
		host: string,
		resetPasswordToken: string
	}
}

export const ForgotPasswordEmailTemplate: React.FC<Readonly<EmailTemplateProps>> = ({ data }) => {
  return (
    <div>
      <h1>Have you forgotten your password?</h1>
      <p>
        We have received a request to reset the password for your Mercur account. Please click the button below to set a
        new password. Please note, the link is valid for the next 24 hours only.
      </p>
      <div>
        <a href={`${data.host}/resetPassword?resetPasswordToken=${data.resetPasswordToken}`}>
          <button>Reset Password</button>
        </a>
      </div>
      <p>If you did not request this change, please ignore this email. Best regards, The Mercur Team</p>
      <p>mercur.js</p>
    </div>
  )
}
