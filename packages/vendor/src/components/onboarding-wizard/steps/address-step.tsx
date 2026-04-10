import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Heading, Input } from "@medusajs/ui";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import * as z from "zod";

import { Form } from "@components/common/form";
import { CountrySelect } from "@components/inputs/country-select/country-select";

const AddressStepSchema = z.object({
  address_1: z.string().optional(),
  address_2: z.string().optional(),
  postal_code: z.string().optional(),
  city: z.string().optional(),
  country_code: z.string().min(1),
  province: z.string().optional(),
});

type AddressStepValues = z.infer<typeof AddressStepSchema>;

type AddressStepProps = {
  onSubmit: (data: AddressStepValues) => Promise<void>;
  onSkip: () => void;
  isPending?: boolean;
};

export const AddressStep = ({ onSubmit, onSkip, isPending }: AddressStepProps) => {
  const { t } = useTranslation();

  const form = useForm<AddressStepValues>({
    resolver: zodResolver(AddressStepSchema),
    defaultValues: {
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
          </div>
          <div className="flex flex-col gap-y-2">
            <Button type="submit" className="w-full" isLoading={isPending}>
              {t("actions.continue")}
            </Button>
            <Button
              type="button"
              variant="transparent"
              className="w-full"
              onClick={onSkip}
            >
              {t("onboarding.wizard.skip")}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};
