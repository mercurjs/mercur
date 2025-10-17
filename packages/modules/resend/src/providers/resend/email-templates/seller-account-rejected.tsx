export const SellerAccountRejectedEmailTemplate: React.FC = () => {
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
        We regret to inform you that your account application has been rejected.
      </h1>
      <p style={{ fontSize: '1.1rem', marginBottom: 16 }}>
        We appreciate the effort you put into your application and thank you for considering our platform.
        Unfortunately, after a careful review, we have determined that your application does not meet our current
        requirements.
      </p>
      <p style={{ fontSize: '1.1rem', marginBottom: 24 }}>
        If you have any questions or need further clarification, please don’t hesitate to reach out to us. We’re here to
        assist you.
      </p>
      <div style={{ fontSize: 13, color: '#888', marginBottom: 24 }}>
        You received this email because you applied as a seller on the Mercur marketplace.<br />
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