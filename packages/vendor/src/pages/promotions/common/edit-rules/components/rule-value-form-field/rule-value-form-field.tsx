import { HttpTypes } from '@medusajs/types';
import { Input, Select } from '@medusajs/ui';
import { useWatch } from 'react-hook-form';

import { Form } from '../../../../../../components/common/form';
import { Combobox } from '../../../../../../components/inputs/combobox';
import { usePromotionRuleValues } from '../../../../../../hooks/api/promotions';
import { useStore } from '../../../../../../hooks/api/store';
import { useEffect } from 'react';

type RuleValueFormFieldType = {
  form: any;
  identifier: string;
  scope: 'application_method.buy_rules' | 'rules' | 'application_method.target_rules';
  name: string;
  operator: string;
  fieldRule: any;
  attributes: HttpTypes.AdminRuleAttributeOption[];
  ruleType: 'rules' | 'target-rules' | 'buy-rules';
};

const buildFilters = (attribute?: string, store?: HttpTypes.AdminStore) => {
  if (!attribute || !store) {
    return {};
  }

  if (attribute === 'currency_code') {
    return {
      value: store.supported_currencies?.map(c => c.currency_code)
    };
  }

  return {};
};

export const RuleValueFormField = ({
  form,
  identifier,
  scope,
  name,
  operator,
  fieldRule,
  attributes,
  ruleType
}: RuleValueFormFieldType) => {
  const attribute = attributes?.find(attr => attr.value === fieldRule.attribute);

  const { store, isLoading: isStoreLoading } = useStore();

  const promotionType = useWatch({
    control: form.control,
    name: 'type'
  });

  const applicationMethodType = useWatch({
    control: form.control,
    name: 'application_method.type'
  });

  const watchOperator = useWatch({
    control: form.control,
    name: operator
  });

  useEffect(() => {
    const hasDirtyRules = Object.keys(form.formState.dirtyFields).length > 0;

    if (!hasDirtyRules) {
      return;
    }

    if (watchOperator === "eq") {
      form.setValue(name, "");
    } else {
      form.setValue(name, []);
    }
  }, [watchOperator]);

  const { values: options = [] } = usePromotionRuleValues(
    ruleType,
    attribute?.id!,
    {
      ...buildFilters(attribute?.id, store),
      promotion_type: promotionType,
      application_method_type: applicationMethodType
    },
    {
      enabled:
        !!attribute?.id &&
        ['select', 'multiselect'].includes(attribute.field_type) &&
        !isStoreLoading
    }
  );

  return (
    <Form.Field
      key={`${identifier}.${scope}.${name}-${fieldRule.attribute}`}
      name={name}
      render={({ field: { onChange, ref, ...field } }) => {
        if (attribute?.field_type === 'number') {
          return (
            <Form.Item className="basis-1/2">
              <Form.Control>
                <Input
                  {...field}
                  type="number"
                  onChange={onChange}
                  className="bg-ui-bg-base"
                  ref={ref}
                  min={1}
                  disabled={!fieldRule.attribute}
                />
              </Form.Control>
              <Form.ErrorMessage />
            </Form.Item>
          );
        } else if (attribute?.field_type === 'text') {
          return (
            <Form.Item className="basis-1/2">
              <Form.Control>
                <Input
                  {...field}
                  ref={ref}
                  onChange={onChange}
                  className="bg-ui-bg-base"
                  disabled={!fieldRule.attribute}
                />
              </Form.Control>
              <Form.ErrorMessage />
            </Form.Item>
          );
        } else if (watchOperator === 'eq') {
          return (
            <Form.Item className="basis-1/2">
              <Form.Control>
                <Select
                  {...field}
                  value={Array.isArray(field.value) ? field.value[0] : field.value}
                  onValueChange={onChange}
                  disabled={!fieldRule.attribute}
                >
                  <Select.Trigger
                    ref={ref}
                    className="bg-ui-bg-base"
                  >
                    <Select.Value placeholder="Select Value" />
                  </Select.Trigger>

                  <Select.Content>
                    {options?.map((option, i) => (
                      <Select.Item
                        key={`${identifier}-value-option-${i}`}
                        value={option.value}
                      >
                        <span className="text-ui-fg-subtle">{option.label}</span>
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select>
              </Form.Control>
              <Form.ErrorMessage />
            </Form.Item>
          );
        } else {
          return (
            <Form.Item className="basis-1/2">
              <Form.Control>
                <Combobox
                  {...field}
                  ref={ref}
                  placeholder="Select Values"
                  options={options}
                  onChange={onChange}
                  className="bg-ui-bg-base"
                  disabled={!fieldRule.attribute}
                />
              </Form.Control>

              <Form.ErrorMessage />
            </Form.Item>
          );
        }
      }}
    />
  );
};
