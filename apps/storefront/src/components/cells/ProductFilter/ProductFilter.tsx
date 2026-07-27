'use client';

import {
  Accordion,
  FilterCheckboxOption,
} from '@/components/molecules';
import useFilters from '@/hooks/useFilters';

const filters = [
  { label: 'Sneakers', amount: 140 },
  { label: 'Boots', amount: 100 },
  { label: 'Flat Shoes', amount: 100 },
  { label: 'High Heels', amount: 31 },
  { label: 'Sandals', amount: 1 },
];

export const ProductFilter = () => {
  const { updateFilters, isFilterActive } =
    useFilters('product');

  const selectHandler = (option: string) => {
    updateFilters(option);
  };

  return (
    <Accordion heading='Product'>
      <ul className='px-4'>
        {filters.map(({ label, amount }) => (
          <li key={label} className='mb-4'>
            <FilterCheckboxOption
              checked={isFilterActive(label)}
              disabled={Boolean(!amount)}
              onCheck={selectHandler}
              label={label}
              amount={amount}
            />
          </li>
        ))}
      </ul>
    </Accordion>
  );
};
