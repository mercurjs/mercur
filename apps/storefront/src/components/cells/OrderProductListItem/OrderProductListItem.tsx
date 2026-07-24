import { Fragment } from 'react';

import Image from 'next/image';

import { Divider } from '@/components/atoms';
import LocalizedClientLink from '@/components/molecules/LocalizedLink/LocalizedLink';
import { convertToLocale } from '@/lib/helpers/money';
import { cn } from '@/lib/utils';

export const OrderProductListItem = ({
  item,
  currency_code,
  withDivider
}: {
  item: any;
  currency_code: string;
  withDivider?: boolean;
}) => (
  <Fragment>
    {withDivider && <Divider className="mt-4" />}
    <li className={cn('flex items-center', withDivider && 'mt-2')}>
      <div className="mb-2 grid w-full grid-cols-1 sm:grid-cols-7 sm:gap-4">
        <div className="flex items-center gap-2 sm:col-span-2">
          <div className="relative flex h-16 w-[66px] items-center justify-center overflow-hidden rounded-sm">
            {item.thumbnail ? (
              <Image
                src={item.thumbnail}
                alt={item.title}
                width={66}
                height={66}
                className="object-cover"
              />
            ) : (
              <Image
                src={'/images/placeholder.svg'}
                alt={item.title}
                width={45}
                height={45}
                className="opacity-25"
              />
            )}
          </div>
          <p className="label-md text-secondary">{item.product_title}</p>
          <LocalizedClientLink
            href={`/products/${item.variant?.product?.handle}`}
            target="_blank"
            className="heading-xs text-primary"
          >
            {item.variant?.product?.title}
          </LocalizedClientLink>
        </div>
        <div className="flex items-center sm:col-span-2">
          <p className="label-md text-secondary">
            {`Variant: `}
            <span className="text-primary">{item?.variant_title || item?.variant?.title}</span>
          </p>
        </div>
        <div className="flex items-center justify-center sm:col-span-2">
          <p className="label-md text-secondary">
            {`Quantity: `}
            <span className="text-primary">{item?.quantity}</span>
          </p>
        </div>
        <div className="label-lg flex text-primary sm:items-center sm:justify-end">
          {convertToLocale({
            amount: item.total || (item.unit_price ?? 0) * (item.quantity ?? 1),
            currency_code: currency_code
          })}
        </div>
      </div>
    </li>
  </Fragment>
);
