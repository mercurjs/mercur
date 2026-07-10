'use client';

import { usePathname, useRouter } from 'next/navigation';

import { SelectField } from '@/components/molecules';

const selectOptions = [
  { label: 'Newest', value: 'created_at' },
  { label: 'Price: Low to High', value: 'price_asc' },
  { label: 'Price: High to Low', value: 'price_desc' }
];

export const ProductListingHeader = ({ total }: { total: number }) => {
  const router = useRouter();
  const pathname = usePathname();

  const selectOptionHandler = (value: string) => {
    router.push(`${pathname}?sortBy=${value}`);
  };

  return (
    <div
      className="flex w-full items-center justify-between"
      data-testid="product-listing-header"
    >
      <div data-testid="product-listing-total">{total} listings</div>
      {/* <div className='hidden md:flex gap-2 items-center'>
        Sort by:{' '}
        <SelectField
          className='min-w-[200px]'
          options={selectOptions}
          selectOption={selectOptionHandler}
          data-testid="product-listing-sort-dropdown"
        />
      </div> */}
    </div>
  );
};
