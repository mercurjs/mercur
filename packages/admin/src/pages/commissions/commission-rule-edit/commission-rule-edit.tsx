import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Heading, Input, Select, toast } from "@medusajs/ui";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import * as zod from "zod";

import { Form } from "../../../components/common/form";
import { SwitchBox } from "../../../components/common/switch-box";
import { RouteDrawer, useRouteModal } from "../../../components/modals";
import { KeyboundForm } from "../../../components/utilities/keybound-form";
import { useDocumentDirection } from "../../../hooks/use-document-direction";
import {
  useCommissionRule,
  useUpdateCommissionRule,
} from "../../../hooks/api/commissions";
import { CommissionRate } from "../common/types";

const EditCommissionRuleSchema = zod.object({
  name: zod.string().min(1),
  code: zod.string().min(1),
  type: zod.enum(["percentage", "fixed"]),
  value: zod.coerce.number().min(0),
  include_tax: zod.boolean(),
  include_shipping: zod.boolean(),
  is_enabled: zod.boolean(),
});

const EditCommissionRuleForm = ({ rule }: { rule: CommissionRate }) => {
  const { t } = useTranslation();
  const { handleSuccess } = useRouteModal();
  const direction = useDocumentDirection();

  const form = useForm<zod.infer<typeof EditCommissionRuleSchema>>({
    defaultValues: {
      name: rule.name,
      code: rule.code,
      type: rule.type,
      value: rule.value,
      include_tax: rule.include_tax,
      include_shipping: rule.include_shipping,
      is_enabled: rule.is_enabled,
    },
    resolver: zodResolver(EditCommissionRuleSchema),
  });

  const { mutateAsync, isPending } = useUpdateCommissionRule(rule.id);

  const handleSubmit = form.handleSubmit(async (values) => {
    await mutateAsync(values, {
      onSuccess: () => {
        toast.success(
          t("commissions.edit.successToast", {
            defaultValue: "Commission rule updated",
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
              name="name"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label>{t("fields.title")}</Form.Label>
                  <Form.Control>
                    <Input autoComplete="off" {...field} />
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            />
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
                    <Select {...field} onValueChange={onChange} dir={direction}>
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
              name="is_enabled"
              label={t("commissions.fields.enabled", "Enabled")}
              description={t(
                "commissions.fields.enabledHint",
                "Enable or disable this commission rule."
              )}
            />
            <SwitchBox
              control={form.control}
              name="include_tax"
              label={t("commissions.fields.taxIncluded", "Tax included")}
              description={t(
                "commissions.fields.taxIncludedHint",
                "If checked, commission is calculated on the total including tax."
              )}
            />
            <SwitchBox
              control={form.control}
              name="include_shipping"
              label={t("commissions.fields.shippingIncluded", "Shipping included")}
              description={t(
                "commissions.fields.shippingIncludedHint",
                "If checked, commission is calculated on the total including shipping."
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

export const CommissionRuleEdit = () => {
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
            {t("commissions.edit.header", "Edit Commission Rule")}
          </Heading>
        </RouteDrawer.Title>
        <RouteDrawer.Description className="sr-only">
          {t("commissions.edit.header", "Edit Commission Rule")}
        </RouteDrawer.Description>
      </RouteDrawer.Header>
      {ready && <EditCommissionRuleForm rule={commission_rate} />}
    </RouteDrawer>
  );
};
