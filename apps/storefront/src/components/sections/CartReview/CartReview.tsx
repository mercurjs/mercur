'use client';

import { CartSummary } from '@/components/organisms';
import { PromoCode } from '@/components/organisms/PromoCode/PromoCode';

import { CartItems } from './CartItems';
import PaymentButton from './PaymentButton';

const Review = ({ cart }: { cart: any }) => {
  const paidByGiftcard = cart?.gift_cards && cart?.gift_cards?.length > 0 && cart?.total === 0;

  // Every seller in the cart must have a shipping method. The backend enforces
  // one method per seller, so covering each seller means one method per seller.
  const cartSellerCount = new Set(
    (cart?.items ?? [])
      .map((item: any) => item.offer?.seller_id)
      .filter(Boolean)
  ).size;
  const allSellersHaveShipping =
    cart.shipping_methods.length > 0 &&
    cart.shipping_methods.length >= cartSellerCount;

  const previousStepsCompleted =
    cart.shipping_address &&
    allSellersHaveShipping &&
    (cart.payment_collection || paidByGiftcard);

  return (
    <div>
      <div className="mb-6 w-full">
        <CartItems cart={cart} />
      </div>

      <div className={'mb-6'}>
        <PromoCode cart={cart} />
      </div>

      <div className="mb-6 w-full rounded-sm border p-4">
        <CartSummary
          item_total={cart?.item_subtotal || 0}
          shipping_total={cart?.shipping_subtotal || 0}
          total={cart?.total || 0}
          currency_code={cart?.currency_code || ''}
          tax={cart?.tax_total || 0}
          discount_total={cart?.discount_total || 0}
        />
      </div>

      {previousStepsCompleted && (
        <PaymentButton
          cart={cart}
          data-testid="submit-order-button"
        />
      )}
    </div>
  );
};

export default Review;
