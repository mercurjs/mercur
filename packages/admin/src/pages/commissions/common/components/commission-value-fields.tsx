import { CurrencyInput, Label } from "@medusajs/ui";
import { Control } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { Form } from "../../../../components/common/form";
import { PercentageInput } from "../../../../components/inputs/percentage-input";
import { getCurrencySymbol } from "../../../../lib/data/currencies";

type CommissionValueFieldsProps = {
  // The form control is shared across heterogeneous schemas; `any` keeps the
  // component reusable from the wizard, global drawer and rule drawer.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<any>;
  type: "percentage" | "fixed";
  currencies: string[];
};

/**
 * Renders the commission Value field:
 *  - Percentage → a single `%` input bound to `value`.
 *  - Fixed → one `CurrencyInput` per store currency, bound to
 *    `fixed_values.<currency_code>`.
 */
export const CommissionValueFields = ({
  control,
  type,
  currencies,
}: CommissionValueFieldsProps) => {
  const { t } = useTranslation();

  if (type === "percentage") {
    return (
      <Form.Field
        control={control}
        name="value"
        render={({ field: { value, onChange, ...field } }) => (
          <Form.Item>
            <Form.Label>{t("commissions.fields.value", "Value")}</Form.Label>
            <Form.Control>
              <PercentageInput
                {...field}
                value={value}
                onValueChange={(_v, _n, values) => onChange(values?.float ?? 0)}
              />
            </Form.Control>
            <Form.ErrorMessage />
          </Form.Item>
        )}
      />
    );
  }

  return (
    <div className="flex flex-col gap-y-2">
      <Label size="small" weight="plus">
        {t("commissions.fields.value", "Value")}
      </Label>
      <div className="flex flex-col gap-y-2">
        {currencies.map((code) => (
          <Form.Field
            key={code}
            control={control}
            name={`fixed_values.${code}`}
            render={({ field: { value, onChange, ...field } }) => (
              <Form.Item>
                <Form.Control>
                  <CurrencyInput
                    min={0}
                    code={code}
                    symbol={getCurrencySymbol(code)}
                    onValueChange={(val) => onChange(val ? parseFloat(val) : 0)}
                    {...field}
                    value={value ?? ""}
                  />
                </Form.Control>
                <Form.ErrorMessage />
              </Form.Item>
            )}
          />
        ))}
      </div>
    </div>
  );
};
