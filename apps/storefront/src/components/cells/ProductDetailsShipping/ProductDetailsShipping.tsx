import { ProductPageAccordion } from '@/components/molecules';

export const ProductDetailsShipping = () => {
  return (
    <ProductPageAccordion
      heading='Shipping & Returns'
      defaultOpen={false}
    >
      <div className='product-details'>
        <ul>
          <li>
            Free standard shipping on all orders within the
            continental U.S. Expedited shipping options are
            available at an additional cost. Orders
            typically ship within 3-5 business days.
          </li>
          <li>
            We offer a 30-day return policy. If you are not
            completely satisfied with your purchase, you can
            return the chair for a full refund or exchange,
            provided it is in its original condition and
            packaging.
          </li>
        </ul>
      </div>
    </ProductPageAccordion>
  );
};
