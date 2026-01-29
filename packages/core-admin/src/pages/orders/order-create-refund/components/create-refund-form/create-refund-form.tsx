import { useEffect, useMemo, useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { HttpTypes } from '@medusajs/types';
import { Button, CurrencyInput, Label, Select, Textarea, toast } from '@medusajs/ui';
import { formatValue } from 'react-currency-input-field';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import * as zod from 'zod';

import { Form } from '../../../../../components/common/form';
import { RouteDrawer, useRouteModal } from '../../../../../components/modals';
import { KeyboundForm } from '../../../../../components/utilities/keybound-form';
import { useRefundPayment, useRefundReasons } from '../../../../../hooks/api';
import { useDocumentDirection } from '../../../../../hooks/use-document-direction';
import { currencies } from '../../../../../lib/data/currencies';
import { formatCurrency } from '../../../../../lib/format-currency';
import { formatProvider } from '../../../../../lib/format-provider.ts';
import { getLocaleAmount } from '../../../../../lib/money-amount-helpers';
import { getPaymentsFromOrder } from '../../../../../lib/orders';

type CreateRefundFormProps = {
  order: HttpTypes.AdminOrder;
};

const CreateRefundSchema = zod.object({
  amount: zod.object({
    value: zod.string().or(zod.number()),
    float: zod.number().or(zod.null())
  }),
  note: zod.string().optional(),
  refund_reason_id: zod.string().optional()
});

export const CreateRefundForm = ({ order }: CreateRefundFormProps) => {
  const { t } = useTranslation();
  const { handleSuccess } = useRouteModal();
  const { refund_reasons } = useRefundReasons();

  const [searchParams] = useSearchParams();
  const hasPaymentIdInSearchParams = !!searchParams.get('paymentId');
  const [paymentId, setPaymentId] = useState<string | undefined>(
    searchParams.get('paymentId') || undefined
  );
  const payments = getPaymentsFromOrder(order);
  const payment = payments.find(p => p.id === paymentId);
  const paymentAmount = payment?.amount || 0;

  const currency = useMemo(
    () => currencies[order.currency_code.toUpperCase()],
    [order.currency_code]
  );

  const direction = useDocumentDirection();
  const form = useForm<zod.infer<typeof CreateRefundSchema>>({
    defaultValues: {
      amount: {
        value: paymentAmount.toFixed(currency.decimal_digits),
        float: paymentAmount
      }
    },
    resolver: zodResolver(CreateRefundSchema)
  });

  useEffect(() => {
    const pendingDifference = order.summary.pending_difference as number;
    const paymentAmount = (payment?.amount || 0) as number;
    const pendingAmount =
      pendingDifference < 0 ? Math.min(Math.abs(pendingDifference), paymentAmount) : paymentAmount;

    const normalizedAmount = pendingAmount < 0 ? pendingAmount * -1 : pendingAmount;

    form.setValue('amount', {
      value: normalizedAmount.toFixed(currency.decimal_digits),
      float: normalizedAmount
    });
  }, [payment?.id || '']);

  const { mutateAsync, isPending } = useRefundPayment(order.id, payment?.id!);

  const handleSubmit = form.handleSubmit(async data => {
    await mutateAsync(
      {
        amount: data.amount.float!,
        note: data.note,
        refund_reason_id: data.refund_reason_id
      },
      {
        onSuccess: () => {
          toast.success(
            t('orders.payment.refundPaymentSuccess', {
              amount: formatCurrency(data.amount.float!, payment?.currency_code!)
            })
          );

          handleSuccess();
        },
        onError: error => {
          toast.error(error.message);
        }
      }
    );
  });

  return (
    <RouteDrawer.Form
      form={form}
      data-testid="order-create-refund-form"
    >
      <KeyboundForm
        onSubmit={handleSubmit}
        className="flex size-full flex-col overflow-hidden"
      >
        <RouteDrawer.Body
          className="flex-1 overflow-auto"
          data-testid="order-create-refund-body"
        >
          <div className="flex flex-col gap-y-4">
            {!hasPaymentIdInSearchParams && (
              <Select
                dir={direction}
                value={paymentId}
                onValueChange={value => {
                  setPaymentId(value);
                }}
                data-testid="order-create-refund-payment-select"
              >
                <Label
                  className="txt-compact-small mb-[-6px] font-sans font-medium"
                  data-testid="order-create-refund-payment-label"
                >
                  {t('orders.payment.selectPaymentToRefund')}
                </Label>

                <Select.Trigger data-testid="order-create-refund-payment-trigger">
                  <Select.Value placeholder={t('orders.payment.selectPaymentToRefund')} />
                </Select.Trigger>

                <Select.Content data-testid="order-create-refund-payment-content">
                  {payments.map(payment => {
                    const totalRefunded =
                      payment.refunds?.reduce((acc, next) => next.amount + acc, 0) || 0;

                    return (
                      <Select.Item
                        value={payment!.id}
                        key={payment.id}
                        disabled={!!payment.canceled_at || totalRefunded >= payment.amount}
                        className="flex items-center justify-center"
                        data-testid={`order-create-refund-payment-option-${payment.id}`}
                      >
                        <span>
                          {getLocaleAmount(payment.amount as number, payment.currency_code)}
                          {' - '}
                        </span>
                        <span>{formatProvider(payment.provider_id)}</span>
                        <span> - (#{payment.id.substring(23)})</span>
                      </Select.Item>
                    );
                  })}
                </Select.Content>
              </Select>
            )}
            {hasPaymentIdInSearchParams && (
              <div
                className="flex items-center"
                data-testid="order-create-refund-payment-display"
              >
                <span>{getLocaleAmount(payment!.amount as number, payment!.currency_code)}</span>
                <span> - </span>
                <span>(#{payment!.id.substring(23)})</span>
              </div>
            )}

            <Form.Field
              control={form.control}
              name="amount"
              rules={{
                required: true,
                min: 0,
                max: paymentAmount
              }}
              render={({ field: { onChange, ...field } }) => {
                return (
                  <Form.Item data-testid="order-create-refund-amount-item">
                    <Form.Label data-testid="order-create-refund-amount-label">
                      {t('fields.amount')}
                    </Form.Label>

                    <Form.Control data-testid="order-create-refund-amount-control">
                      <CurrencyInput
                        {...field}
                        min={0}
                        placeholder={formatValue({
                          value: '0',
                          decimalScale: currency.decimal_digits
                        })}
                        decimalScale={currency.decimal_digits}
                        symbol={currency.symbol_native}
                        code={currency.code}
                        value={field.value.value}
                        onValueChange={(_value, _name, values) =>
                          onChange({
                            value: values?.value ?? '',
                            float: values?.float ?? null
                          })
                        }
                        autoFocus
                        data-testid="order-create-refund-amount-input"
                      />
                    </Form.Control>

                    <Form.ErrorMessage data-testid="order-create-refund-amount-error" />
                  </Form.Item>
                );
              }}
            />

            <Form.Field
              control={form.control}
              name="refund_reason_id"
              render={({ field }) => {
                return (
                  <Form.Item data-testid="order-create-refund-reason-item">
                    <Form.Label data-testid="order-create-refund-reason-label">
                      {t('fields.refundReason')}
                    </Form.Label>

                    <Form.Control data-testid="order-create-refund-reason-control">
                      <Select
                        dir={direction}
                        value={field.value}
                        onValueChange={field.onChange}
                        data-testid="order-create-refund-reason-select"
                      >
                        <Select.Trigger data-testid="order-create-refund-reason-trigger">
                          <Select.Value />
                        </Select.Trigger>

                        <Select.Content data-testid="order-create-refund-reason-content">
                          {refund_reasons?.map((reason: HttpTypes.AdminRefundReason) => (
                            <Select.Item
                              key={reason.id}
                              value={reason.id}
                              data-testid={`order-create-refund-reason-option-${reason.id}`}
                            >
                              {reason.label}
                            </Select.Item>
                          ))}
                        </Select.Content>
                      </Select>
                    </Form.Control>

                    <Form.ErrorMessage data-testid="order-create-refund-reason-error" />
                  </Form.Item>
                );
              }}
            />

            <Form.Field
              control={form.control}
              name={`note`}
              render={({ field }) => {
                return (
                  <Form.Item data-testid="order-create-refund-note-item">
                    <Form.Label data-testid="order-create-refund-note-label">
                      {t('fields.note')}
                    </Form.Label>

                    <Form.Control data-testid="order-create-refund-note-control">
                      <Textarea
                        {...field}
                        data-testid="order-create-refund-note-input"
                      />
                    </Form.Control>

                    <Form.ErrorMessage data-testid="order-create-refund-note-error" />
                  </Form.Item>
                );
              }}
            />
          </div>
        </RouteDrawer.Body>

        <RouteDrawer.Footer data-testid="order-create-refund-footer">
          <div className="flex items-center justify-end gap-x-2">
            <RouteDrawer.Close asChild>
              <Button
                variant="secondary"
                size="small"
                data-testid="order-create-refund-cancel-button"
              >
                {t('actions.cancel')}
              </Button>
            </RouteDrawer.Close>

            <Button
              isLoading={isPending}
              type="submit"
              variant="primary"
              size="small"
              disabled={!!Object.keys(form.formState.errors || {}).length}
              data-testid="order-create-refund-save-button"
            >
              {t('actions.save')}
            </Button>
          </div>
        </RouteDrawer.Footer>
      </KeyboundForm>
    </RouteDrawer.Form>
  );
};
