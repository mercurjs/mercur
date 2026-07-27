'use client';

import {
  Accordion,
  FilterCheckboxOption,
} from '@/components/molecules';
import { StarRating } from '@/components/atoms';
import { cn } from '@/lib/utils';
import useFilters from '@/hooks/useFilters';

const filters = [
  { label: '5', amount: 40 },
  { label: '4', amount: 78 },
  { label: '3', amount: 0 },
  { label: '2', amount: 0 },
  { label: '1', amount: 0 },
];

export const SellerRatingFilter = () => {
  const { updateFilters, isFilterActive } =
    useFilters('seller_rating');

  const selectHandler = (option: string) => {
    updateFilters(option);
  };

  return (
    <Accordion heading='Seller Rating'>
      <ul className='px-4'>
        {filters.map(({ label, amount }) => (
          <li
            key={label}
            className={cn(
              'mb-4 flex items-center gap-2',
              !Boolean(amount)
                ? 'cursor-default'
                : 'cursor-pointer'
            )}
            onClick={() =>
              Boolean(amount) ? selectHandler(label) : null
            }
          >
            <FilterCheckboxOption
              checked={isFilterActive(label)}
              disabled={!Boolean(amount)}
              label={label}
            />
            <StarRating
              rate={+label}
              disabled={!Boolean(amount)}
            />
            <span className='label-sm !font-light'>
              ({amount})
            </span>
          </li>
        ))}
      </ul>
    </Accordion>
  );
};
