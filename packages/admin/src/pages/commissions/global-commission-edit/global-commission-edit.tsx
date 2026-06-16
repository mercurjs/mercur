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
import { CommissionRate } from "../common/types";

const EditGlobalCommissionSchema = zod.object({
  code: zod.string().min(1),
  type: zod.enum(["percentage", "fixed"]),
  value: zod.coerce.number().min(0),
  include_tax: zod.boolean(),
  include_shipping: zod.boolean(),
});

const EditGlobalCommissionForm = ({ rate }: { rate: CommissionRate }) => {
  const { t } = useTranslation();
  const { handleSuccess } = useRouteModal();
  const direction = useDocumentDirection();

  const form = useForm<zod.infer<typeof EditGlobalCommissionSchema>>({
    defaultValues: {
      code: rate.code,
      type: rate.type,
      value: rate.value,
      include_tax: rate.include_tax,
      include_shipping: rate.include_shipping,
    },
    resolver: zodResolver(EditGlobalCommissionSchema),
  });

  const { mutateAsync, isPending } = useUpdateCommissionRule(rate.id);

  const handleSubmit = form.handleSubmit(async (values) => {
    await mutateAsync(values, {
      onSuccess: () => {
        toast.success(
          t("commissions.global.edit.successToast", {
            defaultValue: "Global commission updated",
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
                    <Input autoComplete="off" {...field} />
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
                    <Select
                      {...field}
                      onValueChange={onChange}
                      dir={direction}
                    >
                      <Select.Trigger ref={ref}>
                        <Select.Value />
                      </Select.Trigger>
                      <Select.Content>
                        <Select.Item value="percentage">
                          {t("commissions.fields.type.percentage", "Percentage")}
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
            <Form.Field
              control={form.control}
              name="value"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label>
                    {watchType === "percentage"
                      ? t("commissions.fields.percentageValue", "Value (%)")
                      : t("commissions.fields.fixedValue", "Value")}
                  </Form.Label>
                  <Form.Control>
                    <Input type="number" min={0} step="any" {...field} />
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
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
