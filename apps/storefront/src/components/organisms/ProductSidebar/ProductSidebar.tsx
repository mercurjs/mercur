'use client';

import { useState } from 'react';

import { Button } from '@/components/atoms';
import { ColorFilter, ConditionFilter, PriceFilter, SizeFilter } from '@/components/cells';
import { ProductListingActiveFilters } from '@/components/organisms';
import useFilters from '@/hooks/useFilters';
import { CloseIcon } from '@/icons';
import { cn } from '@/lib/utils';

export const ProductSidebar = () => {
  const [filterModal, setFilterModal] = useState(false);
  const { clearAllFilters } = useFilters('');

  return (
    <aside
      className="relative w-full"
      data-testid="sidebar"
    >
      <div
        className={cn(
          'pointer-events-none left-0 top-0 h-full w-full bg-primary blur-sm transition-opacity duration-100 md:relative',
          filterModal ? 'opacity-1 z-20' : '-z-10 opacity-0 md:z-10 md:opacity-100'
        )}
      >
        {filterModal && (
          <div className="md:hidden">
            <div
              className="mb-4 flex items-center justify-between border-y p-4"
              data-testid="sidebar-filter-header"
            >
              <h3 className="heading-md uppercase">Filters</h3>
              <div
                onClick={() => setFilterModal(false)}
                className="cursor-pointer"
                data-testid="sidebar-close-button"
              >
                <CloseIcon size={20} />
              </div>
            </div>
            <div className="mb-4 px-2 md:mb-0">
              <ProductListingActiveFilters />
            </div>
          </div>
        )}

        <div
          className="no-scrollbar h-[calc(100vh-200px)] overflow-y-scroll px-2 md:h-full md:overflow-y-auto md:px-0"
          data-testid="sidebar-filters"
        >
          <PriceFilter />
          <SizeFilter />
          <ColorFilter />
          <ConditionFilter />
        </div>
        <div
          className="absolute bottom-0 left-0 flex w-full items-center gap-2 border-y bg-primary px-4 py-4 md:hidden"
          data-testid="sidebar-actions"
        >
          <Button
            className="label-sm w-1/2 uppercase"
            variant="tonal"
            onClick={() => clearAllFilters()}
            data-testid="sidebar-clear-all-button"
          >
            Clear all
          </Button>
          <Button
            className="label-sm w-1/2 uppercase"
            onClick={() => setFilterModal(false)}
            data-testid="sidebar-view-listings-button"
          >
            View 222 listings
          </Button>
        </div>
      </div>
      <div className="heading-md absolute top-4 z-10 w-full rounded-lg bg-primary p-8 text-center shadow-md">
        Set your Algolia ID and configure filters to enable product filtering
      </div>
    </aside>
  );
};
