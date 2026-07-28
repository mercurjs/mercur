import { useEffect } from 'react';

import { AdminPromotion } from '@medusajs/types';
import {
  Button,
  CurrencyInput,
  Divider,
  Input,
  RadioGroup,
  Text,
  toast,
} from '@medusajs/ui';
import i18n from 'i18next';
import { useWatch } from 'react-hook-form';
import { Trans, useTranslation } from 'react-i18next';
import * as zod from 'zod';

import {
  FormExtensionZone,
  useExtendableForm,
} from "@mercurjs/dashboard-shared"

import { Form } from "@components/common/form"
import { SwitchBox } from "@components/common/switch-box"
import { DeprecatedPercentageInput } from "@components/inputs/percentage-input"
import { RouteDrawer, useRouteModal } from "@components/modals"
import { KeyboundForm } from "@components/utilities/keybound-form"
import { getCurrencySymbol } from "@lib/data/currencies"
import { useUpdatePromotion } from "@hooks/api/promotions"

type EditPromotionFormProps = {
  promotion: AdminPromotion;
};

const EditPromotionSchema = zod.object({
  is_automatic: zod.string().toLowerCase(),
  code: zod.string().min(1, { message: i18n.t('validation.requiredField') }),
  is_tax_inclusive: zod.boolean().optional(),
  status: zod.enum(['active', 'inactive', 'draft']),
  value_type: zod.enum(['fixed', 'percentage']),
  value: zod
    .number()
    .min(0, { message: i18n.t('validation.requiredField') })
    .or(zod.string().min(1, { message: i18n.t('validation.requiredField') })),
  allocation: zod.enum(['each', 'across', 'once']),
  target_type: zod.enum(['order', 'shipping_methods', 'items']),
  max_quantity: zod.number().min(1).optional().nullable(),
  limit: zod.number().int().min(1).optional().nullable()
});

