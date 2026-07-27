import { convertToLocale } from '@/lib/helpers/money';

export const CartItemsFooter = ({
  currency_code,
  price,
}: {
  currency_code: string;
  price: number;
}) => {
  return (
    <div className='border rounded-sm p-4 flex items-center justify-between label-md'>
      <p className='text-secondary'>Delivery</p>
      <p>
        {convertToLocale({
          amount: price / 1,
          currency_code,
        })}
      </p>
    </div>
  );
};
