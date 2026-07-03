import { Heading } from "@medusajs/ui";
import { useTranslation } from "react-i18next";

import { Form } from "../../../../../components/common/form";
import { SwitchBox } from "../../../../../components/common/switch-box";
import { Combobox } from "../../../../../components/inputs/combobox";
import {
  defineTabMeta,
  useTabbedForm,
} from "../../../../../components/tabbed-form";
import { CommissionValueFields } from "../../../common/components/commission-value-fields";
import { useStoreCurrencies } from "../../../common/hooks/use-store-currencies";
import { CreateCommissionRuleSchemaType } from "./schema";

export const CreateCommissionRuleCommission = () => {
  const { t } = useTranslation();
  const form = useTabbedForm<CreateCommissionRuleSchemaType>();
  const { currencies } = useStoreCurrencies();

  const commissionType = form.watch("commissionType");

  const typeOptions = [
    { value: "percentage", label: t("commissions.fields.type.percentage") },
    { value: "fixed", label: t("commissions.fields.type.fixed") },
  ];

  return (
    <div className="flex flex-col items-center p-16">
      <div className="flex w-full max-w-[720px] flex-col gap-y-8">
        <Heading>{t("commissions.create.commission")}</Heading>
        <div className="flex flex-col gap-y-4">
          <Form.Field
            control={form.control}
            name="commissionType"
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
                    data-testid="commission-rule-commission-type-select"
                  />
                </Form.Control>
                <Form.ErrorMessage />
              </Form.Item>
            )}
          />
          <CommissionValueFields
            control={form.control}
            type={commissionType}
            currencies={currencies}
          />
        </div>
        <div className="flex flex-col gap-y-4">
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
      </div>
    </div>
  );
};

CreateCommissionRuleCommission._tabMeta =
  defineTabMeta<CreateCommissionRuleSchemaType>({
    id: "commission",
    labelKey: "commissions.create.commission",
    validationFields: ["commissionType", "value"],
  });
