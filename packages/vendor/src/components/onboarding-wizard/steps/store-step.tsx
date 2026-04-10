import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Heading, Input, Select, Textarea } from "@medusajs/ui";
import i18n from "i18next";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useLoaderData } from "react-router-dom";
import * as z from "zod";

import { Form } from "@components/common/form";
import { HandleInput } from "@components/inputs/handle-input";
import { useStore } from "@hooks/api";
import { onboardingLoader } from "../../../pages/onboarding/loader";

const StoreStepSchema = z.object({
  name: z.string().min(1, i18n.t("onboarding.wizard.validation.nameRequired")),
  email: z.string().email(i18n.t("onboarding.wizard.validation.emailInvalid")),
  currency_code: z.string().min(1, i18n.t("onboarding.wizard.validation.currencyRequired")),
  description: z.string().optional(),
  handle: z.string().optional(),
});

type StoreStepValues = z.infer<typeof StoreStepSchema>;

type StoreStepProps = {
  onSubmit: (data: StoreStepValues) => Promise<void>;
  isPending?: boolean;
};

export const StoreStep = ({ onSubmit, isPending }: StoreStepProps) => {
  const { t } = useTranslation();
  const initialData = useLoaderData() as Awaited<
    ReturnType<typeof onboardingLoader>
  >;
  const { store } = useStore(undefined, { initialData });

  const form = useForm<StoreStepValues>({
    resolver: zodResolver(StoreStepSchema),
    defaultValues: {
      name: "",
      email: "",
      currency_code: "",
      description: "",
      handle: "",
    },
  });

  const handleSubmit = form.handleSubmit(async (data) => {
    await onSubmit(data);
  });

  return (
    <div className="flex flex-col gap-y-8">
      <Heading level="h2" className="text-ui-fg-base text-lg">
        {t("onboarding.wizard.store.title")}
      </Heading>

      <Form {...form}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-y-6">
          <div className="flex flex-col gap-y-4">
            <Form.Field
              control={form.control}
              name="name"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label>{t("onboarding.wizard.store.name")}</Form.Label>
                  <Form.Control>
                    <Input autoComplete="organization" {...field} />
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            />
            <Form.Field
              control={form.control}
              name="email"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label>{t("onboarding.wizard.store.email")}</Form.Label>
                  <Form.Control>
                    <Input type="email" autoComplete="email" {...field} />
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            />
            <Form.Field
              control={form.control}
              name="description"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label optional>
                    {t("fields.description")}
                  </Form.Label>
                  <Form.Control>
                    <Textarea {...field} />
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            />
            <Form.Field
              control={form.control}
              name="handle"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label optional>
                    {t("onboarding.wizard.store.handle")}
                  </Form.Label>
                  <Form.Control>
                    <HandleInput {...field} />
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            />
            <Form.Field
              control={form.control}
              name="currency_code"
              render={({ field: { onChange, ref, ...field } }) => (
                <Form.Item>
                  <Form.Label>
                    {t("onboarding.wizard.store.currency")}
                  </Form.Label>
                  <Form.Control>
                    <Select {...field} onValueChange={onChange}>
                      <Select.Trigger ref={ref}>
                        <Select.Value
                          placeholder={t("onboarding.wizard.store.selectCurrency")}
                        />
                      </Select.Trigger>
                      <Select.Content>
                        {store?.supported_currencies?.map((sc) => (
                          <Select.Item
                            key={sc.currency_code}
                            value={sc.currency_code}
                          >
                            {sc.currency_code.toUpperCase()}
                          </Select.Item>
                        ))}
                      </Select.Content>
                    </Select>
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            />
          </div>
          <Button type="submit" className="w-full" isLoading={isPending}>
            {t("actions.continue")}
          </Button>
        </form>
      </Form>
    </div>
  );
};
