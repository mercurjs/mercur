import { Heading } from "@medusajs/ui";
import * as z from "zod";

import {
  FormExtensionZone,
  useExtendableForm,
} from "@mercurjs/dashboard-shared";

import { Form } from "@components/common/form";
import { StepActions } from "./step-actions";
import { StepProps } from "./types";

const CustomStepSchema = z.object({});

type CustomStepProps = StepProps & {
  id: string;
  label?: string;
};

export const CustomStep = ({
  id,
  label,
  onSubmit,
  onSkip,
  isLast,
  isPending,
}: CustomStepProps) => {
  const form = useExtendableForm({
    schema: CustomStepSchema,
    model: "seller",
    zone: "onboarding",
    tab: id,
    defaultValues: {},
  });

  const handleSubmit = form.handleSubmit(async (data) => {
    await onSubmit(data);
  });

  return (
    <div className="flex flex-col gap-y-8">
      {label && (
        <Heading level="h2" className="text-ui-fg-base text-lg">
          {label}
        </Heading>
      )}

      <Form {...form}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-y-6">
          <FormExtensionZone
            model="seller"
            zone="onboarding"
            tab={id}
            control={form.control}
          />
          <StepActions onSkip={onSkip} isLast={isLast} isPending={isPending} />
        </form>
      </Form>
    </div>
  );
};
