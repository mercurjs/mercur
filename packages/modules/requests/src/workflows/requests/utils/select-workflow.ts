import {
  acceptProductCategoryRequestWorkflow,
  acceptProductCollectionRequestWorkflow,
  acceptProductRequestWorkflow,
  acceptProductTagRequestWorkflow,
  acceptProductTypeRequestWorkflow,
  acceptReviewRemoveRequestWorkflow,
  acceptSellerCreationRequestWorkflow,
} from "../workflows";

const workflowMap: Record<string, any> = {
  product: acceptProductRequestWorkflow,
  product_import: acceptProductRequestWorkflow,
  product_update: acceptProductRequestWorkflow,
  product_collection: acceptProductCollectionRequestWorkflow,
  product_category: acceptProductCategoryRequestWorkflow,
  product_type: acceptProductTypeRequestWorkflow,
  product_tag: acceptProductTagRequestWorkflow,
  seller: acceptSellerCreationRequestWorkflow,
  review_remove: acceptReviewRemoveRequestWorkflow,
};

export const getRequestWorkflowByType = (type: string) =>
  workflowMap[type] ?? null;
