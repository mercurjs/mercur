import { CurrencyInput, Label } from "@medusajs/ui";
import { Control, FieldValues } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { Form } from "../../../../components/common/form";
import { DeprecatedPercentageInput } from "../../../../components/inputs/percentage-input";
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
export const CommissionValueFields = <T extends FieldValues = FieldValues>({
  control,
  type,
  currencies,
}: CommissionValueFieldsProps & { control: Control<T> }) => {
  const { t } = useTranslation();

  if (type === "percentage") {
    return (
      <Form.Field
        control={control}
        name={"value" as never}
        render={({ field: { value, onChange, ...field } }) => (
          <Form.Item>
            <Form.Label>{t("commissions.fields.value")}</Form.Label>
            <Form.Control>
              <DeprecatedPercentageInput
                min={0}
                max={100}
                {...field}
                value={value ?? ""}
                onChange={(e) =>
                  onChange(
                    e.target.value === "" ? null : parseFloat(e.target.value)
                  )
                }
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
        {t("commissions.fields.value")}
      </Label>
      <div className="flex flex-col gap-y-2">
        {currencies.map((code) => (
          <Form.Field
            key={code}
            control={control}
            name={`fixed_values.${code}` as never}
            render={({ field: { value, onChange, ...field } }) => (
              <Form.Item>
                <Form.Control>
                  <CurrencyInput
                    min={0}
                    code={code}
                    symbol={getCurrencySymbol(code)}
                    onValueChange={(val) =>
                    onChange(val ? parseFloat(val) : undefined)
                  }
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
