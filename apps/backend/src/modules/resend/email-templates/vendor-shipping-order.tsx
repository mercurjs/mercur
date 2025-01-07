interface EmailTemplateProps {
  data: any
}

export const VendorOrderShippingEmailTemplate: React.FC<Readonly<EmailTemplateProps>> = ({ data }) => {
  return (
    <div>
      <h1>
				The order #{data.order.display_id} has been marked as shipped.
      </h1>
      <p>
			<div>
          <p>
            <strong>Delivery Address:</strong>
          </p>
          <p>
            {data.order.shipping_address.first_name} {data.order.shipping_address.last_name}
            ,<br />
            {data.order.shipping_address?.company ? `${data.order.shipping_address.company}, ` : ''}
            {data.order.shipping_address.address_1}
            {data.order.shipping_address.address_2}, {data.order.shipping_address.postal_code}{' '}
            {data.order.shipping_address.city}
            {data.order.shipping_address.province
              ? `, ${data.order.shipping_address.province}`
              : ''}
            <br />
            {data.order.email}, {data.order.shipping_address.phone}
          </p>
        </div>
      </p>
			<p>
				Thank you for updating the status of the order.
				If you have any questions, please contact our support team.
			</p>
			<p>
				Best regards,
				The Mercur Team
			</p>
			<p>
				mercur.js
			</p>
    </div>
  );
};
