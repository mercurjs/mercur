import { Heading, Input } from "@medusajs/ui";
import i18n from "i18next";
import { useTranslation } from "react-i18next";
import * as z from "zod";

import {
  FormExtensionZone,
  useExtendableForm,
} from "@mercurjs/dashboard-shared";

import { Form } from "@components/common/form";
import { CountrySelect } from "@components/inputs/country-select/country-select";
import { StepActions } from "./step-actions";
import { StepProps } from "./types";

const AddressStepSchema = z.object({
  name: z.string().min(1, i18n.t("onboarding.wizard.validation.nameRequired")),
  address_1: z.string().optional(),
  address_2: z.string().optional(),
  postal_code: z.string().optional(),
  city: z.string().optional(),
  country_code: z.string().min(1, i18n.t("onboarding.wizard.validation.countryRequired")),
  province: z.string().optional(),
});

type AddressStepValues = z.infer<typeof AddressStepSchema>;

type AddressStepProps = StepProps<AddressStepValues & {
  additional_data?: Record<string, unknown>;
}>;

export const AddressStep = ({
  onSubmit,
  onSkip,
  isLast,
  isPending,
}: AddressStepProps) => {
  const { t } = useTranslation();

  const form = useExtendableForm({
    schema: AddressStepSchema,
    model: "seller",
    zone: "onboarding",
    tab: "address",
    defaultValues: {
      name: "",
      address_1: "",
      address_2: "",
      postal_code: "",
      city: "",
      country_code: "",
      province: "",
    },
  });

  const handleSubmit = form.handleSubmit(async (data) => {
    await onSubmit(data);
  });

  return (
    <div className="flex flex-col gap-y-8">
      <Heading level="h2" className="text-ui-fg-base text-lg">
        {t("onboarding.wizard.address.title")}
      </Heading>

      <Form {...form}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-y-6">
          <div className="flex flex-col gap-y-4">
            <Form.Field
              control={form.control}
              name="name"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label>
                    {t("onboarding.wizard.address.name")}
                  </Form.Label>
                  <Form.Control>
                    <Input {...field} />
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            />
            <Form.Field
              control={form.control}
              name="address_1"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label optional>{t("onboarding.wizard.address.address")}</Form.Label>
                  <Form.Control>
                    <Input autoComplete="address-line1" {...field} />
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            />
            <Form.Field
              control={form.control}
              name="address_2"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label optional>
                    {t("onboarding.wizard.address.address2")}
                  </Form.Label>
                  <Form.Control>
                    <Input autoComplete="address-line2" {...field} />
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            />
            <Form.Field
              control={form.control}
              name="postal_code"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label optional>{t("onboarding.wizard.address.postalCode")}</Form.Label>
                  <Form.Control>
                    <Input autoComplete="postal-code" {...field} />
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            />
            <Form.Field
              control={form.control}
              name="city"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label optional>{t("onboarding.wizard.address.city")}</Form.Label>
                  <Form.Control>
                    <Input autoComplete="address-level2" {...field} />
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            />
            <Form.Field
              control={form.control}
              name="country_code"
              render={({ field: { onChange, ref: _ref, ...field } }) => (
                <Form.Item>
                  <Form.Label>{t("onboarding.wizard.address.country")}</Form.Label>
                  <Form.Control>
                    <CountrySelect {...field} onChange={onChange} />
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            />
            <Form.Field
              control={form.control}
              name="province"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label optional>{t("onboarding.wizard.address.state")}</Form.Label>
                  <Form.Control>
                    <Input autoComplete="address-level1" {...field} />
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            />
            <FormExtensionZone
              model="seller"
              zone="onboarding"
              tab="address"
              control={form.control}
            />
          </div>
          <StepActions onSkip={onSkip} isLast={isLast} isPending={isPending} />
        </form>
      </Form>
    </div>
  );
};
