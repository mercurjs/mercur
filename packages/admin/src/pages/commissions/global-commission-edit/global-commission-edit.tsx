import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Heading, Input, Select, toast } from "@medusajs/ui";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import * as zod from "zod";

import { Form } from "../../../components/common/form";
import { SwitchBox } from "../../../components/common/switch-box";
import { RouteDrawer, useRouteModal } from "../../../components/modals";
import { KeyboundForm } from "../../../components/utilities/keybound-form";
import { useDocumentDirection } from "../../../hooks/use-document-direction";
import {
  useDefaultCommission,
  useUpdateCommissionRule,
} from "../../../hooks/api/commissions";
import { CommissionValueFields } from "../common/components/commission-value-fields";
import { useStoreCurrencies } from "../common/hooks/use-store-currencies";
import { CommissionRate } from "../common/types";
import { buildValuesPayload, fixedValuesFromRate } from "../common/utils";

const EditGlobalCommissionSchema = zod
  .object({
    code: zod.string().min(1),
    type: zod.enum(["percentage", "fixed"]),
    value: zod.coerce.number().optional(),
    fixed_values: zod.record(zod.string(), zod.coerce.number()).optional(),
    include_tax: zod.boolean(),
    include_shipping: zod.boolean(),
  })
  .superRefine((data, ctx) => {
    if (
      data.type === "percentage" &&
      (data.value === undefined || Number.isNaN(data.value))
    ) {
      ctx.addIssue({
        code: zod.ZodIssueCode.custom,
        path: ["value"],
        message: "Please enter a value.",
      });
    }
  });

const EditGlobalCommissionForm = ({ rate }: { rate: CommissionRate }) => {
  const { t } = useTranslation();
  const { handleSuccess } = useRouteModal();
  const direction = useDocumentDirection();
  const { currencies } = useStoreCurrencies();

  const form = useForm<zod.infer<typeof EditGlobalCommissionSchema>>({
    defaultValues: {
      code: rate.code,
      type: rate.type,
      value: rate.value,
      fixed_values: fixedValuesFromRate(rate),
      include_tax: rate.include_tax,
      include_shipping: rate.include_shipping,
    },
    resolver: zodResolver(EditGlobalCommissionSchema),
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
          t("commissions.global.edit.successToast", {
            defaultValue: "Global commission was successfully updated.",
          })
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
                  <Form.Label>{t("commissions.fields.code", "Code")}</Form.Label>
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
              render={({ field: { onChange, ref, ...field } }) => (
                <Form.Item>
                  <Form.Label>
                    {t("commissions.fields.type.label", "Type")}
                  </Form.Label>
                  <Form.Control>
                    <Select {...field} onValueChange={onChange} dir={direction}>
                      <Select.Trigger
                        ref={ref}
                        data-testid="global-commission-type-select"
                      >
                        <Select.Value />
                      </Select.Trigger>
                      <Select.Content>
                        <Select.Item value="percentage">
                          {t(
                            "commissions.fields.type.percentage",
                            "Percentage"
                          )}
                        </Select.Item>
                        <Select.Item value="fixed">
                          {t("commissions.fields.type.fixed", "Fixed")}
                        </Select.Item>
                      </Select.Content>
                    </Select>
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
              label={t("commissions.fields.taxIncluded", "Tax included")}
              description={t(
                "commissions.fields.taxIncludedHint",
                "If checked, commission is calculated on the total including tax. If unchecked, tax is excluded and goes entirely to the store."
              )}
            />
            <SwitchBox
              control={form.control}
              name="include_shipping"
              label={t(
                "commissions.fields.shippingIncluded",
                "Shipping included"
              )}
              description={t(
                "commissions.fields.shippingIncludedHint",
                "If checked, commission is calculated on the total including shipping. If unchecked, shipping fees go entirely to the store."
              )}
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
            {t("commissions.global.edit.header", "Edit Global Commission")}
          </Heading>
        </RouteDrawer.Title>
        <RouteDrawer.Description className="sr-only">
          {t("commissions.global.edit.header", "Edit Global Commission")}
        </RouteDrawer.Description>
      </RouteDrawer.Header>
      {ready && <EditGlobalCommissionForm rate={rate} />}
    </RouteDrawer>
  );
};
