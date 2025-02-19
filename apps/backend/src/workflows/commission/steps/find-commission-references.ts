import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk'

type StepInput = Array<{ reference: string; reference_id: string }>

export const findCommissionReferencesStep = createStep(
  'find-commission-references',
  async (input: StepInput, { container }) => {
    const knex = container.resolve('__pg_connection__')
    const sellerIds = input
      .filter((i) => i.reference === 'seller')
      .map((v) => v.reference_id)
    const productTypeIds = input
      .filter((i) => i.reference === 'product_type')
      .map((v) => v.reference_id)
    const productCategoryIds = input
      .filter((i) => i.reference === 'product_category')
      .map((v) => v.reference_id)

    input
      .filter(
        (i) =>
          i.reference === 'seller+product_type' ||
          i.reference === 'seller+product_category'
      )
      .forEach((v) => {
        const ids = v.reference_id.split('+')
        sellerIds.push(ids[0])
        if (v.reference === 'seller+product_category') {
          productCategoryIds.push(ids[1])
        } else {
          productTypeIds.push(ids[1])
        }
      })

    const sellers = await knex('seller')
      .select(['id', 'name AS value'])
      .whereIn('id', [...new Set(sellerIds)])

    const productTypes = await knex('product_type')
      .select(['id', 'value'])
      .whereIn('id', [...new Set(productTypeIds)])

    const productCategories = await knex('product_category')
      .select(['id', 'name AS value'])
      .whereIn('id', [...new Set(productCategoryIds)])

    return new StepResponse({ sellers, productTypes, productCategories })
  }
)
