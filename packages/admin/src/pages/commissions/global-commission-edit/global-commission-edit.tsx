import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Heading, Input, toast } from "@medusajs/ui";
import i18n from "i18next";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import * as zod from "zod";

import { Form } from "../../../components/common/form";
import { SwitchBox } from "../../../components/common/switch-box";
import { Combobox } from "../../../components/inputs/combobox";
import { RouteDrawer, useRouteModal } from "../../../components/modals";
import { KeyboundForm } from "../../../components/utilities/keybound-form";
import {
  useDefaultCommission,
  useUpdateCommissionRule,
} from "../../../hooks/api/commissions";
import { CommissionValueFields } from "../common/components/commission-value-fields";
import { useStoreCurrencies } from "../common/hooks/use-store-currencies";
import { addCommissionValueIssues, optionalAmount } from "../common/schema";
import { CommissionRate } from "../common/types";
import { buildValuesPayload, fixedValuesFromRate } from "../common/utils";

const EditGlobalCommissionSchema = zod.object({
  code: zod
    .string()
    .min(1, { message: i18n.t("commissions.validation.codeRequired") }),
  type: zod.enum(["percentage", "fixed"]),
  value: optionalAmount,
  fixed_values: zod.record(zod.string(), optionalAmount).optional(),
  include_tax: zod.boolean(),
  include_shipping: zod.boolean(),
});

type EditGlobalCommissionSchemaType = zod.infer<
  typeof EditGlobalCommissionSchema
>;

const createEditGlobalCommissionSchema = (currencies: string[]) =>
  EditGlobalCommissionSchema.superRefine((data, ctx) => {
    addCommissionValueIssues(ctx, {
      type: data.type,
      value: data.value,
      fixedValues: data.fixed_values,
      currencies,
    });
  });

const EditGlobalCommissionForm = ({ rate }: { rate: CommissionRate }) => {
  const { t } = useTranslation();
  const { handleSuccess } = useRouteModal();
  const { currencies } = useStoreCurrencies();

  const typeOptions = [
    { value: "percentage", label: t("commissions.fields.type.percentage") },
    { value: "fixed", label: t("commissions.fields.type.fixed") },
  ];

  const resolver = useMemo(
    () => zodResolver(createEditGlobalCommissionSchema(currencies)),
    [currencies]
  );

  const form = useForm<EditGlobalCommissionSchemaType>({
    defaultValues: {
      code: rate.code,
      type: rate.type,
      value: rate.value,
      fixed_values: fixedValuesFromRate(rate),
      include_tax: rate.include_tax,
      include_shipping: rate.include_shipping,
    },
    resolver,
  });

  const { mutateAsync, isPending } = useUpdateCommissionRule(rate.id);

  const handleSubmit = form.handleSubmit(async (values) => {
    const isFixed = values.type === "fixed";
    const payload = {
      code: values.code,
      type: values.type,
      value: isFixed ? 0 : values.value,
      ...(isFixed
        ? { values: buildValuesPayload(currencies, values.fixed_values) }
        : {}),
      include_tax: values.include_tax,
      include_shipping: values.include_shipping,
    };

    await mutateAsync(payload, {
      onSuccess: () => {
        toast.success(
          t("commissions.global.edit.successToast")
        );
        handleSuccess();
      },
      onError: (e) => toast.error(e.message),
    });
  });

  const watchType = form.watch("type");

  return (
    <RouteDrawer.Form form={form}>
      <KeyboundForm onSubmit={handleSubmit} className="flex flex-1 flex-col">
        <RouteDrawer.Body>
          <div className="flex flex-col gap-y-4">
            <Form.Field
              control={form.control}
              name="code"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label>{t("commissions.fields.code")}</Form.Label>
                  <Form.Control>
                    <Input
                      autoComplete="off"
                      data-testid="global-commission-code-input"
                      {...field}
                    />
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            />
            <Form.Field
              control={form.control}
              name="type"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label>
                    {t("commissions.fields.type.label")}
                  </Form.Label>
                  <Form.Control>
                    <Combobox
                      {...field}
                      options={typeOptions}
                      forceHideInput
                      data-testid="global-commission-type-select"
                    />
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            />
            <CommissionValueFields
              control={form.control}
              type={watchType}
              currencies={currencies}
            />
            <SwitchBox
              control={form.control}
              name="include_tax"
              label={t("commissions.fields.taxIncluded")}
              description={t("commissions.fields.taxIncludedHint")}
            />
            <SwitchBox
              control={form.control}
              name="include_shipping"
              label={t("commissions.fields.shippingIncluded")}
              description={t("commissions.fields.shippingIncludedHint")}
            />
          </div>
        </RouteDrawer.Body>
        <RouteDrawer.Footer>
          <div className="flex items-center gap-x-2">
            <RouteDrawer.Close asChild>
              <Button size="small" variant="secondary">
                {t("actions.cancel")}
              </Button>
            </RouteDrawer.Close>
            <Button size="small" type="submit" isLoading={isPending}>
              {t("actions.save")}
            </Button>
          </div>
        </RouteDrawer.Footer>
      </KeyboundForm>
    </RouteDrawer.Form>
  );
};

export const GlobalCommissionEdit = () => {
  const { t } = useTranslation();
  const { default_commission, isPending, isError, error } =
    useDefaultCommission();

  const rate = default_commission as CommissionRate | undefined;
  const ready = !isPending && !!rate;

  if (isError) {
    throw error;
  }

  return (
    <RouteDrawer>
      <RouteDrawer.Header>
        <RouteDrawer.Title asChild>
          <Heading>
            {t("commissions.global.edit.header")}
          </Heading>
        </RouteDrawer.Title>
        <RouteDrawer.Description className="sr-only">
          {t("commissions.global.edit.header")}
        </RouteDrawer.Description>
      </RouteDrawer.Header>
      {ready && <EditGlobalCommissionForm rate={rate} />}
    </RouteDrawer>
  );
};
