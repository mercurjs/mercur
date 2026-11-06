import { toast } from "@medusajs/ui";
import { useExtendableForm } from "@mercurjs/dashboard-shared";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { TabbedForm } from "../../../../../components/tabbed-form";
import { useRouteModal } from "../../../../../components/modals";
import { useCreateCommissionRule } from "../../../../../hooks/api/commissions";
import { useStoreCurrencies } from "../../../common/hooks/use-store-currencies";
import { buildRulesFromScope, buildValuesPayload } from "../../../common/utils";
import { CreateCommissionRuleCommission } from "./create-commission-rule-commission";
import { CreateCommissionRuleDetails } from "./create-commission-rule-details";
import {
  baseCommissionRuleSchema,
  createCommissionRuleSchema,
} from "./schema";

export const CreateCommissionRuleForm = () => {
  const { t } = useTranslation();
  const { handleSuccess } = useRouteModal();
  const { currencies } = useStoreCurrencies();

  const schema = useMemo(
    () => createCommissionRuleSchema(currencies),
    [currencies]
  );

  const form = useExtendableForm({
    // Refined schemas are merged by intersection inside useExtendableForm.
    schema: schema as unknown as typeof baseCommissionRuleSchema,
    model: "commission_rate",
    zone: "create",
    defaultValues: {
      title: "",
      code: "",
      scopeType: "store",
      stores: [],
      productTypes: [],
      categories: [],
      commissionType: "percentage",
      value: undefined,
      fixed_values: {},
      include_tax: false,
      include_shipping: false,
    },
  });

  const { mutateAsync, isPending } = useCreateCommissionRule();

  const handleSubmit = form.handleSubmit(async (values) => {
    const rules = buildRulesFromScope(values.scopeType, {
      stores: values.stores,
      productTypes: values.productTypes,
      categories: values.categories,
    });

    const isFixed = values.commissionType === "fixed";

    await mutateAsync(
      {
        name: values.title,
        code: values.code,
        type: values.commissionType,
        value: isFixed ? 0 : values.value,
        ...(isFixed
          ? { values: buildValuesPayload(currencies, values.fixed_values) }
          : {}),
        include_tax: values.include_tax,
        include_shipping: values.include_shipping,
        is_enabled: true,
        ...(rules.length > 0 ? { rules } : {}),
        additional_data: values.additional_data,
      },
      {
        onSuccess: ({ commission_rate }) => {
          toast.success(
            t("commissions.create.successToast")
          );
          handleSuccess(`/settings/commissions/${commission_rate.id}`);
        },
        onError: (e) => toast.error(e.message),
      }
    );
  });

  return (
    <TabbedForm
      form={form}
      onSubmit={handleSubmit}
      isLoading={isPending}
    >
      <CreateCommissionRuleDetails />
      <CreateCommissionRuleCommission />
    </TabbedForm>
  );
};
