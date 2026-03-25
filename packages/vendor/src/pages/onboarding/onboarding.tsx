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
import { AnimatePresence, motion } from "motion/react";
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
  const [layoutStep, setLayoutStep] = useState(1);
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
    setStep(3);
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

      <AnimatePresence mode="wait">
        {step <= 2 ? (
          <motion.div
            key="form-steps"
            className={`flex flex-1 flex-col items-center px-4 ${
              layoutStep === 1 ? "justify-center" : "pt-8"
            }`}
            exit={{
              opacity: 0,
              y: 40,
              filter: "blur(6px)",
              transition: { duration: 0.5, ease: [0, 0.71, 0.2, 1.01] },
            }}
          >
            <div
              className="flex w-full max-w-[720px] flex-col"
              style={layoutStep === 2 ? { paddingBottom: "5rem" } : undefined}
            >
              <AnimatePresence mode="wait" onExitComplete={() => setLayoutStep(step)}>
                {step === 1 ? (
                  <motion.div
                    key="store-step"
                    initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    exit={{
                      opacity: 0,
                      y: -3,
                      filter: "blur(4px)",
                      transition: {
                        duration: 0.25,
                        ease: [0.23, 1, 0.32, 1],
                      },
                    }}
                    transition={{
                      duration: 0.4,
                      ease: [0.23, 1, 0.32, 1],
                    }}
                  >
                    <StoreStep form={storeForm} onSubmit={handleStoreSubmit} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="details-step"
                    initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    exit={{
                      opacity: 0,
                      y: -3,
                      filter: "blur(4px)",
                      transition: {
                        duration: 0.25,
                        ease: [0.23, 1, 0.32, 1],
                      },
                    }}
                    transition={{
                      duration: 0.4,
                      ease: [0.23, 1, 0.32, 1],
                    }}
                  >
                    <DetailsStep
                      form={detailsForm}
                      onSubmit={handleDetailsSubmit}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="submitted"
            className="flex flex-1 flex-col items-center justify-center px-4"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              duration: 0.6,
              delay: 0.3,
              ease: [0, 0.71, 0.2, 1.01],
            }}
          >
            <SubmittedStep email={email} />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {step <= 2 && (
          <motion.div
            className="fixed bottom-0 left-0 right-0 flex items-center justify-center py-4 bg-ui-bg-subtle"
            exit={{
              opacity: 0,
              transition: { duration: 0.3, ease: [0.23, 1, 0.32, 1] },
            }}
          >
            <Text size="small" weight="plus" className="text-ui-fg-muted">
              {t("onboarding.step", {
                current: String(step).padStart(2, "0"),
                total: String(totalSteps).padStart(2, "0"),
              })}
            </Text>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const sectionVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.06 * i,
      duration: 0.35,
      ease: [0.23, 1, 0.32, 1],
    },
  }),
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
      <motion.div
        className="pb-8 flex items-center gap-x-4"
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        custom={0}
      >
        <Avatar fallback="?" variant="rounded" size="xlarge" />
        <div>
          <Heading level="h1" className="text-ui-fg-base">
            {t("onboarding.storeSetup.title")}
          </Heading>
          <Text size="small" className="text-ui-fg-subtle">
            {t("onboarding.storeSetup.subtitle")}
          </Text>
        </div>
      </motion.div>

      <Form {...form}>
        <form onSubmit={onSubmit}>
          <motion.div
            className="border-t border-dotted border-ui-border-base"
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
            custom={1}
          />

          <motion.div
            className="grid grid-cols-2 gap-x-12 py-8"
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
            custom={2}
          >
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
          </motion.div>

          <motion.div
            className="border-t border-dotted border-ui-border-base"
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
            custom={3}
          />

          <motion.div
            className="grid grid-cols-2 gap-x-12 py-8"
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
            custom={4}
          >
            <div />
            <Button type="submit" className="w-full">
              {t("actions.continue")}
            </Button>
          </motion.div>
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
      <motion.div
        className="pb-8 flex items-center gap-x-4"
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        custom={0}
      >
        <Avatar fallback="?" variant="rounded" size="xlarge" />
        <div>
          <Heading level="h1" className="text-ui-fg-base">
            {t("onboarding.detailsSetup.title")}
          </Heading>
          <Text size="small" className="text-ui-fg-subtle">
            {t("onboarding.detailsSetup.subtitle")}
          </Text>
        </div>
      </motion.div>

      <Form {...form}>
        <form onSubmit={onSubmit}>
          <motion.div
            className="border-t border-dotted border-ui-border-base"
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
            custom={1}
          />

          {/* Address section */}
          <motion.div
            className="grid grid-cols-2 gap-x-12 py-8"
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
            custom={2}
          >
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
                        <Input autoComplete="given-name" {...field} />
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
                        <Input autoComplete="family-name" {...field} />
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
                      <Input autoComplete="organization" {...field} />
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
                      <CountrySelect {...field} onChange={onChange} />
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
                    <Form.Label optional>{t("fields.address2")}</Form.Label>
                    <Form.Control>
                      <Input autoComplete="address-line2" {...field} />
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
                        <Input autoComplete="address-level2" {...field} />
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
                        <Input autoComplete="postal-code" {...field} />
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
                      <Input autoComplete="address-level1" {...field} />
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
                      <Input autoComplete="tel" {...field} />
                    </Form.Control>
                    <Form.ErrorMessage />
                  </Form.Item>
                )}
              />
            </div>
          </motion.div>

          <motion.div
            className="border-t border-dotted border-ui-border-base"
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
            custom={3}
          />

          {/* Professional details section */}
          <motion.div
            className="grid grid-cols-2 gap-x-12 py-8"
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
            custom={4}
          >
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
              <AnimatePresence initial={false}>
                {isProfessional && (
                  <motion.div
                    className="flex flex-col gap-y-4"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{
                      opacity: 1,
                      height: "auto",
                      transition: {
                        height: {
                          duration: 0.35,
                          ease: [0.23, 1, 0.32, 1],
                        },
                        opacity: { duration: 0.25, delay: 0.1 },
                      },
                    }}
                    exit={{
                      opacity: 0,
                      height: 0,
                      transition: {
                        height: {
                          duration: 0.25,
                          ease: [0.23, 1, 0.32, 1],
                          delay: 0.05,
                        },
                        opacity: { duration: 0.15 },
                      },
                    }}
                  >
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
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          <motion.div
            className="border-t border-dotted border-ui-border-base"
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
            custom={5}
          />

          <motion.div
            className="grid grid-cols-2 gap-x-12 py-8"
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
            custom={6}
          >
            <div />
            <Button type="submit" className="w-full">
              {t("onboarding.detailsSetup.completeSetup")}
            </Button>
          </motion.div>
        </form>
      </Form>
    </>
  );
};

