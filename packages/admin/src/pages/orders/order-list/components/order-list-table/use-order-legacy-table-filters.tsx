import { useMemo } from 'react';

import type { Filter } from '@components/table/data-table';
import { useRegions, useSalesChannels } from '@hooks/api';
import { useDateTableFilters } from '@hooks/table/filters';
import { useTranslation } from 'react-i18next';

export const useOrderLegacyTableFilters = (): Filter[] => {
  const { t } = useTranslation();
  const dateFilters = useDateTableFilters();

  const { regions } = useRegions({
    limit: 1000,
    fields: 'id,name'
  });

  const { sales_channels } = useSalesChannels({
    limit: 1000,
    fields: 'id,name'
  });

  return useMemo(() => {
    const filters: Filter[] = [...dateFilters];

    if (regions?.length) {
      filters.push({
        key: 'region_id',
        label: t('fields.region'),
        type: 'select',
        multiple: true,
        options: regions.map(r => ({
          label: r.name,
          value: r.id
        }))
      });
    }

    if (sales_channels?.length) {
      filters.push({
        key: 'sales_channel_id',
        label: t('fields.salesChannel'),
        type: 'select',
        multiple: true,
        options: sales_channels.map(s => ({
          label: s.name,
          value: s.id
        }))
      });
    }

    return filters;
  }, [dateFilters, regions, sales_channels, t]);
};
