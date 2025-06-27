import { MedusaService } from '@medusajs/framework/utils'

import { Review } from './models/review'

class ReviewModuleService extends MedusaService({
  Review
}) {}

export default ReviewModuleService
