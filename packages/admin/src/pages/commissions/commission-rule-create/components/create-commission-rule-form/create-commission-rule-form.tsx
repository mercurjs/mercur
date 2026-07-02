import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "@medusajs/ui";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { TabbedForm } from "../../../../../components/tabbed-form";
import { useRouteModal } from "../../../../../components/modals";
import { useCreateCommissionRule } from "../../../../../hooks/api/commissions";
import { useStoreCurrencies } from "../../../common/hooks/use-store-currencies";
import { buildRulesFromScope, buildValuesPayload } from "../../../common/utils";
import { CreateCommissionRuleCommission } from "./create-commission-rule-commission";
import { CreateCommissionRuleDetails } from "./create-commission-rule-details";
import {
  createCommissionRuleSchema,
  CreateCommissionRuleSchemaType,
} from "./schema";

export const CreateCommissionRuleForm = () => {
  const { t } = useTranslation();
  const { handleSuccess } = useRouteModal();
  const { currencies } = useStoreCurrencies();

  const resolver = useMemo(
    () => zodResolver(createCommissionRuleSchema(currencies)),
    [currencies]
  );

  const form = useForm<CreateCommissionRuleSchemaType>({
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
    resolver,
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
