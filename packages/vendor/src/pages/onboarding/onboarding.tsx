import { useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { OpenRectArrowOut } from "@medusajs/icons";
import {
  Avatar,
  Button,
  Heading,
  Input,
  Select,
  Text,
  Textarea,
} from "@medusajs/ui";
import { useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import * as z from "zod";

import { Form } from "@components/common/form";
import { SwitchBox } from "@components/common/switch-box/switch-box";
import { CountrySelect } from "@components/inputs/country-select/country-select";
import { useLogout } from "@hooks/api";
import { currencies } from "@lib/data/currencies";
import { queryClient } from "@lib/query-client";

const currencyList = Object.values(currencies);

const StoreSetupSchema = z.object({
  name: z.string().min(1),
  currency_code: z.string().min(1),
  description: z.string().optional(),
});

const DetailsSetupSchema = z.object({
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  company: z.string().optional(),
  address_1: z.string().min(1),
  address_2: z.string().optional(),
  city: z.string().min(1),
  country_code: z.string().min(1),
  province: z.string().optional(),
  postal_code: z.string().min(1),
  phone: z.string().optional(),
  is_professional: z.boolean(),
  corporate_name: z.string().optional(),
  registration_number: z.string().optional(),
  tax_id: z.string().optional(),
});

type StoreSetupFormValues = z.infer<typeof StoreSetupSchema>;
type DetailsSetupFormValues = z.infer<typeof DetailsSetupSchema>;

export const Onboarding = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email ?? "";

  const [step, setStep] = useState(1);
  const totalSteps = 2;

  const { mutateAsync: logoutMutation } = useLogout();

  const handleLogout = async () => {
    await logoutMutation(undefined, {
      onSuccess: () => {
        queryClient.clear();
        navigate("/login");
      },
    });
  };

  const storeForm = useForm<StoreSetupFormValues>({
    resolver: zodResolver(StoreSetupSchema),
    defaultValues: {
      name: "",
      currency_code: "",
      description: "",
    },
  });

  const detailsForm = useForm<DetailsSetupFormValues>({
    resolver: zodResolver(DetailsSetupSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      company: "",
      address_1: "",
      address_2: "",
      city: "",
      country_code: "",
      province: "",
      postal_code: "",
      phone: "",
      is_professional: true,
      corporate_name: "",
      registration_number: "",
      tax_id: "",
    },
  });

  const handleStoreSubmit = storeForm.handleSubmit(async (_data) => {
    setStep(2);
  });

  const handleDetailsSubmit = detailsForm.handleSubmit(async (_data) => {
    // TODO: Submit onboarding data
  });

  return (
    <div className="bg-ui-bg-subtle flex min-h-dvh w-dvw flex-col">
      <div className="flex items-center justify-center py-4">
        <button
          onClick={handleLogout}
          className="txt-compact-small text-ui-fg-subtle flex items-center gap-x-1 font-medium transition-colors hover:text-ui-fg-base"
        >
          <OpenRectArrowOut />
          <span>
            {t("actions.logout")}
            {email && ` (${email})`}
          </span>
        </button>
      </div>

      <div
        className={`flex flex-1 flex-col items-center px-4 ${
          step === 1 ? "justify-center" : "pt-8"
        }`}
        style={step === 2 ? { paddingBottom: "5rem" } : undefined}
      >
        <div className="flex w-full max-w-[720px] flex-col">
          {step === 1 ? (
            <StoreStep form={storeForm} onSubmit={handleStoreSubmit} />
          ) : (
            <DetailsStep form={detailsForm} onSubmit={handleDetailsSubmit} />
          )}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 flex items-center justify-center py-4 bg-ui-bg-subtle">
        <Text size="small" weight="plus" className="text-ui-fg-muted">
          {t("onboarding.step", {
            current: String(step).padStart(2, "0"),
            total: String(totalSteps).padStart(2, "0"),
          })}
        </Text>
      </div>
    </div>
  );
};

const StoreStep = ({
  form,
  onSubmit,
}: {
  form: ReturnType<typeof useForm<StoreSetupFormValues>>;
  onSubmit: () => void;
}) => {
  const { t } = useTranslation();

  return (
    <>
      <div className="pb-8 flex items-center gap-x-4">
        <Avatar fallback="?" variant="rounded" size="xlarge" />
        <div>
          <Heading level="h1" className="text-ui-fg-base">
            {t("onboarding.storeSetup.title")}
          </Heading>
          <Text size="small" className="text-ui-fg-subtle">
            {t("onboarding.storeSetup.subtitle")}
          </Text>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={onSubmit}>
          <div className="border-t border-dotted border-ui-border-base" />

          <div className="grid grid-cols-2 gap-x-12 py-8">
            <div>
              <Text size="small" weight="plus" className="text-ui-fg-base">
                {t("onboarding.storeSetup.title")}
              </Text>
              <Text size="small" className="text-ui-fg-subtle mt-1">
                {t("onboarding.storeSetup.subtitle")}
              </Text>
            </div>
            <div className="flex flex-col gap-y-4">
              <Form.Field
                control={form.control}
                name="name"
                render={({ field }) => (
                  <Form.Item>
                    <Form.Label>
                      {t("onboarding.storeSetup.storeName")}
                    </Form.Label>
                    <Form.Control>
                      <Input
                        autoComplete="organization"
                        {...field}
                        placeholder={t(
                          "onboarding.storeSetup.storeNamePlaceholder",
                        )}
                      />
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
                    <Form.Label>{t("fields.currency")}</Form.Label>
                    <Form.Control>
                      <Select {...field} onValueChange={onChange}>
                        <Select.Trigger ref={ref}>
                          <Select.Value
                            placeholder={t(
                              "onboarding.storeSetup.selectCurrency",
                            )}
                          />
                        </Select.Trigger>
                        <Select.Content>
                          {currencyList.map((currency) => (
                            <Select.Item
                              key={currency.code}
                              value={currency.code}
                            >
                              {currency.name} ({currency.code.toUpperCase()})
                            </Select.Item>
                          ))}
                        </Select.Content>
                      </Select>
                    </Form.Control>
                    <Form.Hint>
                      {t("onboarding.storeSetup.currencyHint")}
                    </Form.Hint>
                    <Form.ErrorMessage />
                  </Form.Item>
                )}
              />
              <Form.Field
                control={form.control}
                name="description"
                render={({ field }) => (
                  <Form.Item>
                    <Form.Label optional>{t("fields.description")}</Form.Label>
                    <Form.Control>
                      <Textarea
                        {...field}
                        placeholder={t(
                          "onboarding.storeSetup.descriptionPlaceholder",
                        )}
                      />
                    </Form.Control>
                    <Form.ErrorMessage />
                  </Form.Item>
                )}
              />
            </div>
          </div>

          <div className="border-t border-dotted border-ui-border-base" />

          <div className="grid grid-cols-2 gap-x-12 py-8">
            <div />
            <Button type="submit" className="w-full">
              {t("actions.continue")}
            </Button>
          </div>
        </form>
      </Form>
    </>
  );
};

const DetailsStep = ({
  form,
  onSubmit,
}: {
  form: ReturnType<typeof useForm<DetailsSetupFormValues>>;
  onSubmit: () => void;
}) => {
  const { t } = useTranslation();

  const isProfessional = useWatch({
    control: form.control,
    name: "is_professional",
  });

  return (
    <>
      <div className="pb-8 flex items-center gap-x-4">
        <Avatar fallback="?" variant="rounded" size="xlarge" />
        <div>
          <Heading level="h1" className="text-ui-fg-base">
            {t("onboarding.detailsSetup.title")}
          </Heading>
          <Text size="small" className="text-ui-fg-subtle">
            {t("onboarding.detailsSetup.subtitle")}
          </Text>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={onSubmit}>
          <div className="border-t border-dotted border-ui-border-base" />

          {/* Address section */}
          <div className="grid grid-cols-2 gap-x-12 py-8">
            <div>
              <Text size="small" weight="plus" className="text-ui-fg-base">
                {t("onboarding.detailsSetup.addressTitle")}
              </Text>
              <Text size="small" className="text-ui-fg-subtle mt-1">
                {t("onboarding.detailsSetup.addressSubtitle")}
              </Text>
            </div>
            <div className="flex flex-col gap-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Form.Field
                  control={form.control}
                  name="first_name"
                  render={({ field }) => (
                    <Form.Item>
                      <Form.Label>{t("fields.firstName")}</Form.Label>
                      <Form.Control>
                        <Input
                          autoComplete="given-name"
                          {...field}
                        />
                      </Form.Control>
                      <Form.ErrorMessage />
                    </Form.Item>
                  )}
                />
                <Form.Field
                  control={form.control}
                  name="last_name"
                  render={({ field }) => (
                    <Form.Item>
                      <Form.Label>{t("fields.lastName")}</Form.Label>
                      <Form.Control>
                        <Input
                          autoComplete="family-name"
                          {...field}
                        />
                      </Form.Control>
                      <Form.ErrorMessage />
                    </Form.Item>
                  )}
                />
              </div>
              <Form.Field
                control={form.control}
                name="company"
                render={({ field }) => (
                  <Form.Item>
                    <Form.Label optional>{t("fields.company")}</Form.Label>
                    <Form.Control>
                      <Input
                        autoComplete="organization"
                        {...field}
                      />
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
                    <Form.Label>{t("fields.country")}</Form.Label>
                    <Form.Control>
                      <CountrySelect
                        {...field}
                        onChange={onChange}
                      />
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
                    <Form.Label>{t("fields.address")}</Form.Label>
                    <Form.Control>
                      <Input
                        autoComplete="address-line1"
                        {...field}
                      />
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
                      {t("fields.address2")}
                    </Form.Label>
                    <Form.Control>
                      <Input
                        autoComplete="address-line2"
                        {...field}
                      />
                    </Form.Control>
                    <Form.ErrorMessage />
                  </Form.Item>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <Form.Field
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <Form.Item>
                      <Form.Label>{t("fields.city")}</Form.Label>
                      <Form.Control>
                        <Input
                          autoComplete="address-level2"
                          {...field}
                        />
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
                      <Form.Label>{t("fields.postalCode")}</Form.Label>
                      <Form.Control>
                        <Input
                          autoComplete="postal-code"
                          {...field}
                        />
                      </Form.Control>
                      <Form.ErrorMessage />
                    </Form.Item>
                  )}
                />
              </div>
              <Form.Field
                control={form.control}
                name="province"
                render={({ field }) => (
                  <Form.Item>
                    <Form.Label optional>{t("fields.province")}</Form.Label>
                    <Form.Control>
                      <Input
                        autoComplete="address-level1"
                        {...field}
                      />
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
                      <Input
                        autoComplete="tel"
                        {...field}
                      />
                    </Form.Control>
                    <Form.ErrorMessage />
                  </Form.Item>
                )}
              />
            </div>
          </div>

          <div className="border-t border-dotted border-ui-border-base" />

          {/* Professional details section */}
          <div className="grid grid-cols-2 gap-x-12 py-8">
            <div>
              <Text size="small" weight="plus" className="text-ui-fg-base">
                {t("onboarding.detailsSetup.professionalTitle")}
              </Text>
              <Text size="small" className="text-ui-fg-subtle mt-1">
                {t("onboarding.detailsSetup.professionalSubtitle")}
              </Text>
            </div>
            <div className="flex flex-col gap-y-4">
              <SwitchBox
                control={form.control}
                name="is_professional"
                label={t("onboarding.detailsSetup.isProfessional")}
                description={t(
                  "onboarding.detailsSetup.isProfessionalDescription",
                )}
              />
              {isProfessional && (
                <>
                  <Form.Field
                    control={form.control}
                    name="corporate_name"
                    render={({ field }) => (
                      <Form.Item>
                        <Form.Label>
                          {t("onboarding.detailsSetup.corporateName")}
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
                          {t("onboarding.detailsSetup.registrationNumber")}
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
                          {t("onboarding.detailsSetup.taxId")}
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
            </div>
          </div>

          <div className="border-t border-dotted border-ui-border-base" />

          <div className="grid grid-cols-2 gap-x-12 py-8">
            <div />
            <Button type="submit" className="w-full">
              {t("onboarding.detailsSetup.completeSetup")}
            </Button>
          </div>
        </form>
      </Form>
    </>
  );
};
