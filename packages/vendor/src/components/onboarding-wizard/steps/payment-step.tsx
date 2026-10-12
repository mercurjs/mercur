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

const PaymentStepSchema = z.object({
  country_code: z.string().min(1, i18n.t("onboarding.wizard.validation.countryRequired")),
  holder_name: z.string().min(1, i18n.t("onboarding.wizard.validation.accountNameRequired")),
  iban: z.string().optional(),
  bic: z.string().optional(),
  routing_number: z.string().optional(),
  account_number: z.string().optional(),
});

type PaymentStepValues = z.infer<typeof PaymentStepSchema>;

type PaymentStepProps = StepProps<PaymentStepValues & {
  additional_data?: Record<string, unknown>;
}>;

export const PaymentStep = ({
  onSubmit,
  onSkip,
  isLast,
  isPending,
}: PaymentStepProps) => {
  const { t } = useTranslation();

  const form = useExtendableForm({
    schema: PaymentStepSchema,
    model: "seller",
    zone: "onboarding",
    tab: "payment",
    defaultValues: {
      country_code: "",
      holder_name: "",
      iban: "",
      bic: "",
      routing_number: "",
      account_number: "",
    },
  });

  const selectedCountry = form.watch("country_code");
  const isUS = selectedCountry === "us";

  const handleSubmit = form.handleSubmit(async (data) => {
    await onSubmit(data);
  });

  return (
    <div className="flex flex-col gap-y-8">
      <Heading level="h2" className="text-ui-fg-base text-lg">
        {t("onboarding.wizard.payment.title")}
      </Heading>

      <Form {...form}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-y-6">
          <div className="flex flex-col gap-y-4">
            <Form.Field
              control={form.control}
              name="country_code"
              render={({ field: { onChange, ref: _ref, ...field } }) => (
                <Form.Item>
                  <Form.Label>
                    {t("onboarding.wizard.address.country")}
                  </Form.Label>
                  <Form.Control>
                    <CountrySelect {...field} onChange={onChange} />
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            />

            {selectedCountry && (
              <>
                <Form.Field
                  control={form.control}
                  name="holder_name"
                  render={({ field }) => (
                    <Form.Item>
                      <Form.Label>
                        {t("onboarding.wizard.payment.accountName")}
                      </Form.Label>
                      <Form.Control>
                        <Input {...field} />
                      </Form.Control>
                      <Form.ErrorMessage />
                    </Form.Item>
                  )}
                />

                {isUS ? (
                  <>
                    <Form.Field
                      control={form.control}
                      name="account_number"
                      render={({ field }) => (
                        <Form.Item>
                          <Form.Label optional>
                            {t("onboarding.wizard.payment.accountNumber")}
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
                      name="routing_number"
                      render={({ field }) => (
                        <Form.Item>
                          <Form.Label optional>
                            {t("onboarding.wizard.payment.achRoutingNumber")}
                          </Form.Label>
                          <Form.Control>
                            <Input {...field} />
                          </Form.Control>
                          <Form.ErrorMessage />
                        </Form.Item>
                      )}
                    />
                  </>
                ) : (
                  <>
                    <Form.Field
                      control={form.control}
                      name="iban"
                      render={({ field }) => (
                        <Form.Item>
                          <Form.Label optional>
                            {t("onboarding.wizard.payment.iban")}
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
                      name="account_number"
                      render={({ field }) => (
                        <Form.Item>
                          <Form.Label optional>
                            {t("onboarding.wizard.payment.accountNumber")}
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
                      name="bic"
                      render={({ field }) => (
                        <Form.Item>
                          <Form.Label optional>
                            {t("onboarding.wizard.payment.swiftBic")}
                          </Form.Label>
                          <Form.Control>
                            <Input {...field} />
                          </Form.Control>
                          <Form.ErrorMessage />
                        </Form.Item>
                      )}
                    />
                  </>
                )}
              </>
            )}
            <FormExtensionZone
              model="seller"
              zone="onboarding"
              tab="payment"
              control={form.control}
            />
          </div>
          <StepActions onSkip={onSkip} isLast={isLast} isPending={isPending} />
        </form>
      </Form>
    </div>
  );
};
