import { useTranslation } from 'react-i18next'

import { Filter } from '../../../components/table/data-table'
import { useProductTags } from '../../../hooks/api/product_tags'
import { useProductTypes } from '../../../hooks/api/product_type'
import { useSalesChannels } from '../../../hooks/api/sales-channels'

const excludeableFields = [
  'sales_channel_id',
  'collections',
  'categories',
  'product_types',
  'product_tags'
] as const

export const useProductTableFilters = (
  exclude?: (typeof excludeableFields)[number][]
) => {
  const { t } = useTranslation()

  const isProductTypeExcluded = exclude?.includes('product_types')

  const { product_types } = useProductTypes(
    {
      limit: 1000,
      offset: 0
    },
    {
      enabled: !isProductTypeExcluded
    }
  )

  const isProductTagExcluded = exclude?.includes('product_tags')

  const { product_tags } = useProductTags({
    limit: 1000,
    offset: 0
  })

  const { sales_channels } = useSalesChannels({
    limit: 1000,
    fields: 'id,name'
  })

  let filters: Filter[] = []

  if (product_types && !isProductTypeExcluded) {
    const typeFilter: Filter = {
      key: 'type_id',
      label: t('fields.type'),
      type: 'select',
      multiple: true,
      options: product_types.map((t) => ({
        label: t.value,
        value: t.id
      }))
    }

    filters = [...filters, typeFilter]
  }

  if (product_tags && !isProductTagExcluded) {
    const tagFilter: Filter = {
      key: 'tag_id',
      label: t('fields.tag'),
      type: 'select',
      multiple: true,
      options: product_tags.map((t) => ({
        label: t.value,
        value: t.id
      }))
    }

    filters = [...filters, tagFilter]
  }

  if (sales_channels) {
    const salesChannelFilter: Filter = {
      key: 'sales_channel_id',
      label: t('fields.salesChannel'),
      type: 'select',
      multiple: true,
      options: sales_channels.map((s: any) => ({
        label: s.name,
        value: s.id
      }))
    }

    filters = [...filters, salesChannelFilter]
  }

  const statusFilter: Filter = {
    key: 'status',
    label: t('fields.status'),
    type: 'select',
    multiple: true,
    options: [
      {
        label: t('products.productStatus.draft'),
        value: 'draft'
      },
      {
        label: t('products.productStatus.proposed'),
        value: 'proposed'
      },
      {
        label: t('products.productStatus.published'),
        value: 'published'
      },
      {
        label: t('products.productStatus.rejected'),
        value: 'rejected'
      }
    ]
  }

  const dateFilters: Filter[] = [
    { label: t('fields.createdAt'), key: 'created_at' },
    { label: t('fields.updatedAt'), key: 'updated_at' }
  ].map((f) => ({
    key: f.key,
    label: f.label,
    type: 'date'
  }))

  filters = [...filters, statusFilter, ...dateFilters]

  return filters
}
