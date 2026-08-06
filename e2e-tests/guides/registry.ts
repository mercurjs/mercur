import type { GuideDefinition } from "./define-guide"
import createACommissionRule from "./definitions/create-a-commission-rule"

// Every guide the generator produces. Add one `defineGuide({...})` per User
// Guide page and register it here. See README.md for the workflow and
// guides/definitions/example.configure-commissions.ts for the full shape.
export const GUIDES: GuideDefinition[] = [createACommissionRule]
