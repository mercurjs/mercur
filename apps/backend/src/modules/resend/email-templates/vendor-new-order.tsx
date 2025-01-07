interface EmailTemplateProps {
  data: any
}

export const VendorNewOrderEmailTemplate: React.FC<Readonly<EmailTemplateProps>> = ({ data }) => {
  return (
    <div>
      <h1>
        {data.userName} has placed an order for {data.order.item}
      </h1>
      <p>
        New Order #{data.order.display_id} for {data.order.item}.{data.userName} has just ordered {data.order.item}.
        Here are the details:
      </p>

      <div>
        <p>Item: {data.order.item}</p>
        <p>Unit Price: {data.order.item.price}</p>
        <p>Quantity: {data.order.item.quantity}</p>
      </div>

      <div>
        <p>Subtotal: {data.order.subtotal}</p>
        <p>Shipping: {data.order.shipping}</p>
        <p>Total Amount: {data.order.total}</p>

        <p>Fee: {data.order.fee}</p>
        <p>You Will Earn: {data.profit}</p>
      </div>

      <div>
        <p>
          You should now ship the products to {data.userName}. The shipping address can be found in the order details.
          Once you have shipped the order, don’t forget to mark it as shipped in the order details to receive your
          payment. If the order is not marked as shipped within two weeks, it will automatically expire, and you won’t
          receive any payment. Best regards, The Mercur Team mercurjs.com
        </p>
      </div>
    </div>
  )
}
