import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Heading, Input } from "@medusajs/ui";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import * as z from "zod";

import { Form } from "@components/common/form";

const CompanyStepSchema = z.object({
  corporate_name: z.string().optional(),
  registration_number: z.string().optional(),
  tax_id: z.string().optional(),
});

type CompanyStepValues = z.infer<typeof CompanyStepSchema>;

type CompanyStepProps = {
  onSubmit: (data: CompanyStepValues) => Promise<void>;
  onSkip: () => void;
  isPending?: boolean;
};

export const CompanyStep = ({ onSubmit, onSkip, isPending }: CompanyStepProps) => {
  const { t } = useTranslation();

  const form = useForm<CompanyStepValues>({
    resolver: zodResolver(CompanyStepSchema),
    defaultValues: {
      corporate_name: "",
      registration_number: "",
      tax_id: "",
    },
  });

  const handleSubmit = form.handleSubmit(async (data) => {
    await onSubmit(data);
  });

  return (
    <div className="flex flex-col gap-y-8">
      <Heading level="h2" className="text-ui-fg-base text-lg">
        {t("onboarding.wizard.company.title")}
      </Heading>

      <Form {...form}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-y-6">
          <div className="flex flex-col gap-y-4">
            <Form.Field
              control={form.control}
              name="corporate_name"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label optional>
                    {t("onboarding.wizard.company.corporateName")}
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
              name="registration_number"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label optional>
                    {t("onboarding.wizard.company.registrationNumber")}
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
              name="tax_id"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label optional>
                    {t("onboarding.wizard.company.taxId")}
                  </Form.Label>
                  <Form.Control>
                    <Input {...field} />
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
