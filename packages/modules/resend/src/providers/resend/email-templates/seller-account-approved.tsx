interface EmailTemplateProps {
  data: {
    user_name: string
  }
}

export const SellerAccountApprovedEmailTemplate: React.FC<Readonly<EmailTemplateProps>> = ({ data }) => {
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
      <h1 style={{ fontSize: '2rem', marginBottom: 8 }}>
        Hello, {data.user_name} <span role="img" aria-label="wave">👋</span>
        <br />
        <span style={{ fontSize: '1.5rem', fontWeight: 600 }}>Your account has been approved!</span>
      </h1>
      <p style={{ fontSize: '1.1rem', marginBottom: 16 }}>
        We’re happy to let you know that your application has been approved! This means your account is now activated on
        the Mercur marketplace.
      </p>
      <p style={{ fontSize: '1.1rem', marginBottom: 24 }}>
        Thank you for choosing us. We are excited about your success and will support you every step of the way.
      </p>
      <div style={{ fontSize: 13, color: '#888', marginBottom: 24 }}>
        You received this email because you registered as a seller on the Mercur marketplace.<br />
        If you have any questions, please contact our support team.
      </div>
      <div style={{ marginTop: 32 }}>
        <div>Best regards,</div>
        <div style={{ fontWeight: 600 }}>The Mercur Team</div>
        <div style={{ color: '#888', marginTop: 4 }}>mercur.js</div>
      </div>
    </div>
  )
}