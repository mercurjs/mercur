import { CheckCircleSolid, Spinner } from "@medusajs/icons";
import { Heading, Input, Select, Text, Textarea } from "@medusajs/ui";
import i18n from "i18next";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLoaderData } from "react-router-dom";
import * as z from "zod";

import {
  FormExtensionZone,
  useExtendableForm,
} from "@mercurjs/dashboard-shared";

import { Form } from "@components/common/form";
import { HandleInput } from "@components/inputs/handle-input";
import { useSellerHandleAvailability, useStore } from "@hooks/api";
import { sdk } from "@lib/client";
import { onboardingLoader } from "../../../pages/onboarding/loader";
import { StepActions } from "./step-actions";
import { StepProps } from "./types";

// Mirrors Medusa's `isValidHandle`, which the seller module enforces on create.
const HANDLE_REGEX = /^[\p{Ll}\p{Lo}\p{Lm}\p{N}]+(?:-[\p{Ll}\p{Lo}\p{Lm}\p{N}]+)*$/u;
const HANDLE_CHECK_DEBOUNCE_MS = 400;

const StoreStepSchema = z.object({
  name: z.string().min(1, i18n.t("onboarding.wizard.validation.nameRequired")),
  email: z.string().email(i18n.t("onboarding.wizard.validation.emailInvalid")),
  phone: z.string().optional(),
  currency_code: z.string().min(1, i18n.t("onboarding.wizard.validation.currencyRequired")),
  description: z.string().optional(),
  handle: z
    .string()
    .min(1, i18n.t("onboarding.wizard.store.handleRequired"))
    .regex(HANDLE_REGEX, i18n.t("onboarding.wizard.store.handleInvalid")),
});

type StoreStepValues = z.infer<typeof StoreStepSchema>;

type StoreStepSubmitValues = StoreStepValues & {
  additional_data?: Record<string, unknown>;
};

type StoreStepProps = StepProps<StoreStepSubmitValues>;

const useDebouncedValue = (value: string, delay: number) => {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timeout = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timeout);
  }, [value, delay]);

  return debounced;
};

export const StoreStep = ({
  onSubmit,
  onSkip,
  isLast,
  isPending,
}: StoreStepProps) => {
  const { t } = useTranslation();
  const initialData = useLoaderData() as Awaited<
    ReturnType<typeof onboardingLoader>
  >;
  const { store } = useStore(undefined, { initialData });

  const form = useExtendableForm({
    schema: StoreStepSchema,
    model: "seller",
    zone: "onboarding",
    tab: "store",
    data: store,
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      currency_code: "",
      description: "",
      handle: "",
    },
  });

  const handle = form.watch("handle");
  const debouncedHandle = useDebouncedValue(handle, HANDLE_CHECK_DEBOUNCE_MS);
  const canCheckHandle = HANDLE_REGEX.test(debouncedHandle);

  const { available, reason, isFetching } = useSellerHandleAvailability(
    debouncedHandle,
    { enabled: canCheckHandle },
  );

  const isCheckingHandle =
    HANDLE_REGEX.test(handle) && (handle !== debouncedHandle || isFetching);
  const isHandleAvailable =
    !isCheckingHandle && canCheckHandle && handle === debouncedHandle && available;

  useEffect(() => {
    if (isCheckingHandle || !canCheckHandle || available !== false) {
      // RHF only re-validates on change after the first submit, so a stale
      // "taken" error has to be cleared by hand.
      if (form.getFieldState("handle").error?.type === "manual") {
        form.clearErrors("handle");
      }
      return;
    }

    form.setError("handle", {
      type: "manual",
      message:
        reason === "invalid"
          ? t("onboarding.wizard.store.handleInvalid")
          : t("onboarding.wizard.store.handleTaken"),
    });
  }, [available, reason, isCheckingHandle, canCheckHandle, form, t]);

  const handleSubmit = form.handleSubmit(async (data) => {
    const result = await sdk.vendor.sellers.handleAvailability.query({
      handle: data.handle,
    });

    if (!result.available) {
      form.setError("handle", {
        type: "manual",
        message:
          result.reason === "invalid"
            ? t("onboarding.wizard.store.handleInvalid")
            : t("onboarding.wizard.store.handleTaken"),
      });
      return;
    }

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
              name="phone"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label optional>{t("fields.phone")}</Form.Label>
                  <Form.Control>
                    <Input type="tel" autoComplete="tel" {...field} />
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
                  <Form.Label
                    tooltip={t("onboarding.wizard.store.handleTooltip")}
                  >
                    {t("onboarding.wizard.store.handle")}
                  </Form.Label>
                  <Form.Control>
                    <HandleInput
                      placeholder={t("onboarding.wizard.store.handlePlaceholder")}
                      data-testid="onboarding-handle-input"
                      {...field}
                    />
                  </Form.Control>
                  {isCheckingHandle && (
                    <div
                      className="text-ui-fg-muted flex items-center gap-x-1.5"
                      data-testid="onboarding-handle-checking"
                    >
                      <Spinner className="size-3.5 animate-spin" />
                      <Text size="small" leading="compact">
                        {t("onboarding.wizard.store.handleChecking")}
                      </Text>
                    </div>
                  )}
                  {isHandleAvailable && (
                    <div
                      className="flex items-center gap-x-1.5"
                      data-testid="onboarding-handle-available"
                    >
                      <CheckCircleSolid className="text-ui-tag-green-icon" />
                      <Text
                        size="small"
                        leading="compact"
                        className="text-ui-tag-green-text"
                      >
                        {t("onboarding.wizard.store.handleAvailable")}
                      </Text>
                    </div>
                  )}
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
            <FormExtensionZone
              model="seller"
              zone="onboarding"
              tab="store"
              control={form.control}
              data={store}
            />
          </div>
          <StepActions
            onSkip={onSkip}
            isLast={isLast}
            isPending={isPending || form.formState.isSubmitting}
          />
        </form>
      </Form>
    </div>
  );
};
