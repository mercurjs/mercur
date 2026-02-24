import { forwardRef, Fragment, useEffect, useRef } from 'react';

import { XMarkMini } from '@medusajs/icons';
import { PromotionDTO } from '@medusajs/types';
import { Badge, Button, Heading, IconButton, Select, Text } from '@medusajs/ui';
import { ControllerRenderProps, useFieldArray, UseFormReturn, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { Form } from '../../../../../../components/common/form';
import {
  usePromotionRuleAttributes,
  usePromotionRules
} from '../../../../../../hooks/api/promotions';
import { useDocumentDirection } from '../../../../../../hooks/use-document-direction';
import { CreatePromotionSchemaType } from '../../../../promotion-create/components/create-promotion-form/form-schema';
import { generateRuleAttributes } from '../edit-rules-form/utils';
import { RuleValueFormField } from '../rule-value-form-field';
import { requiredProductRule } from './constants';

type RulesFormFieldType = {
  promotion?: PromotionDTO;
  form: UseFormReturn<CreatePromotionSchemaType>;
  ruleType: 'rules' | 'target-rules' | 'buy-rules';
  setRulesToRemove?: any;
  rulesToRemove?: any;
  scope?: 'application_method.buy_rules' | 'rules' | 'application_method.target_rules';
  formType?: 'create' | 'edit';
};

export const RulesFormField = ({
  form,
  ruleType,
  setRulesToRemove,
  rulesToRemove,
  scope = 'rules',
  promotion,
  formType = 'create'
}: RulesFormFieldType) => {
  const initialRulesSet = useRef(false);

  const { t } = useTranslation();
  const direction = useDocumentDirection();
  const formData = form.getValues();
  const { attributes } = usePromotionRuleAttributes(
    ruleType,
    formData.type,
    formData.application_method?.target_type
  );

  const { fields, append, remove, update, replace } = useFieldArray({
    control: form.control,
    name: scope,
    keyName: scope
  });

  const promotionType = useWatch({
    control: form.control,
    name: 'type',
    defaultValue: promotion?.type
  });

  const applicationMethodType = useWatch({
    control: form.control,
    name: 'application_method.type',
    defaultValue: promotion?.application_method?.type
  });

  const applicationMethodTargetType = useWatch({
    control: form.control,
    name: 'application_method.target_type',
    defaultValue: promotion?.application_method?.target_type
  });

  const query: Record<string, string> = promotionType
    ? {
        promotion_type: promotionType,
        application_method_type: applicationMethodType,
        application_method_target_type: applicationMethodTargetType
      }
    : {};

  const { rules, isLoading } = usePromotionRules(promotion?.id || null, ruleType, query, {
    enabled: !!promotion?.id || (!!promotionType && !!applicationMethodType)
  });

  useEffect(() => {
    if (isLoading) {
      return;
    }

    /**
     * This effect sets rules after mount but since it is reused in create and edit flows, prevent this hook from recreating rules
     * when fields are intentionally set to empty (e.g. "Clear all" is pressed).
     */
    if (!fields.length && formType === 'edit' && initialRulesSet.current) {
      return;
    }

    if (ruleType === 'rules' && !fields.length) {
      form.resetField('rules');

      replace(generateRuleAttributes(rules) as any);
    }

    if (ruleType === 'buy-rules' && !fields.length) {
      form.resetField('application_method.buy_rules');
      const rulesToAppend =
        promotion?.id || promotionType === 'standard' ? rules : [...rules, requiredProductRule];

      replace(generateRuleAttributes(rulesToAppend) as any);
    }

    if (ruleType === 'target-rules' && !fields.length) {
      form.resetField('application_method.target_rules');
      const rulesToAppend =
        promotion?.id || promotionType === 'standard' ? rules : [...rules, requiredProductRule];

      replace(generateRuleAttributes(rulesToAppend) as any);
    }

    initialRulesSet.current = true;
  }, [
    promotionType,
    isLoading,
    ruleType,
    fields.length,
    formType,
    form,
    replace,
    rules,
    promotion?.id
  ]);

  return (
    <div
      className="flex flex-col"
      data-testid={`rules-form-field-${ruleType}`}
    >
      <Heading
        level="h2"
        className="mb-2"
        data-testid={`rules-form-field-heading-${ruleType}`}
      >
        {t(
          ruleType === 'target-rules'
            ? `promotions.fields.conditions.${ruleType}.${applicationMethodTargetType}.title`
            : `promotions.fields.conditions.${ruleType}.title`
        )}
      </Heading>

      <Text
        className="txt-small mb-6 text-ui-fg-subtle"
        data-testid={`rules-form-field-description-${ruleType}`}
      >
        {t(
          ruleType === 'target-rules'
            ? `promotions.fields.conditions.${ruleType}.${applicationMethodTargetType}.description`
            : `promotions.fields.conditions.${ruleType}.description`
        )}
      </Text>

      {fields.map((fieldRule, index) => {
        const identifier = fieldRule.id;

        return (
          <Fragment key={`${fieldRule.id}.${index}.${fieldRule.attribute}`}>
            <div
              className="flex flex-row gap-2 rounded-xl border border-ui-border-base bg-ui-bg-subtle px-2 py-2"
              data-testid={`rules-form-field-rule-${ruleType}-${index}`}
            >
              <div className="grow">
                <Form.Field
                  name={`${scope}.${index}.attribute`}
                  render={({ field }) => {
                    const { onChange, ref, ...fieldProps } = field;

                    const existingAttributes = fields?.map((field: any) => field.attribute) || [];
                    const attributeOptions =
                      attributes?.filter(attr => {
                        if (attr.value === fieldRule.attribute) {
                          return true;
                        }

                        return !existingAttributes.includes(attr.value);
                      }) || [];

                    const disabled = !!fieldRule.required;
                    const onValueChange = (e: string) => {
                      const currentAttributeOption = attributeOptions.find(ao => ao.id === e);

                      const fieldRuleOverrides: typeof fieldRule = {
                        ...fieldRule,
                        disguised: currentAttributeOption?.disguised || false
                      };

                      if (currentAttributeOption?.operators?.length === 1) {
                        fieldRuleOverrides.operator = currentAttributeOption.operators[0].value;
                      }

                      if (fieldRuleOverrides.operator === 'eq') {
                        fieldRuleOverrides.values = '';
                      } else {
                        fieldRuleOverrides.values = [];
                      }

                      update(index, fieldRuleOverrides);
                      onChange(e);
                    };

                    return (
                      <Form.Item
                        className="mb-2"
                        data-testid={`rules-form-field-rule-${ruleType}-${index}-attribute-item`}
                      >
                        {fieldRule.required && (
                          <div
                            className="flex items-center px-2"
                            data-testid={`rules-form-field-rule-${ruleType}-${index}-required-label`}
                          >
                            <p className="text txt-small text-ui-fg-muted">
                              {t('promotions.form.required')}
                            </p>
                          </div>
                        )}

                        <Form.Control
                          data-testid={`rules-form-field-rule-${ruleType}-${index}-attribute-control`}
                        >
                          {!disabled ? (
                            <Select
                              dir={direction}
                              {...fieldProps}
                              onValueChange={onValueChange}
                              disabled={fieldRule.required}
                              data-testid={`rules-form-field-rule-${ruleType}-${index}-attribute-select`}
                            >
                              <Select.Trigger
                                ref={ref}
                                className="bg-ui-bg-base"
                                data-testid={`rules-form-field-rule-${ruleType}-${index}-attribute-select-trigger`}
                              >
                                <Select.Value placeholder={t('promotions.form.selectAttribute')} />
                              </Select.Trigger>

                              <Select.Content
                                data-testid={`rules-form-field-rule-${ruleType}-${index}-attribute-select-content`}
                              >
                                {attributeOptions?.map((c, i) => (
                                  <Select.Item
                                    key={`${identifier}-attribute-option-${i}`}
                                    value={c.value}
                                    data-testid={`rules-form-field-rule-${ruleType}-${index}-attribute-select-option-${c.value}`}
                                  >
                                    <span className="text-ui-fg-subtle">{c.label}</span>
                                  </Select.Item>
                                ))}
                              </Select.Content>
                            </Select>
                          ) : (
                            <DisabledField
                              label={
                                attributeOptions?.find(ao => ao.value === fieldRule.attribute)
                                  ?.label || ''
                              }
                              field={field}
                            />
                          )}
                        </Form.Control>
                        <Form.ErrorMessage
                          data-testid={`rules-form-field-rule-${ruleType}-${index}-attribute-error`}
                        />
                      </Form.Item>
                    );
                  }}
                />

                <div className="flex gap-2">
                  <Form.Field
                    name={`${scope}.${index}.operator`}
                    render={({ field }) => {
                      const { onChange, ref, ...fieldProps } = field;

                      const currentAttributeOption = attributes?.find(
                        attr => attr.value === fieldRule.attribute
                      );

                      const options =
                        currentAttributeOption?.operators?.map((o, idx) => ({
                          label: o.label,
                          value: o.value,
                          key: `${identifier}-operator-option-${idx}`
                        })) || [];

                      const disabled = !!fieldRule.attribute && options?.length <= 1;

                      return (
                        <Form.Item
                          className="basis-1/2"
                          data-testid={`rules-form-field-rule-${ruleType}-${index}-operator-item`}
                        >
                          <Form.Control
                            data-testid={`rules-form-field-rule-${ruleType}-${index}-operator-control`}
                          >
                            {!disabled ? (
                              <Select
                                dir={direction}
                                {...fieldProps}
                                disabled={!fieldRule.attribute}
                                onValueChange={onChange}
                                data-testid={`rules-form-field-rule-${ruleType}-${index}-operator-select`}
                              >
                                <Select.Trigger
                                  ref={ref}
                                  className="bg-ui-bg-base"
                                  data-testid={`rules-form-field-rule-${ruleType}-${index}-operator-select-trigger`}
                                >
                                  <Select.Value placeholder="Select Operator" />
                                </Select.Trigger>

                                <Select.Content
                                  data-testid={`rules-form-field-rule-${ruleType}-${index}-operator-select-content`}
                                >
                                  {options?.map(c => (
                                    <Select.Item
                                      key={c.key}
                                      value={c.value}
                                      data-testid={`rules-form-field-rule-${ruleType}-${index}-operator-select-option-${c.value}`}
                                    >
                                      <span className="text-ui-fg-subtle">{c.label}</span>
                                    </Select.Item>
                                  ))}
                                </Select.Content>
                              </Select>
                            ) : (
                              <DisabledField
                                label={options.find(o => o.value === fieldProps.value)?.label || ''}
                                field={field}
                              />
                            )}
                          </Form.Control>
                          <Form.ErrorMessage
                            data-testid={`rules-form-field-rule-${ruleType}-${index}-operator-error`}
                          />
                        </Form.Item>
                      );
                    }}
                  />

                  <RuleValueFormField
                    form={form}
                    identifier={identifier}
                    scope={scope}
                    name={`${scope}.${index}.values`}
                    operator={`${scope}.${index}.operator`}
                    fieldRule={fieldRule}
                    attributes={attributes}
                    ruleType={ruleType}
                    applicationMethodTargetType={applicationMethodTargetType}
                  />
                </div>
              </div>

              <div className="size-7 flex-none self-center">
                {!fieldRule.required && (
                  <IconButton
                    size="small"
                    variant="transparent"
                    className="text-ui-fg-muted"
                    type="button"
                    onClick={() => {
                      if (!fieldRule.required) {
                        setRulesToRemove && setRulesToRemove([...rulesToRemove, fieldRule]);

                        remove(index);
                      }
                    }}
                    data-testid={`rules-form-field-rule-${ruleType}-${index}-remove-button`}
                  >
                    <XMarkMini />
                  </IconButton>
                )}
              </div>
            </div>

            {index < fields.length - 1 && (
              <div
                className="relative px-6 py-3"
                data-testid={`rules-form-field-rule-${ruleType}-${index}-separator`}
              >
                <div className="absolute bottom-0 left-[40px] top-0 z-[-1] w-px border-ui-border-strong bg-[linear-gradient(var(--border-strong)_33%,rgba(255,255,255,0)_0%)] bg-[length:1px_3px] bg-repeat-y"></div>

                <Badge
                  size="2xsmall"
                  className="text-xs"
                  data-testid={`rules-form-field-rule-${ruleType}-${index}-and-badge`}
                >
                  {t('promotions.form.and')}
                </Badge>
              </div>
            )}
          </Fragment>
        );
      })}

      <div
        className={fields.length ? 'mt-6' : ''}
        data-testid={`rules-form-field-actions-${ruleType}`}
      >
        <Button
          type="button"
          variant="secondary"
          className="inline-block"
          disabled={fields.length === attributes?.length}
          onClick={() => {
            append({
              attribute: '',
              operator: '',
              values: [],
              required: false
            } as any);
          }}
          data-testid={`rules-form-field-add-condition-button-${ruleType}`}
        >
          {t('promotions.fields.addCondition')}
        </Button>

        {!!fields.length && (
          <Button
            type="button"
            variant="transparent"
            className="ml-2 inline-block text-ui-fg-muted hover:text-ui-fg-subtle"
            onClick={() => {
              const indicesToRemove = fields
                .map((field: any, index) => (field.required ? null : index))
                .filter(f => f !== null);

              setRulesToRemove && setRulesToRemove(fields.filter((field: any) => !field.required));
              remove(indicesToRemove);
            }}
            data-testid={`rules-form-field-clear-all-button-${ruleType}`}
          >
            {t('promotions.fields.clearAll')}
          </Button>
        )}
      </div>
    </div>
  );
};

type DisabledAttributeProps = {
  label: string;
  field: ControllerRenderProps;
};

/**
 * Render this if an attribute is disabled, or
 * if there is only one option available.
 */
const DisabledField = forwardRef<HTMLInputElement, DisabledAttributeProps>(
  ({ label, field }, ref) => {
    return (
      <div>
        <div className="txt-compact-small h-8 rounded-md bg-ui-bg-component px-2 py-1.5 text-ui-fg-base shadow-borders-base">
          {label}
        </div>
        <input
          {...field}
          ref={ref}
          disabled
          hidden
        />
      </div>
    );
  }
);

DisabledField.displayName = 'DisabledField';
