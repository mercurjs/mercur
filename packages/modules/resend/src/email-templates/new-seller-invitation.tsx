interface EmailTemplateProps {
  data: {
    url: string
  }
}

export const NewSellerInviteEmailTemplate: React.FC<Readonly<EmailTemplateProps>> = ({ data }) => {
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
      <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>
        You are invited to sell on MercurJS!
      </h1>
      <p style={{ fontSize: '1.1rem', marginBottom: '16px' }}>
        To join the platform, please accept the invitation.<br />
      </p>
      <div style={{ marginBottom: 24 }}>
      <a
          href={`${data.url}`}
          style={{
            display: 'inline-block',
            padding: '10px 24px',
            background: '#222',
            color: '#fff',
            borderRadius: 6,
            textDecoration: 'none',
            fontWeight: 600,
            marginBottom: 8
          }}
        >
          Accept Invitation
        </a>
        <div style={{ fontSize: 13, color: '#555', marginTop: 8 }}>
          If you can’t click the button, here’s your link: <br />
          <span style={{ color: '#0070f3' }}>{`${data.url}`}</span>
        </div>
      </div>
      <div style={{ fontSize: 13, color: '#888', marginBottom: 24 }}>
        You received this email because you were invited to join the Mercur marketplace.<br />
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