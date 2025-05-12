interface EmailTemplateProps {
  data: {
    order: {
      id: string,
      display_id: number | string,
      items: any[],
      customer: {
        first_name: string,
        last_name: string,
        id: string
      },
      seller: {
        email: string,
        name: string,
        id: string
      }
    }
  }
}

export const SellerNewOrderEmailTemplate: React.FC<Readonly<EmailTemplateProps>> = ({ data }) => {
  const { order } = data;

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
        Hello, {order.seller.name}!
        <br />
        You have received a new order!
      </h1>
      <p style={{ fontSize: '1.1rem', marginBottom: 24 }}>
        Order <b>#{order.display_id}</b> has just been placed by {order.customer.first_name} {order.customer.last_name}.
      </p>
      <h3 style={{ marginTop: 32, marginBottom: 12 }}>Order items:</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 32 }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #eee' }}>Product</th>
            <th style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #eee' }}>Amount</th>
            <th style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #eee' }}>Qty</th>
            <th style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #eee' }}>Total</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item: any, idx: number) => (
            <tr key={item.id || idx} style={{ borderBottom: '1px solid #f3f3f3' }}>
              <td style={{ padding: '12px 8px', verticalAlign: 'top' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  {item.thumbnail && (
                    <img
                      src={item.thumbnail}
                      alt={item.product_title}
                      style={{
                        width: 48,
                        height: 48,
                        objectFit: 'cover',
                        borderRadius: 6,
                        marginRight: 12,
                        border: '1px solid #eee'
                      }}
                    />
                  )}
                  <div>
                    <div style={{ fontWeight: 600 }}>{item.product_title}</div>
                    <div style={{ fontSize: 13, color: '#555' }}>
                      Variant: {item.variant_title}
                    </div>
                  </div>
                </div>
              </td>
              <td style={{ textAlign: 'right', padding: '12px 8px', verticalAlign: 'top' }}>
                {item.unit_price} eur
              </td>
              <td style={{ textAlign: 'right', padding: '12px 8px', verticalAlign: 'top' }}>
                {item.quantity}
              </td>
              <td style={{ textAlign: 'right', padding: '12px 8px', verticalAlign: 'top' }}>
                {item.unit_price * item.quantity} eur
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ fontSize: 13, color: '#888', marginBottom: 24 }}>
        You received this email because you are a seller on the Mercur marketplace.<br />
        If you have any questions, please contact our support team.
      </div>
      <div style={{ marginTop: 32 }}>
        <div>Best regards,</div>
        <div style={{ fontWeight: 600 }}>The Mercur Team</div>
        <div style={{ color: '#888', marginTop: 4 }}>mercur.js</div>
      </div>
    </div>
  );
};