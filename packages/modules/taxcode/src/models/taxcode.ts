import { model } from '@medusajs/utils'

const TaxCode = model.define('tax_code', {
  id: model.id({ prefix: 'taxc' }).primaryKey(),
  name: model.text().default(''),
  description: model.text().default(''),
  code: model.text().unique()
})

export default TaxCode
