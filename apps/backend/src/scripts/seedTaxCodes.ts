import { ExecArgs } from '@medusajs/framework/types'

import { TAX_CODE_MODULE } from '../modules/taxcode'
import TaxCodeService from '../modules/taxcode/service'

export default async function seedTaxCodes({ container }: ExecArgs) {
  const taxCodeService = container.resolve<TaxCodeService>(TAX_CODE_MODULE)

  const codesResponse = await taxCodeService.getTaxCodes()
  const taxCodes = codesResponse.map((t) => {
    return { code: t.id, description: t.description, name: t.name }
  })

  await taxCodeService.createTaxCodes(taxCodes)
}
