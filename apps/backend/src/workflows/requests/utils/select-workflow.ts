import {
  acceptProductCategoryRequestWorkflow,
  acceptProductCollectionRequestWorkflow,
  acceptProductRequestWorkflow,
  acceptProductTagRequestWorkflow,
  acceptProductTypeRequestWorkflow,
  acceptReviewRemoveRequestWorkflow,
  acceptSellerCreationRequestWorkflow
} from '../workflows'

export const getRequestWorkflowByType = (type: string) => {
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

  if (type === 'product_type') {
    return acceptProductTypeRequestWorkflow
  }

  if (type === 'product_tag') {
    return acceptProductTagRequestWorkflow
  }

  return null
}
