import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Heading, toast } from "@medusajs/ui";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import * as zod from "zod";

import { Form } from "../../../components/common/form";
import { SwitchBox } from "../../../components/common/switch-box";
import { Combobox } from "../../../components/inputs/combobox";
import { RouteDrawer, useRouteModal } from "../../../components/modals";
import { KeyboundForm } from "../../../components/utilities/keybound-form";
import {
  useCommissionRule,
  useUpdateCommissionRule,
} from "../../../hooks/api/commissions";
import { CommissionValueFields } from "../common/components/commission-value-fields";
import { useStoreCurrencies } from "../common/hooks/use-store-currencies";
import { addCommissionValueIssues, optionalAmount } from "../common/schema";
import { CommissionRate } from "../common/types";
import { buildValuesPayload, fixedValuesFromRate } from "../common/utils";

const EditCommissionSchema = zod.object({
  type: zod.enum(["percentage", "fixed"]),
  value: optionalAmount,
  fixed_values: zod.record(zod.string(), optionalAmount).optional(),
  include_tax: zod.boolean(),
  include_shipping: zod.boolean(),
});

type EditCommissionSchemaType = zod.infer<typeof EditCommissionSchema>;

const createEditCommissionSchema = (currencies: string[]) =>
  EditCommissionSchema.superRefine((data, ctx) => {
    addCommissionValueIssues(ctx, {
      type: data.type,
      value: data.value,
      fixedValues: data.fixed_values,
      currencies,
    });
  });

const EditCommissionForm = ({ rule }: { rule: CommissionRate }) => {
  const { t } = useTranslation();
  const { handleSuccess } = useRouteModal();
  const { currencies } = useStoreCurrencies();

  const typeOptions = [
    { value: "percentage", label: t("commissions.fields.type.percentage") },
    { value: "fixed", label: t("commissions.fields.type.fixed") },
  ];

  const resolver = useMemo(
    () => zodResolver(createEditCommissionSchema(currencies)),
    [currencies]
  );

  const form = useForm<EditCommissionSchemaType>({
    defaultValues: {
      type: rule.type,
      value: rule.value,
      fixed_values: fixedValuesFromRate(rule),
      include_tax: rule.include_tax,
      include_shipping: rule.include_shipping,
    },
    resolver,
  });

  const { mutateAsync, isPending } = useUpdateCommissionRule(rule.id);

  const handleSubmit = form.handleSubmit(async (values) => {
    const isFixed = values.type === "fixed";

    await mutateAsync(
      {
        type: values.type,
        value: isFixed ? 0 : values.value,
        ...(isFixed
          ? { values: buildValuesPayload(currencies, values.fixed_values) }
          : {}),
        include_tax: values.include_tax,
        include_shipping: values.include_shipping,
      },
      {
        onSuccess: () => {
          toast.success(
            t("commissions.commissionEdit.successToast")
          );
          handleSuccess();
        },
        onError: (e) => toast.error(e.message),
      }
    );
  });

  const watchType = form.watch("type");

  return (
    <RouteDrawer.Form form={form}>
      <KeyboundForm onSubmit={handleSubmit} className="flex flex-1 flex-col">
        <RouteDrawer.Body>
          <div className="flex flex-col gap-y-4">
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
                      data-testid="commission-edit-type-select"
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
            <Button
              size="small"
              type="submit"
              isLoading={isPending}
              data-testid="commission-edit-submit"
            >
              {t("actions.save")}
            </Button>
          </div>
        </RouteDrawer.Footer>
      </KeyboundForm>
    </RouteDrawer.Form>
  );
};

export const CommissionRuleCommissionEdit = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const { commission_rate, isPending, isError, error } = useCommissionRule(
    id!,
    { fields: "*rules,*values" }
  ) as unknown as {
    commission_rate?: CommissionRate;
    isPending: boolean;
    isError: boolean;
    error: Error | null;
  };

  const ready = !isPending && !!commission_rate;

  if (isError) {
    throw error;
  }

  return (
    <RouteDrawer>
      <RouteDrawer.Header>
        <RouteDrawer.Title asChild>
          <Heading>
            {t("commissions.commissionEdit.header")}
          </Heading>
        </RouteDrawer.Title>
        <RouteDrawer.Description className="sr-only">
          {t("commissions.commissionEdit.header")}
        </RouteDrawer.Description>
      </RouteDrawer.Header>
      {ready && <EditCommissionForm rule={commission_rate} />}
    </RouteDrawer>
  );
};
