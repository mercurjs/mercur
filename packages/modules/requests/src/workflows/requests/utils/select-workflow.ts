import {
  acceptProductCategoryRequestWorkflow,
  acceptProductCollectionUpdateRequestWorkflow,
  acceptProductRequestWorkflow,
  acceptProductTagRequestWorkflow,
  acceptProductTypeRequestWorkflow,
  acceptReviewRemoveRequestWorkflow,
  acceptSellerCreationRequestWorkflow,
  updateRequestWorkflow
} from "../workflows";

const workflowMap: Record<string, any> = {
  product: acceptProductRequestWorkflow,
  product_import: acceptProductRequestWorkflow,
  product_update: acceptProductRequestWorkflow,
  product_collection_update: acceptProductCollectionUpdateRequestWorkflow,
  product_category: acceptProductCategoryRequestWorkflow,
  product_type: acceptProductTypeRequestWorkflow,
  product_tag: acceptProductTagRequestWorkflow,
  seller: acceptSellerCreationRequestWorkflow,
  review_remove: acceptReviewRemoveRequestWorkflow,
};

export const getRequestWorkflowByType = (type: string) =>
  workflowMap[type] ?? updateRequestWorkflow;
