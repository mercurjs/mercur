import type { GuideDefinition } from "./define-guide"
import createACommissionRule from "./definitions/create-a-commission-rule"
import editTheGlobalCommission from "./definitions/edit-the-global-commission"
import manageACommissionRule from "./definitions/manage-a-commission-rule"
import createAnAttribute from "./definitions/create-an-attribute"
import managePossibleValues from "./definitions/manage-possible-values"
import submitAProduct from "./definitions/submit-a-product"
import editAProduct from "./definitions/edit-a-product"
import createAnOffer from "./definitions/create-an-offer"
import updatePricesAndStock from "./definitions/update-prices-and-stock"
import fulfillAnOrder from "./definitions/fulfill-an-order"
import shipAnOrder from "./definitions/ship-an-order"
import markAnOrderAsDelivered from "./definitions/mark-an-order-as-delivered"
import refundAnOrder from "./definitions/refund-an-order"
import processAReturn from "./definitions/process-a-return"

// Every guide the generator produces. Add one `defineGuide({...})` per User
// Guide page and register it here. See README.md for the workflow and
// guides/definitions/example.configure-commissions.ts for the full shape.
export const GUIDES: GuideDefinition[] = [
  createACommissionRule,
  editTheGlobalCommission,
  manageACommissionRule,
  createAnAttribute,
  managePossibleValues,
  submitAProduct,
  editAProduct,
  createAnOffer,
  updatePricesAndStock,
  fulfillAnOrder,
  shipAnOrder,
  markAnOrderAsDelivered,
  refundAnOrder,
  processAReturn,
]
