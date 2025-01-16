import { ExecArgs } from '@medusajs/framework/types'

import StripeTaxClient from '../modules/stripe-tax-provider/client'
import { TAX_CODE_MODULE } from '../modules/taxcode'
import TaxCodeService from '../modules/taxcode/service'

export default async function seedTaxCodes({ container }: ExecArgs) {
  const apiKey = process.env.STRIPE_SECRET_API_KEY
  const stripeClient = new StripeTaxClient(apiKey!)
  const taxCodeService = container.resolve<TaxCodeService>(TAX_CODE_MODULE)

  const codesResponse = await stripeClient.listTaxCodes()
  const taxCodes = codesResponse.map((t) => {
    return { code: t.id, description: t.description, name: t.name }
  })

  await taxCodeService.createTaxCodes(...taxCodes)
}
