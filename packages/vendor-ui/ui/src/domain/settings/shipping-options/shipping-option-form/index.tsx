import { Controller, UseFormReturn } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Region } from "@medusajs/medusa";

import IncludesTaxTooltip from "../../../../components/atoms/includes-tax-tooltip";
import PriceFormInput from "../../../../components/forms/general/prices-form/price-form-input";
import InputHeader from "../../../../components/fundamentals/input-header";
import InputField from "../../../../components/molecules/input";
import { NextSelect } from "../../../../components/molecules/select/next-select";
import { Option, ShippingOptionPriceType } from "../../../../types/shared";
import FormValidator from "../../../../utils/form-validator";

type Requirement = {
  amount: number | null;
  id: string | null;
};

export type ShippingOptionFormType = {
  store_option: boolean;
  name: string | null;
  price_type: ShippingOptionPriceType | null;
  amount: number | null;
  shipping_profile: Option | null;
  fulfillment_provider: Option | null;
  requirements: {
    min_subtotal: Requirement | null;
    max_subtotal: Requirement | null;
  };
};

type Props = {
  form: UseFormReturn<ShippingOptionFormType, any>;
  region: Region;
};

const ShippingOptionForm = ({ form, region }: Props) => {
  const {
    register,
    watch,
    control,
    formState: { errors },
  } = form;

  const { t } = useTranslation();

  return (
    <div>
      <div className="px-2 large:p-0">
        <h3 className="inter-base-semibold mb-base">
          {t("shipping-option-form-details", "Details")}
        </h3>
        <div className="gap-large grid grid-cols-2">
          <InputField
            label={t("shipping-option-form-title", "Title")}
            required
            {...register("name", {
              required: t(
                "shipping-option-form-title-is-required",
                "Title is required"
              ),
              pattern: FormValidator.whiteSpaceRule("Title"),
              minLength: FormValidator.minOneCharRule("Title"),
            })}
            errors={errors}
          />
          <div className="gap-large flex items-center">
            <Controller
              control={control}
              name="price_type"
              render={({ field: { onChange, value, onBlur } }) => {
                return (
                  <NextSelect
                    label={t("shipping-option-form-price-type", "Price Type")}
                    required
                    value={value}
                    onChange={onChange}
                    onBlur={onBlur}
                    options={[
                      {
                        label: t("shipping-option-form-flat-rate", "Flat Rate"),
                        value: "flat_rate",
                      },
                      {
                        label: t(
                          "shipping-option-form-calculated",
                          "Calculated"
                        ),
                        value: "calculated",
                      },
                    ]}
                    placeholder={t(
                      "shipping-option-form-choose-a-price-type",
                      "Choose a price type"
                    )}
                    errors={errors}
                  />
                );
              }}
            />
            {watch("price_type")?.value === "flat_rate" && (
              <Controller
                control={control}
                name="amount"
                rules={{
                  min: FormValidator.nonNegativeNumberRule("Price"),
                  max: FormValidator.maxInteger("Price", region.currency_code),
                }}
                render={({ field: { value, onChange } }) => {
                  return (
                    <div>
                      <InputHeader
                        label={t("shipping-option-form-price", "Price")}
                        className="mb-2xsmall"
                        tooltip={
                          <IncludesTaxTooltip
                            includesTax={region.includes_tax}
                          />
                        }
                      />
                      <PriceFormInput
                        amount={value || undefined}
                        onChange={onChange}
                        name="amount"
                        currencyCode={region.currency_code}
                        errors={errors}
                      />
                    </div>
                  );
                }}
              />
            )}
          </div>
        </div>
      </div>
      <div className="bg-grey-20 my-xlarge h-px w-full" />
      <div className="px-2 pb-2 large:px-0">
        <h3 className="inter-base-semibold mb-base">
          {t("shipping-option-form-requirements", "Requirements")}
        </h3>
        <div className="gap-large grid grid-cols-2">
          <Controller
            control={control}
            name="requirements.min_subtotal.amount"
            rules={{
              min: FormValidator.nonNegativeNumberRule("Min. subtotal"),
              max: FormValidator.maxInteger(
                "Min. subtotal",
                region.currency_code
              ),
              validate: (value) => {
                if (value === null) {
                  return true;
                }

                const maxSubtotal = form.getValues(
                  "requirements.max_subtotal.amount"
                );
                if (maxSubtotal && value > maxSubtotal) {
                  return t(
                    "shipping-option-form-min-subtotal-must-be-less-than-max-subtotal",
                    "Min. subtotal must be less than max. subtotal"
                  );
                }
                return true;
              },
            }}
            render={({ field: { value, onChange } }) => {
              return (
                <div>
                  <InputHeader
                    label={t(
                      "shipping-option-form-min-subtotal",
                      "Min. subtotal"
                    )}
                    className="mb-xsmall"
                    tooltip={
                      <IncludesTaxTooltip includesTax={region.includes_tax} />
                    }
                  />
                  <PriceFormInput
                    amount={typeof value === "number" ? value : undefined}
                    onChange={onChange}
                    name="requirements.min_subtotal.amount"
                    currencyCode={region.currency_code}
                    errors={errors}
                  />
                </div>
              );
            }}
          />
          <Controller
            control={control}
            name="requirements.max_subtotal.amount"
            rules={{
              min: FormValidator.nonNegativeNumberRule("Max. subtotal"),
              max: FormValidator.maxInteger(
                "Max. subtotal",
                region.currency_code
              ),
              validate: (value) => {
                if (value === null) {
                  return true;
                }

                const minSubtotal = form.getValues(
                  "requirements.min_subtotal.amount"
                );
                if (minSubtotal && value < minSubtotal) {
                  return "Max. subtotal must be greater than min. subtotal";
                }
                return true;
              },
            }}
            render={({ field: { value, onChange, ref } }) => {
              return (
                <div ref={ref}>
                  <InputHeader
                    label={t(
                      "shipping-option-form-max-subtotal",
                      "Max. subtotal"
                    )}
                    className="mb-xsmall"
                    tooltip={
                      <IncludesTaxTooltip includesTax={region.includes_tax} />
                    }
                  />
                  <PriceFormInput
                    amount={typeof value === "number" ? value : undefined}
                    onChange={onChange}
                    name="requirements.max_subtotal.amount"
                    currencyCode={region.currency_code}
                    errors={errors}
                  />
                </div>
              );
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default ShippingOptionForm;
