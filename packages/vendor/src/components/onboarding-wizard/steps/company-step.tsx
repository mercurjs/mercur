import { Heading, Input } from "@medusajs/ui";
import { useTranslation } from "react-i18next";
import * as z from "zod";

import {
  FormExtensionZone,
  useExtendableForm,
} from "@mercurjs/dashboard-shared";

import { Form } from "@components/common/form";
import { StepActions } from "./step-actions";
import { StepProps } from "./types";

const CompanyStepSchema = z.object({
  corporate_name: z.string().optional(),
  registration_number: z.string().optional(),
  tax_id: z.string().optional(),
});

type CompanyStepValues = z.infer<typeof CompanyStepSchema>;

type CompanyStepProps = StepProps<CompanyStepValues & {
  additional_data?: Record<string, unknown>;
}>;

export const CompanyStep = ({
  onSubmit,
  onSkip,
  isLast,
  isPending,
}: CompanyStepProps) => {
  const { t } = useTranslation();

  const form = useExtendableForm({
    schema: CompanyStepSchema,
    model: "seller",
    zone: "onboarding",
    tab: "company",
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
            <FormExtensionZone
              model="seller"
              zone="onboarding"
              tab="company"
              control={form.control}
            />
          </div>
          <StepActions onSkip={onSkip} isLast={isLast} isPending={isPending} />
        </form>
      </Form>
    </div>
  );
};
