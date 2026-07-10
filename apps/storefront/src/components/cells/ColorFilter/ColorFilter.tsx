'use client';

import {
  Accordion,
  FilterCheckboxOption,
} from '@/components/molecules';
import { cn } from '@/lib/utils';
import useFilters from '@/hooks/useFilters';

const colorFilters = [
  {
    label: 'Black',
    amount: 40,
    color: 'bg-[rgba(9,9,9,1)]',
  },
  {
    label: 'Grey',
    amount: 78,
    color: 'bg-[rgba(82,82,82,1)]',
  },
  {
    label: 'White',
    amount: 7,
    color: 'bg-[rgba(255,255,255,1)]',
  },
  {
    label: 'Yellow',
    amount: 7,
    color: 'bg-[rgba(255,191,58,1)]',
  },
  {
    label: 'Red',
    amount: 16,
    color: 'bg-[rgba(217,45,32,1)]',
  },
  {
    label: 'Orange',
    amount: 0,
    color: 'bg-[rgba(247,144,9,1)]',
  },
  {
    label: 'Blue',
    amount: 46,
    color: 'bg-[rgba(77,160,255,1)]',
  },
  {
    label: 'Navi',
    amount: 87,
    color: 'bg-[rgba(0,67,143,1)]',
  },
  {
    label: 'Green',
    amount: 32,
    color: 'bg-[rgba(23,163,74,1)]',
  },
  {
    label: 'Multi',
    amount: 6,
    color: 'multi-gradient',
  },
];

export const ColorFilter = () => {
  const { updateFilters, isFilterActive } =
    useFilters('color');

  const selectHandler = (option: string) => {
    updateFilters(option);
  };

  return (
    <Accordion heading='Color' data-testid="filter-color">
      <ul className='px-4' data-testid="filter-color-options">
        {colorFilters.map(({ label, amount, color }) => (
          <li
            key={label}
            className='mb-4 flex items-center justify-between'
          >
            <FilterCheckboxOption
              checked={isFilterActive(label)}
              disabled={Boolean(!amount)}
              onCheck={selectHandler}
              label={label}
              amount={amount}
              data-testid={`filter-color-checkbox-${label.toLowerCase()}`}
            />
            <div
              className={cn(
                'w-5 h-5 border border-primary rounded-xs',
                color,
                Boolean(!amount) && 'opacity-30'
              )}
            />
          </li>
        ))}
      </ul>
    </Accordion>
  );
};
