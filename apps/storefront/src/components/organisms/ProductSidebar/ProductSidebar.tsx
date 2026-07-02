'use client';

import { useMemo, useState } from 'react';

import type { ProductAttributeDTO, SearchFacets, SearchFacetValue } from '@mercurjs/types';

import { Button } from '@/components/atoms';
import { Accordion, FilterCheckboxOption } from '@/components/molecules';
import { ProductListingActiveFilters } from '@/components/organisms';
import useFilters from '@/hooks/useFilters';
import { CloseIcon } from '@/icons';
import { cn } from '@/lib/utils';

export const ProductSidebar = ({
  facets,
  attributes: attributesProp,
  category_id,
  collection_id
}: {
  facets?: SearchFacets;
  attributes?: ProductAttributeDTO[];
  category_id?: string;
  collection_id?: string;
}) => {
  const [filterModal, setFilterModal] = useState(false);
  const { clearAllFilters } = useFilters('');

  const attributes = useMemo(
    () =>
      (attributesProp ?? []).filter(
        (attribute) =>
          attribute.is_filterable && (attribute.values?.length ?? 0) > 0
      ),
    [attributesProp]
  );

  return (
    <aside
      className="relative w-full"
      data-testid="sidebar"
    >
      <div
        className={cn(
          'left-0 top-0 h-full w-full bg-primary transition-opacity duration-100 md:relative',
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
          {!category_id && (
            <FacetFilter
              paramKey="category"
              heading="Category"
              values={facets?.categories}
            />
          )}
          {!collection_id && (
            <FacetFilter
              paramKey="collection"
              heading="Collection"
              values={facets?.collections}
            />
          )}

          {attributes.map((attribute) => (
            <AttributeFilter
              key={attribute.id}
              attribute={attribute}
              facets={facets}
            />
          ))}
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
            View listings
          </Button>
        </div>
      </div>
    </aside>
  );
};

const FacetFilter = ({
  paramKey,
  heading,
  values
}: {
  paramKey: string;
  heading: string;
  values?: SearchFacetValue[];
}) => {
  const { updateFilters, isFilterActive } = useFilters(paramKey);

  if (!values?.length) return null;

  return (
    <Accordion heading={heading}>
      <ul className="px-4">
        {values.map((value) => (
          <li key={value.id} className="mb-4">
            <FilterCheckboxOption
              label={value.label}
              amount={value.count}
              checked={isFilterActive(value.id)}
              onCheck={() => updateFilters(value.id)}
              data-testid={`filter-${paramKey}-${value.id}`}
            />
          </li>
        ))}
      </ul>
    </Accordion>
  );
};

const AttributeFilter = ({
  attribute,
  facets
}: {
  attribute: ProductAttributeDTO;
  facets?: SearchFacets;
}) => {
  const handle = attribute.handle ?? attribute.id;
  const { updateFilters, isFilterActive } = useFilters(`attr_${handle}`);

  const counts = useMemo(() => {
    const group = facets?.attributes?.find((facet) => facet.handle === handle);
    return new Map(group?.values.map((value) => [value.id, value.count]));
  }, [facets, handle]);

  const values = (attribute.values ?? []).filter(
    (value) => (counts.get(value.id) ?? 0) > 0
  );

  if (!values.length) return null;

  return (
    <Accordion heading={attribute.name}>
      <ul className="px-4" data-testid={`filter-attribute-${handle}`}>
        {values.map((value) => (
          <li key={value.id} className="mb-4">
            <FilterCheckboxOption
              label={value.name}
              amount={counts.get(value.id)}
              checked={isFilterActive(value.id)}
              onCheck={() => updateFilters(value.id)}
              data-testid={`filter-attribute-value-${value.id}`}
            />
          </li>
        ))}
      </ul>
    </Accordion>
  );
};
