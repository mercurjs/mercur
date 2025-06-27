interface EmailTemplateProps {
  data: {
    product_title: string
  }
}

export const SellerProductRejectedEmailTemplate: React.FC<Readonly<EmailTemplateProps>> = ({ data }) => {
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
        Hello <span role="img" aria-label="wave">👋</span>
      </h1>
      <h1 style={{ fontSize: '2rem', marginBottom: 8 }}>
        We regret to inform you that your product {data.product_title} has been rejected.
      </h1>
      <div style={{ marginTop: 32 }}>
        <div>Best regards,</div>
        <div style={{ fontWeight: 600 }}>The Mercur Team</div>
        <div style={{ color: '#888', marginTop: 4 }}>mercur.js</div>
      </div>
    </div>
  )
}