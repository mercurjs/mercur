export type DefaultShippingOptionDTO = {
  id: string
  external_provider: string
  external_provider_id: string
  external_provider_option_name: string
  is_enabled: boolean
  created_at: Date
  updated_at: Date
}

export type DefaultSellerShippingOptionDTO = DefaultShippingOptionDTO

export type CreateDefaultShippingOption = Pick<
  DefaultShippingOptionDTO,
  'external_provider_id'
>