export const EditPromotionDetailsForm = ({ promotion }: EditPromotionFormProps) => {
  const { t } = useTranslation();
  const { handleSuccess } = useRouteModal();

  const form = useExtendableForm({
    schema: EditPromotionSchema,
    model: "promotion",
    zone: "edit",
    data: promotion,
    defaultValues: {
      is_automatic: promotion.is_automatic!.toString(),
      is_tax_inclusive: promotion.is_tax_inclusive ?? false,
      code: promotion.code!,
      status: promotion.status as 'active' | 'inactive' | 'draft',
      value: promotion.application_method!.value as number,
      value_type: promotion.application_method!.type as 'fixed' | 'percentage',
      allocation: promotion.application_method!.allocation as
        | 'each'
        | 'across'
        | 'once',
      target_type: promotion.application_method!.target_type as
        | 'order'
        | 'shipping_methods'
        | 'items',
      max_quantity: promotion.application_method?.max_quantity ?? 1,
      limit: promotion.limit ?? null
    }
  });

  const { mutateAsync, isPending } = useUpdatePromotion(promotion.id);

  const watchValueType = useWatch({
    control: form.control,
    name: 'value_type'
  });
  const isFixedValueType = watchValueType === 'fixed';

  const watchAllocation = useWatch({
    control: form.control,
    name: 'allocation'
  });

  const currencyCode = promotion.application_method?.currency_code;
  const isTargetTypeShipping =
    promotion.application_method?.target_type === 'shipping_methods';
  const canBeTaxInclusive =
    isFixedValueType && promotion.type === 'standard';

  useEffect(() => {
    if (!canBeTaxInclusive) {
      form.setValue('is_tax_inclusive', false);
    }
  }, [canBeTaxInclusive, form]);

  const handleSubmit = form.handleSubmit(async data => {
    const value = parseFloat(String(data.value));

    if (isNaN(value) || value < 0) {
      form.setError('value', {
        message: t('promotions.form.value.invalid')
      });
      return;
    }

    await mutateAsync(
      {
        is_automatic: data.is_automatic === 'true',
        code: data.code,
        status: data.status,
        is_tax_inclusive: data.is_tax_inclusive,
        limit: data.is_automatic === 'true' ? undefined : data.limit,
        application_method: {
          value,
          type: data.value_type,
          allocation: data.allocation,
          max_quantity: data.max_quantity
        },
      },
      {
        onSuccess: () => {
          toast.success(t('promotions.toasts.promotionUpdateSuccess'));
          handleSuccess();
        },
        onError: e => {
          toast.error(e.message);
        }
      }
    );
  });

  return (
    <RouteDrawer.Form form={form}>
      <KeyboundForm
        onSubmit={handleSubmit}
        className="flex flex-1 flex-col overflow-hidden"
      >
        <RouteDrawer.Body className="flex flex-1 flex-col gap-y-8 overflow-y-auto">
          <div className="flex flex-col gap-y-8">
            <Form.Field
              control={form.control}
              name="is_automatic"
              render={({ field }) => {
                return (
                  <Form.Item>
                    <Form.Label>{t('promotions.form.method.label')}</Form.Label>
                    <Form.Control>
                      <RadioGroup
                        className="flex-col gap-y-3"
                        {...field}
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <RadioGroup.ChoiceBox
                          value={'false'}
                          label={t('promotions.form.method.code.title')}
                          description={t('promotions.form.method.code.description')}
                        />
                        <RadioGroup.ChoiceBox
                          value={'true'}
                          label={t('promotions.form.method.automatic.title')}
                          description={t('promotions.form.method.automatic.description')}
                        />
                      </RadioGroup>
                    </Form.Control>
                    <Form.ErrorMessage />
                  </Form.Item>
                );
              }}
            />

            <Form.Field
              control={form.control}
              name="status"
              render={({ field }) => {
                return (
                  <Form.Item>
                    <Form.Label>{t('promotions.form.status.label')}</Form.Label>
                    <Form.Control>
                      <RadioGroup
                        className="flex-col gap-y-3"
                        {...field}
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <RadioGroup.ChoiceBox
                          value={'draft'}
                          label={t('promotions.form.status.draft.title')}
                          description={t('promotions.form.status.draft.description')}
                        />

                        <RadioGroup.ChoiceBox
                          value={'active'}
                          label={t('promotions.form.status.active.title')}
                          description={t('promotions.form.status.active.description')}
                        />

                        <RadioGroup.ChoiceBox
                          value={'inactive'}
                          label={t('promotions.form.status.inactive.title')}
                          description={t('promotions.form.status.inactive.description')}
                        />
                      </RadioGroup>
                    </Form.Control>
                    <Form.ErrorMessage />
                  </Form.Item>
                );
              }}
            />

            {canBeTaxInclusive && (
              <SwitchBox
                control={form.control}
                name="is_tax_inclusive"
                label={t('promotions.form.taxInclusive.title')}
                description={t('promotions.form.taxInclusive.description')}
              />
            )}

            <div className="flex flex-col gap-y-4">
              <Form.Field
                control={form.control}
                name="code"
                render={({ field }) => {
                  return (
                    <Form.Item>
                      <Form.Label>{t('promotions.form.code.title')}</Form.Label>

                      <Form.Control>
                        <Input {...field} />
                      </Form.Control>
                    </Form.Item>
                  );
                }}
              />

              <Text
                size="small"
                leading="compact"
                className="text-ui-fg-subtle"
              >
                <Trans
                  t={t}
                  i18nKey="promotions.form.code.description"
                  components={[<br key="break" />]}
                />
              </Text>
            </div>

            {!isTargetTypeShipping && (
              <>
                {promotion.type !== 'buyget' && (
                <Form.Field
                  control={form.control}
                  name="value_type"
                  render={({ field }) => {
                    return (
                      <Form.Item>
                        <Form.Label>{t('promotions.fields.value_type')}</Form.Label>
                        <Form.Control>
                          <RadioGroup
                            className="flex-col gap-y-3"
                            {...field}
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <RadioGroup.ChoiceBox
                              value={'fixed'}
                              label={t('promotions.form.value_type.fixed.title')}
                              description={t('promotions.form.value_type.fixed.description')}
                            />
                            <RadioGroup.ChoiceBox
                              value={'percentage'}
                              label={t('promotions.form.value_type.percentage.title')}
                              description={t('promotions.form.value_type.percentage.description')}
                            />
                          </RadioGroup>
                        </Form.Control>
                        <Form.ErrorMessage />
                      </Form.Item>
                    );
                  }}
                />
                )}

                <Form.Field
                  control={form.control}
                  name="allocation"
                  render={({ field }) => {
                    return (
                      <Form.Item>
                        <Form.Label>{t('promotions.fields.allocation')}</Form.Label>
                        <Form.Control>
                          <RadioGroup
                            className="flex-col gap-y-3"
                            {...field}
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <RadioGroup.ChoiceBox
                              value={'each'}
                              label={t('promotions.form.allocation.each.title')}
                              description={t('promotions.form.allocation.each.description')}
                            />
                            <RadioGroup.ChoiceBox
                              value={'once'}
                              label={t('promotions.form.allocation.once.title')}
                              description={t('promotions.form.allocation.once.description')}
                            />
                          </RadioGroup>
                        </Form.Control>
                        <Form.ErrorMessage />
                      </Form.Item>
                    );
                  }}
                />

                <div className="flex flex-col gap-y-8">
                  {promotion.type !== 'buyget' && (
                  <Form.Field
                    control={form.control}
                    name="value"
                    render={({ field: { onChange, value, ...field } }) => {
                      return (
                        <Form.Item>
                          <Form.Label>
                            {isFixedValueType
                              ? t('promotions.form.value.title')
                              : t('fields.percentage')}
                          </Form.Label>
                          <Form.Control>
                            {isFixedValueType ? (
                              <CurrencyInput
                                {...field}
                                min={0}
                                onValueChange={val => {
                                  onChange(val ? parseInt(val) : '');
                                }}
                                code={currencyCode || 'USD'}
                                symbol={
                                  currencyCode
                                    ? getCurrencySymbol(currencyCode)
                                    : '$'
                                }
                                value={value}
                              />
                            ) : (
                              <DeprecatedPercentageInput
                                key="amount"
                                min={0}
                                max={100}
                                {...field}
                                value={value || ''}
                                onChange={e => {
                                  onChange(
                                    e.target.value === ''
                                      ? null
                                      : parseInt(e.target.value)
                                  );
                                }}
                              />
                            )}
                          </Form.Control>
                          <Form.ErrorMessage />
                        </Form.Item>
                      );
                    }}
                  />
                  )}

                  {(watchAllocation === 'each' || watchAllocation === 'once') && (
                    <Form.Field
                      control={form.control}
                      name="max_quantity"
                      render={() => {
                        return (
                          <Form.Item>
                            <Form.Label>{t('promotions.form.max_quantity.title')}</Form.Label>
                            <Form.Control>
                              <Input
                                {...form.register('max_quantity', {
                                  valueAsNumber: true
                                })}
                                type="number"
                                min={1}
                                placeholder="999"
                              />
                            </Form.Control>
                            <Text
                              size="small"
                              leading="compact"
                              className="text-ui-fg-subtle"
                            >
                              <Trans
                                t={t}
                                i18nKey="promotions.form.max_quantity.description"
                                components={[<br key="break" />]}
                              />
                            </Text>
                            <Form.ErrorMessage />
                          </Form.Item>
                        );
                      }}
                    />
                  )}
                </div>
              </>
            )}

            <Divider />

            <Form.Field
              control={form.control}
              name="limit"
              render={({ field: { onChange, value, ...field } }) => {
                return (
                  <Form.Item>
                    <Form.Label optional>
                      {t('promotions.form.usageLimit.title')}
                    </Form.Label>
                    <Form.Control>
                      <Input
                        type="number"
                        min={1}
                        {...field}
                        value={value ?? ''}
                        onChange={e => {
                          onChange(
                            e.target.value === ''
                              ? null
                              : parseInt(e.target.value)
                          );
                        }}
                      />
                    </Form.Control>
                    <Text
                      size="small"
                      leading="compact"
                      className="text-ui-fg-subtle"
                    >
                      {t('promotions.form.usageLimit.description')}
                    </Text>
                    <Form.ErrorMessage />
                  </Form.Item>
                );
              }}
            />

            <FormExtensionZone
              model="promotion"
              zone="edit"
              control={form.control}
              data={promotion}
            />
          </div>
        </RouteDrawer.Body>

        <RouteDrawer.Footer>
          <div className="flex items-center justify-end gap-x-2">
            <RouteDrawer.Close asChild>
              <Button
                size="small"
                variant="secondary"
              >
                {t('actions.cancel')}
              </Button>
            </RouteDrawer.Close>

            <Button
              size="small"
              type="submit"
              isLoading={isPending}
            >
              {t('actions.save')}
            </Button>
          </div>
        </RouteDrawer.Footer>
      </KeyboundForm>
    </RouteDrawer.Form>
  );
};