const SubmittedStep = ({ email }: { email: string }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="flex w-full max-w-[360px] flex-col items-center">
      <div className="relative mb-6">
        <motion.div
          className="flex size-14 items-center justify-center rounded-xl bg-ui-button-neutral shadow-buttons-neutral"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            duration: 0.5,
            delay: 0.1,
            ease: [0, 0.71, 0.2, 1.01],
          }}
        >
          <Avatar fallback="M" variant="rounded" size="xlarge" />
        </motion.div>
        <motion.div
          className="absolute -right-[5px] -top-1 flex size-5 items-center justify-center rounded-full border-[0.5px] border-[rgba(3,7,18,0.2)] bg-[#3B82F6] bg-gradient-to-b from-white/0 to-white/20 shadow-[0px_1px_2px_0px_rgba(3,7,18,0.12),0px_1px_2px_0px_rgba(255,255,255,0.10)_inset,0px_-1px_5px_0px_rgba(255,255,255,0.10)_inset]"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            duration: 1.2,
            delay: 0.8,
            ease: [0, 0.71, 0.2, 1.01],
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
          >
            <motion.path
              d="M5.8335 10.4167L9.16683 13.75L14.1668 6.25"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{
                duration: 1.3,
                delay: 1.1,
                bounce: 0.6,
                ease: [0.1, 0.8, 0.2, 1.01],
              }}
            />
          </svg>
        </motion.div>
      </div>

      <motion.div
        className="flex flex-col items-center gap-y-1"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.5,
          delay: 0.4,
          ease: [0.23, 1, 0.32, 1],
        }}
      >
        <Heading level="h1" className="text-center text-ui-fg-base">
          {t("onboarding.submitted.title")}
        </Heading>
        <Text
          size="small"
          className="text-ui-fg-subtle text-center max-w-[300px]"
        >
          {t("onboarding.submitted.description", { email })}
        </Text>
      </motion.div>

      <motion.div
        className="mt-2 text-center"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.5,
          delay: 0.55,
          ease: [0.23, 1, 0.32, 1],
        }}
      >
        <Text size="small" className="text-ui-fg-muted">
          {t("onboarding.submitted.hint")}
        </Text>
      </motion.div>

      <motion.div
        className="mt-6 w-full"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.5,
          delay: 0.7,
          ease: [0.23, 1, 0.32, 1],
        }}
      >
        <Button
          variant="secondary"
          className="w-full"
          onClick={() => navigate("/login")}
        >
          {t("onboarding.submitted.action")}
        </Button>
      </motion.div>
    </div>
  );
};
