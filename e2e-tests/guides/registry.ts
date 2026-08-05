import type { GuideDefinition } from "./define-guide"
import createACommissionRule from "./definitions/create-a-commission-rule"
import editTheGlobalCommission from "./definitions/edit-the-global-commission"
import createAnAttribute from "./definitions/create-an-attribute"
import managePossibleValues from "./definitions/manage-possible-values"
import submitAProduct from "./definitions/submit-a-product"
import createAnOffer from "./definitions/create-an-offer"

// Every guide the generator produces. Add one `defineGuide({...})` per User
// Guide page and register it here. See README.md for the workflow and
// guides/definitions/example.configure-commissions.ts for the full shape.
export const GUIDES: GuideDefinition[] = [
  createACommissionRule,
  editTheGlobalCommission,
  createAnAttribute,
  managePossibleValues,
  submitAProduct,
  createAnOffer,
]
