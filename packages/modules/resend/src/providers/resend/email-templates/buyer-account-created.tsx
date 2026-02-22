interface EmailTemplateProps {
  data: {
    user_name: string;
    store_name: string;
    storefront_url: string;
  };
}

export const BuyerAccountCreatedEmailTemplate: React.FC<
  Readonly<EmailTemplateProps>
> = ({ data }) => {
  return (
    <div
      style={{
        maxWidth: "480px",
        margin: "40px auto",
        padding: "32px 24px",
        borderRadius: "12px",
        background: "#fff",
        boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
        fontFamily: "Arial, sans-serif",
        color: "#222",
      }}
    >
      <h1 style={{ fontSize: "2rem", marginBottom: "16px", color: "#222" }}>
        Welcome to {data.store_name}, {data.user_name}!
      </h1>
      <p style={{ fontSize: "1.1rem", marginBottom: "24px" }}>
        We’re excited to have you join us on this journey.
        <br />
        Your account has been created successfully.
      </p>
      <a
        href={data.storefront_url}
        style={{
          display: "inline-block",
          padding: "12px 28px",
          background: "#222",
          color: "#fff",
          borderRadius: "6px",
          textDecoration: "none",
          fontWeight: 600,
          marginBottom: "32px",
        }}
      >
        Visit {data.store_name}
      </a>
      <div style={{ marginTop: 32 }}>
        <div>Best regards,</div>
        <div style={{ fontWeight: 600 }}>The {data.store_name} Team</div>
        <div style={{ color: "#888", marginTop: 4 }}>{data.storefront_url}</div>
      </div>
    </div>
  );
};
