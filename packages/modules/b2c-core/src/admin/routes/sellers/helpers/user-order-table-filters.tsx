import { useTranslation } from 'react-i18next'

import type { Filter } from '../../../components/table/data-table'
import { useRegions } from '../../../hooks/api/regions'
import { useSalesChannels } from '../../../hooks/api/sales-channels'

export const useOrderTableFilters = (): Filter[] => {
  const { t } = useTranslation()

  const { regions } = useRegions({
    limit: 1000,
    fields: 'id,name'
  })

  const { sales_channels } = useSalesChannels({
    limit: 1000,
    fields: 'id,name'
  })

  let filters: Filter[] = []

  if (regions) {
    const regionFilter: Filter = {
      key: 'region_id',
      label: t('fields.region'),
      type: 'select',
      options: regions.map((r: any) => ({
        label: r.name,
        value: r.id
      })),
      multiple: true,
      searchable: true
    }

    filters = [...filters, regionFilter]
  }

  if (sales_channels) {
    const salesChannelFilter: Filter = {
      key: 'sales_channel_id',
      label: t('fields.salesChannel'),
      type: 'select',
      multiple: true,
      searchable: true,
      options: sales_channels.map((s: any) => ({
        label: s.name,
        value: s.id
      }))
    }

    filters = [...filters, salesChannelFilter]
  }

  const dateFilters: Filter[] = [
    { label: 'Created At', key: 'created_at' },
    { label: 'Updated At', key: 'updated_at' }
  ].map((f) => ({
    key: f.key,
    label: f.label,
    type: 'date'
  }))

  filters = [...filters, ...dateFilters]

  return filters
}
