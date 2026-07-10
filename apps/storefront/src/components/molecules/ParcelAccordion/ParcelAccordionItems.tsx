'use client';

import { useEffect, useRef, useState } from 'react';

import { Card } from '@/components/atoms';
import { OrderProductListItem } from '@/components/cells';
import { CollapseIcon } from '@/icons';
import { convertToLocale } from '@/lib/helpers/money';
import { parcelStatuses, steps } from '@/lib/helpers/parcel-statuses';
import { cn } from '@/lib/utils';

export const ParcelAccordionItems = ({
  order,
  currency_code,
  shippingPriceTestId
}: {
  order: any;
  index: number;
  currency_code: string;
  shippingPriceTestId?: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [height, setHeight] = useState(0);

  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTimeout(() => {
      if (contentRef.current) {
        setHeight(contentRef.current.scrollHeight);
      }
    }, 100);
  }, []);

  const openHandler = () => {
    setIsOpen(prev => !prev);
  };

  const status = parcelStatuses(order.fulfillment_status);

  const totalItems = order.items.reduce((acc: number, item: any) => acc + item.quantity, 0);

  return (
    <Card
      key={order.id}
      className="rounded-sm border-b p-0"
    >
      <div
        className="grid cursor-pointer grid-cols-2 p-4 transition-all duration-300 hover:bg-component-secondary/40 sm:grid-cols-7"
        onClick={openHandler}
      >
        <p className="label-md col-span-3">
          Order #{order.display_id}:{' '}
          <span className="font-semibold uppercase text-primary">{steps[status]}</span>
        </p>
        <p className="label-md col-span-2 px-2">
          Seller: <span className="font-semibold text-primary">{order.seller.name}</span>
        </p>
        <p className="label-md col-span-2 px-2 text-center">
          Shipping:{' '}
          <span
            className="font-semibold text-primary"
            data-testid={shippingPriceTestId}
          >
            {convertToLocale({ amount: order.shipping_total, currency_code })}
          </span>
        </p>

        <div className="flex items-center justify-end gap-4">
          <p className="label-md">
            {totalItems > 1 ? `${totalItems} Items` : `${totalItems} Item`}
          </p>
          <CollapseIcon
            size={20}
            className={cn('mt-0.5 flex-none transition-all duration-300', isOpen && 'rotate-180')}
          />
        </div>
      </div>
      <div
        ref={contentRef}
        className={cn('overflow-hidden transition-all duration-300')}
        style={{
          maxHeight: isOpen ? `${height}px` : '0px',
          opacity: isOpen ? 1 : 0,
          transition: 'max-height 0.3s ease-in-out, opacity 0.2s ease-in-out'
        }}
      >
        <div className="p-4">
          {order.items.map((item: any) => (
            <OrderProductListItem
              key={item.id + item.variant_id}
              item={item}
              currency_code={currency_code}
            />
          ))}
        </div>
      </div>
    </Card>
  );
};
