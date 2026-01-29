import { useEffect, useMemo, useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import type {
  ApplicationMethodAllocationValues,
  ApplicationMethodTargetTypeValues,
  ApplicationMethodTypeValues,
  PromotionRuleOperatorValues,
  PromotionStatusValues,
  PromotionTypeValues
} from '@medusajs/types';
import {
  Alert,
  Badge,
  Button,
  clx,
  CurrencyInput,
  Divider,
  Heading,
  Input,
  ProgressTabs,
  RadioGroup,
  Switch,
  Text,
  toast,
  type ProgressStatus
} from '@medusajs/ui';
import { useForm, useWatch } from 'react-hook-form';
import { Trans, useTranslation } from 'react-i18next';
import type { z } from 'zod';

import { Form } from '../../../../../components/common/form';
import { DeprecatedPercentageInput } from '../../../../../components/inputs/percentage-input';
import { RouteFocusModal, useRouteModal } from '../../../../../components/modals';
import { KeyboundForm } from '../../../../../components/utilities/keybound-form';
import { useCampaigns } from '../../../../../hooks/api/campaigns';
import { useCreatePromotion } from '../../../../../hooks/api/promotions';
import { useDocumentDirection } from '../../../../../hooks/use-document-direction';
import { currencies, getCurrencySymbol } from '../../../../../lib/data/currencies';
import { DEFAULT_CAMPAIGN_VALUES } from '../../../../campaigns/common/constants';
import { RulesFormField } from '../../../common/edit-rules/components/rules-form-field';
import { AddCampaignPromotionFields } from '../../../promotion-add-campaign/components/add-campaign-promotion-form';
import { Tab } from './constants';
import { CreatePromotionSchema } from './form-schema';
import { templates } from './templates';

const defaultValues = {
  campaign_id: undefined,
  template_id: templates[0].id!,
  campaign_choice: 'none' as const,
  is_automatic: 'false',
  code: '',
  type: 'standard' as PromotionTypeValues,
  status: 'draft' as PromotionStatusValues,
  rules: [],
  is_tax_inclusive: false,
  application_method: {
    allocation: 'each' as ApplicationMethodAllocationValues,
    type: 'fixed' as ApplicationMethodTypeValues,
    target_type: 'items' as ApplicationMethodTargetTypeValues,
    max_quantity: 1,
    target_rules: [],
    buy_rules: []
  },
  campaign: undefined
};

type TabState = Record<Tab, ProgressStatus>;
type AllocationMode = 'each' | 'across' | 'once';

export const CreatePromotionForm = () => {
  const [tab, setTab] = useState<Tab>(Tab.TYPE);
  const [tabState, setTabState] = useState<TabState>({
    [Tab.TYPE]: 'in-progress',
    [Tab.PROMOTION]: 'not-started',
    [Tab.CAMPAIGN]: 'not-started'
  });

  const { t } = useTranslation();
  const { handleSuccess } = useRouteModal();
  const direction = useDocumentDirection();
  const form = useForm<z.infer<typeof CreatePromotionSchema>>({
    defaultValues,
    resolver: zodResolver(CreatePromotionSchema)
  });
  const { setValue, reset, getValues } = form;
  const [allocationMode, setAllocationMode] = useState<AllocationMode>('each');

  const { mutateAsync: createPromotion } = useCreatePromotion();

  const handleSubmit = form.handleSubmit(
    async data => {
      if (data.campaign_choice === 'existing' && !data.campaign_id) {
        form.setError('campaign_id', { message: t('promotions.errors.requiredField') });
        return;
      }
      const {
        campaign_choice: _campaignChoice,
        is_automatic,
        is_tax_inclusive,
        template_id: _templateId,
        application_method,
        rules,
        ...promotionData
      } = data;
      const {
        target_rules: targetRulesData = [],
        buy_rules: buyRulesData = [],
        ...applicationMethodData
      } = application_method;
      const allocationTyped = applicationMethodData.allocation as ApplicationMethodAllocationValues;

      const disguisedRules = [
        ...targetRulesData.filter(r => !!r.disguised),
        ...buyRulesData.filter(r => !!r.disguised),
        ...rules.filter(r => !!r.disguised)
      ];

      const applicationMethodRuleData: Record<any, any> = {};

      for (const rule of disguisedRules) {
        applicationMethodRuleData[rule.attribute] =
          rule.field_type === 'number' ? parseInt(rule.values as string) : rule.values;
      }

      const buildRulesData = (
        rules: {
          operator: string;
          attribute: string;
          values: any[] | any;
          disguised?: boolean;
        }[]
      ) => {
        return rules
          .filter(r => !r.disguised)
          .map(rule => ({
            operator: rule.operator as PromotionRuleOperatorValues,
            attribute: rule.attribute,
            values: rule.values
          }));
      };

      if (data.campaign) {
        data.campaign.budget.attribute = data.campaign.budget.attribute || null;
        data.campaign.budget.type = data.campaign.budget.attribute
          ? 'use_by_attribute'
          : data.campaign.budget.type;
      }

      createPromotion(
        {
          ...promotionData,
          rules: buildRulesData(rules),
          application_method: {
            ...applicationMethodData,
            allocation: allocationTyped,
            ...applicationMethodRuleData,
            value: parseFloat(applicationMethodData.value as string) as number,
            target_rules: buildRulesData(targetRulesData),
            buy_rules: buildRulesData(buyRulesData),
            max_quantity:
              allocationTyped === 'across' ? undefined : applicationMethodData.max_quantity
          },
          is_tax_inclusive,
          is_automatic: is_automatic === 'true'
        },
        {
          onSuccess: ({ promotion }) => {
            toast.success(
              t('promotions.toasts.promotionCreateSuccess', {
                code: promotion.code
              })
            );

            handleSuccess(`/promotions/${promotion.id}`);
          },
          onError: e => {
            toast.error(e.message);
          }
        }
      );
    },
    async error => {
      const { campaign: _campaign, ...rest } = error || {};
      const errorInPromotionTab = !!Object.keys(rest || {}).length;

      if (errorInPromotionTab) {
        toast.error(t('promotions.errors.promotionTabError'));
      }
    }
  );

  const handleTabChange = async (tab: Tab) => {
    switch (tab) {
      case Tab.TYPE:
        setTabState(prev => ({
          ...prev,
          [Tab.TYPE]: 'in-progress'
        }));
        setTab(tab);
        break;
      case Tab.PROMOTION:
        setTabState(prev => ({
          ...prev,
          [Tab.TYPE]: 'completed',
          [Tab.PROMOTION]: 'in-progress'
        }));
        setTab(tab);
        break;
      case Tab.CAMPAIGN: {
        const valid = await form.trigger();

        if (!valid) {
          // If the promotion tab is not valid, we want to set the tab state to in-progress
          // and set the tab to the promotion tab
          setTabState({
            [Tab.TYPE]: 'completed',
            [Tab.PROMOTION]: 'in-progress',
            [Tab.CAMPAIGN]: 'not-started'
          });
          setTab(Tab.PROMOTION);
          break;
        }

        setTabState(prev => ({
          ...prev,
          [Tab.PROMOTION]: 'completed',
          [Tab.CAMPAIGN]: 'in-progress'
        }));
        setTab(tab);
        break;
      }
    }
  };

  const handleContinue = async () => {
    switch (tab) {
      case Tab.TYPE:
        handleTabChange(Tab.PROMOTION);
        break;
      case Tab.PROMOTION: {
        const valid = await form.trigger();

        if (valid) {
          handleTabChange(Tab.CAMPAIGN);
        }

        break;
      }
      case Tab.CAMPAIGN:
        break;
    }
  };

  const watchTemplateId = useWatch({
    control: form.control,
    name: 'template_id'
  });

  const currentTemplate = useMemo(() => {
    const currentTemplate = templates.find(template => template.id === watchTemplateId);

    if (!currentTemplate) {
      return;
    }

    reset({ ...defaultValues, template_id: watchTemplateId });

    for (const [key, value] of Object.entries(currentTemplate.defaults)) {
      if (typeof value === 'object') {
        for (const [subKey, subValue] of Object.entries(value)) {
          setValue(`application_method.${subKey}`, subValue);
        }
      } else {
        setValue(key, value);
      }
    }

    return currentTemplate;
  }, [watchTemplateId, setValue, reset]);

  const watchValueType = useWatch({
    control: form.control,
    name: 'application_method.type'
  });

  const isFixedValueType = watchValueType === 'fixed';
  const watchAllocation = useWatch({
    control: form.control,
    name: 'application_method.allocation'
  });

  useEffect(() => {
    if (watchAllocation) {
      setAllocationMode(watchAllocation as AllocationMode);
    }
  }, [watchAllocation]);

  const watchType = useWatch({
    control: form.control,
    name: 'type'
  });

  const isTypeStandard = watchType === 'standard';
  const isTypeBuyGet = watchType === 'buyget';

  const targetType = useWatch({
    control: form.control,
    name: 'application_method.target_type'
  });

  const isTargetTypeOrder = targetType === 'order';

  const formData = form.getValues();
  let campaignQuery: object = {};

  if (formData.application_method.currency_code) {
    campaignQuery = {
      budget: { currency_code: formData.application_method.currency_code }
    };
  }

  const { campaigns } = useCampaigns(campaignQuery);

  const watchCampaignChoice = useWatch({
    control: form.control,
    name: 'campaign_choice'
  });

  useEffect(() => {
    const formData = getValues();

    if (watchCampaignChoice !== 'existing') {
      setValue('campaign_id', undefined);
      form.clearErrors('campaign_id');
    }

    if (watchCampaignChoice !== 'new') {
      setValue('campaign', undefined);
    }

    if (watchCampaignChoice === 'new') {
      if (!formData.campaign || !formData.campaign?.budget?.type) {
        setValue('campaign', {
          ...DEFAULT_CAMPAIGN_VALUES,
          budget: {
            ...DEFAULT_CAMPAIGN_VALUES.budget,
            currency_code: formData.application_method.currency_code
          }
        });
      }
    }
  }, [watchCampaignChoice, getValues, setValue]);

  const watchRules = useWatch({
    control: form.control,
    name: 'rules'
  });

  const watchCurrencyRule = watchRules.find(rule => rule.attribute === 'currency_code');

  if (watchCurrencyRule) {
    const formData = form.getValues();
    const currencyCode = formData.application_method.currency_code;
    const ruleValue = watchCurrencyRule.values;

    if (!Array.isArray(ruleValue) && currencyCode !== ruleValue) {
      form.setValue('application_method.currency_code', ruleValue as string);
    }
  }

  return (
    <RouteFocusModal.Form
      form={form}
      data-testid="promotion-create-form"
    >
      <KeyboundForm
        className="flex h-full flex-col"
        onSubmit={handleSubmit}
      >
        <ProgressTabs
          dir={direction}
          value={tab}
          onValueChange={tab => handleTabChange(tab as Tab)}
          className="flex h-full flex-col overflow-hidden"
          data-testid="promotion-create-form-tabs"
        >
          <RouteFocusModal.Header data-testid="promotion-create-form-header">
            <div className="flex w-full items-center justify-between gap-x-4">
              <div className="-my-2 w-full max-w-[600px] border-l">
                <ProgressTabs.List
                  className="grid w-full grid-cols-3"
                  data-testid="promotion-create-form-tabs-list"
                >
                  <ProgressTabs.Trigger
                    className="w-full"
                    value={Tab.TYPE}
                    status={tabState[Tab.TYPE]}
                    data-testid="promotion-create-form-tab-type"
                  >
                    {t('promotions.tabs.template')}
                  </ProgressTabs.Trigger>

                  <ProgressTabs.Trigger
                    className="w-full"
                    value={Tab.PROMOTION}
                    status={tabState[Tab.PROMOTION]}
                    data-testid="promotion-create-form-tab-promotion"
                  >
                    {t('promotions.tabs.details')}
                  </ProgressTabs.Trigger>

                  <ProgressTabs.Trigger
                    className="w-full"
                    value={Tab.CAMPAIGN}
                    status={tabState[Tab.CAMPAIGN]}
                    data-testid="promotion-create-form-tab-campaign"
                  >
                    {t('promotions.tabs.campaign')}
                  </ProgressTabs.Trigger>
                </ProgressTabs.List>
              </div>
            </div>
          </RouteFocusModal.Header>

          <RouteFocusModal.Body
            className="size-full overflow-hidden"
            data-testid="promotion-create-form-body"
          >
            <ProgressTabs.Content
              value={Tab.TYPE}
              className="size-full overflow-y-auto"
              data-testid="promotion-create-form-content-type"
            >
              <div className="flex size-full flex-col items-center">
                <div className="w-full max-w-[720px] py-16">
                  <Form.Field
                    control={form.control}
                    name="template_id"
                    render={({ field }) => {
                      return (
                        <Form.Item data-testid="promotion-create-form-template-item">
                          <Form.Label data-testid="promotion-create-form-template-label">
                            {t('promotions.fields.type')}
                          </Form.Label>

                          <Form.Control data-testid="promotion-create-form-template-control">
                            <RadioGroup
                              dir={direction}
                              key="template_id"
                              className="flex-col gap-y-3"
                              {...field}
                              onValueChange={field.onChange}
                              data-testid="promotion-create-form-template-radio-group"
                            >
                              {templates.map(template => {
                                return (
                                  <RadioGroup.ChoiceBox
                                    key={template.id}
                                    value={template.id}
                                    label={template.title}
                                    description={template.description}
                                    data-testid={`promotion-create-form-template-option-${template.id}`}
                                  />
                                );
                              })}
                            </RadioGroup>
                          </Form.Control>
                          <Form.ErrorMessage data-testid="promotion-create-form-template-error" />
                        </Form.Item>
                      );
                    }}
                  />
                </div>
              </div>
            </ProgressTabs.Content>

            <ProgressTabs.Content
              value={Tab.PROMOTION}
              className="size-full overflow-y-auto"
              data-testid="promotion-create-form-content-promotion"
            >
              <div className="flex size-full flex-col items-center">
                <div className="flex w-full max-w-[720px] flex-col gap-y-8 py-16">
                  <Heading
                    level="h1"
                    className="text-fg-base"
                    data-testid="promotion-create-form-promotion-heading"
                  >
                    {t(`promotions.sections.details`)}

                    {currentTemplate?.title && (
                      <Badge
                        className="ml-2 align-middle"
                        color="grey"
                        size="2xsmall"
                        rounded="full"
                        data-testid="promotion-create-form-promotion-template-badge"
                      >
                        {currentTemplate?.title}
                      </Badge>
                    )}
                  </Heading>

                  {form.formState.errors.root && (
                    <Alert
                      variant="error"
                      dismissible={false}
                      className="text-balance"
                      data-testid="promotion-create-form-promotion-error-alert"
                    >
                      {form.formState.errors.root.message}
                    </Alert>
                  )}

                  <Form.Field
                    control={form.control}
                    name="is_automatic"
                    render={({ field }) => {
                      return (
                        <Form.Item data-testid="promotion-create-form-method-item">
                          <Form.Label data-testid="promotion-create-form-method-label">
                            {t('promotions.form.method.label')}
                          </Form.Label>

                          <Form.Control data-testid="promotion-create-form-method-control">
                            <RadioGroup
                              dir={direction}
                              className="flex gap-y-3"
                              {...field}
                              value={field.value}
                              onValueChange={field.onChange}
                              data-testid="promotion-create-form-method-radio-group"
                            >
                              <RadioGroup.ChoiceBox
                                value="false"
                                label={t('promotions.form.method.code.title')}
                                description={t('promotions.form.method.code.description')}
                                className={clx('basis-1/2')}
                                data-testid="promotion-create-form-method-option-code"
                              />

                              <RadioGroup.ChoiceBox
                                value="true"
                                label={t('promotions.form.method.automatic.title')}
                                description={t('promotions.form.method.automatic.description')}
                                className={clx('basis-1/2')}
                                data-testid="promotion-create-form-method-option-automatic"
                              />
                            </RadioGroup>
                          </Form.Control>
                          <Form.ErrorMessage data-testid="promotion-create-form-method-error" />
                        </Form.Item>
                      );
                    }}
                  />

                  <Form.Field
                    control={form.control}
                    name="status"
                    render={({ field }) => {
                      return (
                        <Form.Item data-testid="promotion-create-form-status-item">
                          <Form.Label data-testid="promotion-create-form-status-label">
                            {t('promotions.form.status.label')}
                          </Form.Label>

                          <Form.Control data-testid="promotion-create-form-status-control">
                            <RadioGroup
                              dir={direction}
                              className="flex gap-y-3"
                              {...field}
                              value={field.value}
                              onValueChange={field.onChange}
                              data-testid="promotion-create-form-status-radio-group"
                            >
                              <RadioGroup.ChoiceBox
                                value="draft"
                                label={t('promotions.form.status.draft.title')}
                                description={t('promotions.form.status.draft.description')}
                                className={clx('basis-1/2')}
                                data-testid="promotion-create-form-status-option-draft"
                              />

                              <RadioGroup.ChoiceBox
                                value="active"
                                label={t('promotions.form.status.active.title')}
                                description={t('promotions.form.status.active.description')}
                                className={clx('basis-1/2')}
                                data-testid="promotion-create-form-status-option-active"
                              />
                            </RadioGroup>
                          </Form.Control>
                          <Form.ErrorMessage data-testid="promotion-create-form-status-error" />
                        </Form.Item>
                      );
                    }}
                  />

                  <div className="flex gap-y-4">
                    <Form.Field
                      control={form.control}
                      name="code"
                      render={({ field }) => {
                        return (
                          <Form.Item
                            className="basis-1/2"
                            data-testid="promotion-create-form-code-item"
                          >
                            <Form.Label data-testid="promotion-create-form-code-label">
                              {t('promotions.form.code.title')}
                            </Form.Label>

                            <Form.Control data-testid="promotion-create-form-code-control">
                              <Input
                                {...field}
                                placeholder="SUMMER15"
                                data-testid="promotion-create-form-code-input"
                              />
                            </Form.Control>

                            <Text
                              size="small"
                              leading="compact"
                              className="text-ui-fg-subtle"
                              data-testid="promotion-create-form-code-description"
                            >
                              <Trans
                                t={t}
                                i18nKey="promotions.form.code.description"
                                components={[<br key="break" />]}
                              />
                            </Text>
                            <Form.ErrorMessage data-testid="promotion-create-form-code-error" />
                          </Form.Item>
                        );
                      }}
                    />
                  </div>

                  {!currentTemplate?.hiddenFields?.includes('is_tax_inclusive') && (
                    <>
                      <Divider />
                      <div className="flex gap-x-2 gap-y-4">
                        <Form.Field
                          control={form.control}
                          name="is_tax_inclusive"
                          render={({ field: { onChange, value, ...field } }) => {
                            return (
                              <Form.Item
                                className="basis-full"
                                data-testid="promotion-create-form-tax-inclusive-item"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="block">
                                    <Form.Label data-testid="promotion-create-form-tax-inclusive-label">
                                      {t('promotions.form.taxInclusive.title')}
                                    </Form.Label>
                                    <Form.Hint
                                      className="!mt-1"
                                      data-testid="promotion-create-form-tax-inclusive-hint"
                                    >
                                      {t('promotions.form.taxInclusive.description')}
                                    </Form.Hint>
                                  </div>
                                  <Form.Control
                                    className="mr-2 self-center"
                                    data-testid="promotion-create-form-tax-inclusive-control"
                                  >
                                    <Switch
                                      dir="ltr"
                                      className="mt-[2px] rtl:rotate-180"
                                      checked={!!value}
                                      onCheckedChange={onChange}
                                      {...field}
                                      data-testid="promotion-create-form-tax-inclusive-switch"
                                    />
                                  </Form.Control>
                                </div>
                                <Form.ErrorMessage data-testid="promotion-create-form-tax-inclusive-error" />
                              </Form.Item>
                            );
                          }}
                        />
                      </div>
                    </>
                  )}

                  {!currentTemplate?.hiddenFields?.includes('type') && (
                    <Form.Field
                      control={form.control}
                      name="type"
                      render={({ field }) => {
                        return (
                          <Form.Item data-testid="promotion-create-form-type-item">
                            <Form.Label data-testid="promotion-create-form-type-label">
                              {t('promotions.fields.type')}
                            </Form.Label>
                            <Form.Control data-testid="promotion-create-form-type-control">
                              <RadioGroup
                                dir={direction}
                                className="flex gap-y-3"
                                {...field}
                                onValueChange={field.onChange}
                                data-testid="promotion-create-form-type-radio-group"
                              >
                                <RadioGroup.ChoiceBox
                                  value="standard"
                                  label={t('promotions.form.type.standard.title')}
                                  description={t('promotions.form.type.standard.description')}
                                  className={clx('basis-1/2')}
                                  data-testid="promotion-create-form-type-option-standard"
                                />

                                <RadioGroup.ChoiceBox
                                  value="buyget"
                                  label={t('promotions.form.type.buyget.title')}
                                  description={t('promotions.form.type.buyget.description')}
                                  className={clx('basis-1/2')}
                                  data-testid="promotion-create-form-type-option-buyget"
                                />
                              </RadioGroup>
                            </Form.Control>
                            <Form.ErrorMessage data-testid="promotion-create-form-type-error" />
                          </Form.Item>
                        );
                      }}
                    />
                  )}

                  <Divider />

                  <RulesFormField
                    form={form}
                    ruleType="rules"
                  />

                  {!currentTemplate?.hiddenFields?.includes('application_method.type') && (
                    <>
                      <Divider />
                      <Form.Field
                        control={form.control}
                        name="application_method.type"
                        render={({ field }) => {
                          return (
                            <Form.Item data-testid="promotion-create-form-value-type-item">
                              <Form.Label data-testid="promotion-create-form-value-type-label">
                                {t('promotions.fields.value_type')}
                              </Form.Label>
                              <Form.Control data-testid="promotion-create-form-value-type-control">
                                <RadioGroup
                                  dir={direction}
                                  className="flex gap-y-3"
                                  {...field}
                                  onValueChange={field.onChange}
                                  data-testid="promotion-create-form-value-type-radio-group"
                                >
                                  <RadioGroup.ChoiceBox
                                    value="fixed"
                                    label={t('promotions.form.value_type.fixed.title')}
                                    description={t('promotions.form.value_type.fixed.description')}
                                    className={clx('basis-1/2')}
                                    data-testid="promotion-create-form-value-type-option-fixed"
                                  />

                                  <RadioGroup.ChoiceBox
                                    value="percentage"
                                    label={t('promotions.form.value_type.percentage.title')}
                                    description={t(
                                      'promotions.form.value_type.percentage.description'
                                    )}
                                    className={clx('basis-1/2')}
                                    data-testid="promotion-create-form-value-type-option-percentage"
                                  />
                                </RadioGroup>
                              </Form.Control>
                              <Form.ErrorMessage data-testid="promotion-create-form-value-type-error" />
                            </Form.Item>
                          );
                        }}
                      />
                    </>
                  )}

                  {!currentTemplate?.hiddenFields?.includes('application_method.value') && (
                    <>
                      <Divider />
                      <Form.Field
                        control={form.control}
                        name="application_method.value"
                        render={({ field: { onChange, value, ...field } }) => {
                          const currencyCode = form.getValues().application_method.currency_code;

                          const currencyInfo = currencies[currencyCode?.toUpperCase() || 'USD'];

                          return (
                            <Form.Item
                              className="basis-1/2"
                              data-testid="promotion-create-form-value-item"
                            >
                              <Form.Label
                                tooltip={
                                  currencyCode || !isFixedValueType
                                    ? undefined
                                    : t('promotions.fields.amount.tooltip')
                                }
                                data-testid="promotion-create-form-value-label"
                              >
                                {t('promotions.form.value.title')}
                              </Form.Label>

                              <Form.Control data-testid="promotion-create-form-value-control">
                                {isFixedValueType ? (
                                  <CurrencyInput
                                    {...field}
                                    min={0}
                                    code={currencyCode || 'USD'}
                                    onValueChange={(_value, _name, values) =>
                                      onChange(values?.value)
                                    }
                                    decimalScale={currencyInfo?.decimal_digits ?? 2}
                                    decimalsLimit={currencyInfo?.decimal_digits ?? 2}
                                    symbol={currencyCode ? getCurrencySymbol(currencyCode) : '$'}
                                    value={value}
                                    disabled={!currencyCode}
                                    data-testid="promotion-create-form-value-currency-input"
                                  />
                                ) : (
                                  <DeprecatedPercentageInput
                                    key="amount"
                                    className="text-right"
                                    min={0}
                                    max={100}
                                    {...field}
                                    value={value}
                                    onChange={e => {
                                      onChange(
                                        e.target.value === '' ? null : parseFloat(e.target.value)
                                      );
                                    }}
                                    data-testid="promotion-create-form-value-percentage-input"
                                  />
                                )}
                              </Form.Control>
                              <Text
                                size="small"
                                leading="compact"
                                className="text-ui-fg-subtle"
                                data-testid="promotion-create-form-value-description"
                              >
                                <Trans
                                  t={t}
                                  i18nKey={
                                    isFixedValueType
                                      ? 'promotions.form.value_type.fixed.description'
                                      : 'promotions.form.value_type.percentage.description'
                                  }
                                  components={[<br key="break" />]}
                                />
                              </Text>
                              <Form.ErrorMessage data-testid="promotion-create-form-value-error" />
                            </Form.Item>
                          );
                        }}
                      />
                    </>
                  )}

                  {(isTypeStandard || isTypeBuyGet) && allocationMode !== 'across' && (
                    <>
                      {isTypeBuyGet && (
                        <>
                          <Divider />
                        </>
                      )}
                      <Form.Field
                        control={form.control}
                        name="application_method.max_quantity"
                        render={() => {
                          return (
                            <Form.Item
                              className="basis-1/2"
                              data-testid="promotion-create-form-max-quantity-item"
                            >
                              <Form.Label data-testid="promotion-create-form-max-quantity-label">
                                {t('promotions.form.max_quantity.title')}
                              </Form.Label>

                              <Form.Control data-testid="promotion-create-form-max-quantity-control">
                                <Input
                                  {...form.register('application_method.max_quantity', {
                                    valueAsNumber: true
                                  })}
                                  type="number"
                                  min={1}
                                  placeholder="3"
                                  data-testid="promotion-create-form-max-quantity-input"
                                />
                              </Form.Control>

                              <Text
                                size="small"
                                leading="compact"
                                className="text-ui-fg-subtle"
                                data-testid="promotion-create-form-max-quantity-description"
                              >
                                <Trans
                                  t={t}
                                  i18nKey="promotions.form.max_quantity.description"
                                  components={[<br key="break" />]}
                                />
                              </Text>
                              <Form.ErrorMessage data-testid="promotion-create-form-max-quantity-error" />
                            </Form.Item>
                          );
                        }}
                      />
                    </>
                  )}

                  {!currentTemplate?.hiddenFields?.includes('application_method.allocation') && (
                    <Form.Field
                      control={form.control}
                      name="application_method.allocation"
                      render={({ field }) => {
                        const handleAllocationChange = (value: AllocationMode) => {
                          setAllocationMode(value);
                          setValue(
                            'application_method.allocation',
                            value as ApplicationMethodAllocationValues
                          );
                          field.onChange(value as ApplicationMethodAllocationValues);

                          if (value === 'once') {
                            setValue('application_method.max_quantity', 1);
                          }
                        };

                        return (
                          <Form.Item data-testid="promotion-create-form-allocation-item">
                            <Form.Label data-testid="promotion-create-form-allocation-label">
                              {t('promotions.fields.allocation')}
                            </Form.Label>

                            <Form.Control data-testid="promotion-create-form-allocation-control">
                              <RadioGroup
                                dir={direction}
                                className="flex gap-y-3"
                                value={allocationMode}
                                onValueChange={val => handleAllocationChange(val as AllocationMode)}
                                data-testid="promotion-create-form-allocation-radio-group"
                              >
                                <RadioGroup.ChoiceBox
                                  value="each"
                                  label={t('promotions.form.allocation.each.title')}
                                  description={t('promotions.form.allocation.each.description')}
                                  className={clx('basis-1/2')}
                                  data-testid="promotion-create-form-allocation-option-each"
                                />

                                <RadioGroup.ChoiceBox
                                  value="once"
                                  label={t('promotions.form.allocation.once.title', {
                                    defaultValue: 'Once'
                                  })}
                                  description={t('promotions.form.allocation.once.description', {
                                    defaultValue: 'Limit discount to max quantity'
                                  })}
                                  className={clx('basis-1/2')}
                                  data-testid="promotion-create-form-allocation-option-once"
                                />

                                <RadioGroup.ChoiceBox
                                  value="across"
                                  label={t('promotions.form.allocation.across.title')}
                                  description={t('promotions.form.allocation.across.description')}
                                  className={clx('basis-1/2')}
                                  data-testid="promotion-create-form-allocation-option-across"
                                />
                              </RadioGroup>
                            </Form.Control>
                            <Form.ErrorMessage data-testid="promotion-create-form-allocation-error" />
                          </Form.Item>
                        );
                      }}
                    />
                  )}

                  {!isTypeStandard && (
                    <>
                      <Divider />
                      <RulesFormField
                        form={form}
                        ruleType="buy-rules"
                        scope="application_method.buy_rules"
                      />
                    </>
                  )}

                  {!isTargetTypeOrder && (
                    <>
                      <Divider />
                      <RulesFormField
                        form={form}
                        ruleType="target-rules"
                        scope="application_method.target_rules"
                      />
                    </>
                  )}
                </div>
              </div>
            </ProgressTabs.Content>

            <ProgressTabs.Content
              value={Tab.CAMPAIGN}
              className="size-full overflow-auto"
              data-testid="promotion-create-form-content-campaign"
            >
              <div className="flex flex-col items-center">
                <div className="flex w-full max-w-[720px] flex-col gap-y-8 py-16">
                  <AddCampaignPromotionFields
                    form={form}
                    campaigns={campaigns || []}
                  />
                </div>
              </div>
            </ProgressTabs.Content>
          </RouteFocusModal.Body>
        </ProgressTabs>
        <RouteFocusModal.Footer data-testid="promotion-create-form-footer">
          <div className="flex items-center justify-end gap-x-2">
            <RouteFocusModal.Close asChild>
              <Button
                variant="secondary"
                size="small"
                data-testid="promotion-create-form-cancel-button"
              >
                {t('actions.cancel')}
              </Button>
            </RouteFocusModal.Close>

            {tab === Tab.CAMPAIGN ? (
              <Button
                key="save-btn"
                type="submit"
                size="small"
                isLoading={false}
                data-testid="promotion-create-form-save-button"
              >
                {t('actions.save')}
              </Button>
            ) : (
              <Button
                key="continue-btn"
                type="button"
                onClick={handleContinue}
                size="small"
                data-testid="promotion-create-form-continue-button"
              >
                {t('actions.continue')}
              </Button>
            )}
          </div>
        </RouteFocusModal.Footer>
      </KeyboundForm>
    </RouteFocusModal.Form>
  );
};
