import {
  ApplicationMethodType,
  PromotionType,
  RuleOperator
} from '@medusajs/framework/utils'

export const operatorsMap = {
  [RuleOperator.IN]: {
    id: RuleOperator.IN,
    value: RuleOperator.IN,
    label: 'In'
  },
  [RuleOperator.EQ]: {
    id: RuleOperator.EQ,
    value: RuleOperator.EQ,
    label: 'Equals'
  },
  [RuleOperator.NE]: {
    id: RuleOperator.NE,
    value: RuleOperator.NE,
    label: 'Not In'
  }
}

export enum DisguisedRule {
  APPLY_TO_QUANTITY = 'apply_to_quantity',
  BUY_RULES_MIN_QUANTITY = 'buy_rules_min_quantity',
  CURRENCY_CODE = 'currency_code'
}

const ruleAttributes = [
  {
    id: 'customer_group',
    value: 'customer.groups.id',
    label: 'Customer Group',
    required: false,
    field_type: 'multiselect',
    operators: Object.values(operatorsMap)
  },
  {
    id: 'region',
    value: 'region.id',
    label: 'Region',
    required: false,
    field_type: 'multiselect',
    operators: Object.values(operatorsMap)
  },
  {
    id: 'country',
    value: 'shipping_address.country_code',
    label: 'Country',
    required: false,
    field_type: 'multiselect',
    operators: Object.values(operatorsMap)
  },
  {
    id: 'sales_channel',
    value: 'sales_channel_id',
    label: 'Sales Channel',
    required: false,
    field_type: 'multiselect',
    operators: Object.values(operatorsMap)
  }
]

const commonAttributes = [
  {
    id: 'product',
    value: 'items.product.id',
    label: 'Product',
    required: false,
    field_type: 'multiselect',
    operators: [operatorsMap['in'], operatorsMap['eq']]
  }
]

const currencyRule = {
  id: DisguisedRule.CURRENCY_CODE,
  value: DisguisedRule.CURRENCY_CODE,
  label: 'Currency Code',
  field_type: 'select',
  required: true,
  disguised: true,
  hydrate: true,
  operators: [operatorsMap[RuleOperator.EQ]]
}

const buyGetBuyRules = [
  {
    id: DisguisedRule.BUY_RULES_MIN_QUANTITY,
    value: DisguisedRule.BUY_RULES_MIN_QUANTITY,
    label: 'Minimum quantity of items',
    field_type: 'number',
    required: true,
    disguised: true,
    operators: [operatorsMap[RuleOperator.EQ]]
  }
]

const buyGetTargetRules = [
  {
    id: DisguisedRule.APPLY_TO_QUANTITY,
    value: DisguisedRule.APPLY_TO_QUANTITY,
    label: 'Quantity of items promotion will apply to',
    field_type: 'number',
    required: true,
    disguised: true,
    operators: [operatorsMap[RuleOperator.EQ]]
  }
]

export const getRuleAttributesMap = ({
  promotionType,
  applicationMethodType
}: {
  promotionType?: string
  applicationMethodType?: string
}) => {
  const map = {
    rules: [...ruleAttributes],
    'target-rules': [...commonAttributes],
    'buy-rules': [...commonAttributes]
  }

  if (applicationMethodType === ApplicationMethodType.FIXED) {
    map['rules'].push({ ...currencyRule })
  } else {
    map['rules'].push({ ...currencyRule, required: false })
  }

  if (promotionType === PromotionType.BUYGET) {
    map['buy-rules'].push(...buyGetBuyRules)
    map['target-rules'].push(...buyGetTargetRules)
  }

  return map
}
