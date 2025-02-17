import { MedusaService } from '@medusajs/framework/utils'

import {
  acceptProductCategoryRequestWorkflow,
  acceptProductCollectionRequestWorkflow,
  acceptProductRequestWorkflow,
  acceptReviewRemoveRequestWorkflow,
  acceptSellerCreationRequestWorkflow
} from '../../workflows/requests/workflows'
import { Request } from './models'

class RequestsModuleService extends MedusaService({
  Request
}) {
  static getWorkflowByType(type: string) {
    if (type === 'product_collection') {
      return acceptProductCollectionRequestWorkflow
    }

    if (type === 'product_category') {
      return acceptProductCategoryRequestWorkflow
    }

    if (type === 'product') {
      return acceptProductRequestWorkflow
    }

    if (type === 'seller') {
      return acceptSellerCreationRequestWorkflow
    }

    if (type === 'review_remove') {
      return acceptReviewRemoveRequestWorkflow
    }

    return null
  }
}

export default RequestsModuleService
