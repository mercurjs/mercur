interface EmailTemplateProps {
  data: {
    seller: {
      email: string;
      name: string;
    };
    payouts: {
      id: string;
      created_at: Date;
      amount: number;
      currency_code: string;
      order: {
        id: string;
        display_id: number;
        created_at: Date;
      };
    }[];
  };
}

export const SellerPayoutSummaryEmailTemplate: React.FC<
  Readonly<EmailTemplateProps>
> = ({ data }) => {
  const { seller, payouts } = data;

  return (
    <div
      style={{
        maxWidth: 600,
        margin: "0 auto",
        fontFamily: "Arial, sans-serif",
        color: "#222",
        background: "#fff",
        padding: 24,
        borderRadius: 10,
      }}
    >
      <h1 style={{ fontSize: "2rem", marginBottom: 8 }}>
        Hello, {seller.name}!
        <br />
        You have received new transfers to your Stripe account!
      </h1>
      <h3 style={{ marginTop: 32, marginBottom: 12 }}>Transfer list:</h3>
      <table
        style={{ width: "100%", borderCollapse: "collapse", marginBottom: 32 }}
      >
        <thead>
          <tr>
            <th
              style={{
                textAlign: "left",
                padding: "8px",
                borderBottom: "1px solid #eee",
              }}
            >
              Order
            </th>
            <th
              style={{
                textAlign: "right",
                padding: "8px",
                borderBottom: "1px solid #eee",
              }}
            >
              Amount
            </th>
            <th
              style={{
                textAlign: "right",
                padding: "8px",
                borderBottom: "1px solid #eee",
              }}
            >
              Date
            </th>
          </tr>
        </thead>
        <tbody>
          {payouts.map((payout, idx) => (
            <tr key={idx} style={{ borderBottom: "1px solid #f3f3f3" }}>
              <td style={{ padding: "12px 8px", verticalAlign: "top" }}>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <div style={{ fontWeight: 600 }}>
                    Order #{payout.order.display_id}
                  </div>
                </div>
              </td>
              <td
                style={{
                  textAlign: "right",
                  padding: "12px 8px",
                  verticalAlign: "top",
                }}
              >
                {payout.amount} {payout.currency_code}
              </td>
              <td
                style={{
                  textAlign: "right",
                  padding: "12px 8px",
                  verticalAlign: "top",
                }}
              >
                {payout.order.created_at.toISOString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ fontSize: 13, color: "#888", marginBottom: 24 }}>
        You received this email because you are a seller on the Mercur
        marketplace.
        <br />
        If you have any questions, please contact our support team.
      </div>
      <div style={{ marginTop: 32 }}>
        <div>Best regards,</div>
        <div style={{ fontWeight: 600 }}>The Mercur Team</div>
        <div style={{ color: "#888", marginTop: 4 }}>mercur.js</div>
      </div>
    </div>
  );
};
