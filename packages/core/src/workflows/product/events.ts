export const ProductWorkflowEvents = {
  CREATED: "product.created",
  UPDATED: "product.updated",
  DELETED: "product.deleted",
  ACCEPTED: "product.accepted",
  CHANGES_REQUESTED: "product.changes_requested",
  REJECTED: "product.rejected",
  ACTIVATED: "product.activated",
  DEACTIVATED: "product.deactivated",
  RESUBMITTED: "product.submission_resubmitted",
} as const

export const ProductBrandWorkflowEvents = {
  CREATED: "product_brand.created",
  UPDATED: "product_brand.updated",
  DELETED: "product_brand.deleted",
} as const

export const ProductAttributeWorkflowEvents = {
  CREATED: "product_attribute.created",
  UPDATED: "product_attribute.updated",
  DELETED: "product_attribute.deleted",
} as const

export const ProductAttributeValueWorkflowEvents = {
  CREATED: "product_attribute_value.created",
  UPDATED: "product_attribute_value.updated",
  DELETED: "product_attribute_value.deleted",
} as const

export const ProductRejectionReasonWorkflowEvents = {
  CREATED: "product_rejection_reason.created",
  UPDATED: "product_rejection_reason.updated",
  DELETED: "product_rejection_reason.deleted",
} as const
