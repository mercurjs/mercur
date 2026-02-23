interface EmailTemplateProps {
  data: {
    user_name: string
    order: {
      id: string
      display_id: string
      items: any[]
      currency_code: string
      shipping_methods: {
        amount: number
        name: string
      }[]
      total: number
      email: string
      shipping_address: {
        first_name: string
        last_name: string
        company: string
        address_1: string
        address_2: string
        city: string
        province: string
        postal_code: string
        phone: string
      }
    }
    accept_url: string
    decline_url: string
    store_name: string
    storefront_url: string
  }
}

export const BuyerOrderTransferRequestEmailTemplate: React.FC<
  Readonly<EmailTemplateProps>
> = ({ data }) => {
  const { order } = data

  return (
    <div
      style={{
        maxWidth: 600,
        margin: '0 auto',
        fontFamily: 'Arial, sans-serif',
        color: '#222',
        background: '#fff',
        padding: 24,
        borderRadius: 10,
      }}
    >
      <h1 style={{ fontSize: '1.8rem', marginBottom: 8 }}>
        Order Transfer Request
      </h1>
      <p style={{ fontSize: '1.1rem', marginBottom: 24 }}>
        Hi {data.user_name},<br />
        You have been requested to take ownership of order{' '}
        <strong>#{order.display_id}</strong>. Please review the order details
        below and confirm or decline the transfer.
      </p>

      <h3 style={{ marginTop: 32, marginBottom: 12 }}>Order details:</h3>
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          marginBottom: 32,
        }}
      >
        <thead>
          <tr>
            <th
              style={{
                textAlign: 'left',
                padding: '8px',
                borderBottom: '1px solid #eee',
              }}
            >
              Product
            </th>
            <th
              style={{
                textAlign: 'right',
                padding: '8px',
                borderBottom: '1px solid #eee',
              }}
            >
              Price
            </th>
            <th
              style={{
                textAlign: 'right',
                padding: '8px',
                borderBottom: '1px solid #eee',
              }}
            >
              Qty
            </th>
            <th
              style={{
                textAlign: 'right',
                padding: '8px',
                borderBottom: '1px solid #eee',
              }}
            >
              Total
            </th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item: any, index: number) => (
            <tr key={index} style={{ borderBottom: '1px solid #f3f3f3' }}>
              <td style={{ padding: '12px 8px', verticalAlign: 'top' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <img
                    src={item.thumbnail}
                    alt={`Thumbnail of ${item.product_title}`}
                    style={{
                      width: '40px',
                      height: '40px',
                      objectFit: 'cover',
                      marginRight: '10px',
                      borderRadius: '4px',
                      border: '1px solid #eee',
                    }}
                  />
                  <div>
                    <div style={{ fontWeight: 600 }}>{item.product_title}</div>
                    <div style={{ fontSize: '12px', color: '#555' }}>
                      Variant: {item.variant_title}
                    </div>
                  </div>
                </div>
              </td>
              <td
                style={{
                  textAlign: 'right',
                  padding: '12px 8px',
                  verticalAlign: 'top',
                }}
              >
                {item.unit_price} {order.currency_code}
              </td>
              <td
                style={{
                  textAlign: 'right',
                  padding: '12px 8px',
                  verticalAlign: 'top',
                }}
              >
                {item.quantity}
              </td>
              <td
                style={{
                  textAlign: 'right',
                  padding: '12px 8px',
                  verticalAlign: 'top',
                }}
              >
                {item.unit_price * item.quantity} {order.currency_code}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td>
              <b>Delivery:</b>
            </td>
            <td colSpan={3}>
              {order.shipping_methods[0]?.amount ?? 0} {order.currency_code}
            </td>
          </tr>
          <tr>
            <td>
              <b>Total:</b>
            </td>
            <td colSpan={3}>
              {order.total} {order.currency_code}
            </td>
          </tr>
        </tfoot>
      </table>

      <div style={{ marginBottom: 24 }}>
        <div>
          <p style={{ marginBottom: 4 }}>
            <strong>Shipping address:</strong>
            <br />
            {order.shipping_address.first_name}{' '}
            {order.shipping_address.last_name},<br />
            {order.shipping_address?.company
              ? `${order.shipping_address.company}, `
              : ''}
            {order.shipping_address.address_1}
            {order.shipping_address.address_2 &&
              `, ${order.shipping_address.address_2}`}
            , {order.shipping_address.postal_code} {order.shipping_address.city}
            {order.shipping_address.province
              ? `, ${order.shipping_address.province}`
              : ''}
            <br />
            {order.email}, {order.shipping_address.phone}
          </p>
        </div>
        <div>
          <p>
            <strong>Delivery method:</strong>
            <br />
            {order.shipping_methods[0]?.name}
          </p>
        </div>
      </div>

      <div style={{ marginBottom: 32, textAlign: 'center' }}>
        <a
          href={data.accept_url}
          style={{
            display: 'inline-block',
            padding: '12px 32px',
            background: '#16a34a',
            color: '#fff',
            borderRadius: 6,
            textDecoration: 'none',
            fontWeight: 600,
            marginRight: 16,
            fontSize: '1rem',
          }}
        >
          Confirm Transfer
        </a>
        <a
          href={data.decline_url}
          style={{
            display: 'inline-block',
            padding: '12px 32px',
            background: '#dc2626',
            color: '#fff',
            borderRadius: 6,
            textDecoration: 'none',
            fontWeight: 600,
            fontSize: '1rem',
          }}
        >
          Decline Transfer
        </a>
      </div>

      <div style={{ fontSize: 13, color: '#555', marginBottom: 16 }}>
        If you can&apos;t click the buttons above, use these links:
        <br />
        Confirm:{' '}
        <span style={{ color: '#0070f3' }}>{data.accept_url}</span>
        <br />
        Decline:{' '}
        <span style={{ color: '#0070f3' }}>{data.decline_url}</span>
      </div>

      <div style={{ fontSize: 13, color: '#888', marginBottom: 24 }}>
        You received this email because someone requested to transfer an order
        to your account on the {data.store_name} marketplace.
        <br />
        If you did not expect this, you can safely decline the request.
      </div>

      <div style={{ marginTop: 32 }}>
        <div>Best regards,</div>
        <div style={{ fontWeight: 600 }}>The {data.store_name} Team</div>
        <div style={{ color: '#888', marginTop: 4 }}>
          {data.storefront_url}
        </div>
      </div>
    </div>
  )
}
