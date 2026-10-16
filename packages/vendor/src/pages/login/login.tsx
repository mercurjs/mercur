import { Children, ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion, type Variants } from "motion/react";
import { zodResolver } from "@hookform/resolvers/zod";
import i18n from "i18next";
import { Alert, Button, Heading, Input, Text } from "@medusajs/ui";
import { useForm } from "react-hook-form";
import { Trans, useTranslation } from "react-i18next";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import * as z from "zod";

import { MercurFeatureFlags } from "@mercurjs/types";
import { WidgetZone } from "@mercurjs/dashboard-shared";
import { Form } from "@components/common/form";
import AvatarBox from "@components/common/logo-box/avatar-box";
import { AuthLayout } from "@components/layout/auth-layout";
import { useFeatureFlags, useSignInWithEmailPass } from "@hooks/api";
import { isFetchError } from "@lib/is-fetch-error";
import config from "virtual:mercur/config";

const LoginSchema = z.object({
  email: z
    .string()
    .min(1, { message: i18n.t("login.validation.emailRequired") })
    .email({ message: i18n.t("login.validation.emailInvalid") }),
  password: z
    .string()
    .min(1, { message: i18n.t("login.validation.passwordRequired") }),
});

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

const revealVariants: Variants = {
  hidden: {
    opacity: 0,
    transform: "translateY(8px)",
    filter: "blur(4px)",
  },
  show: {
    opacity: 1,
    transform: "translateY(0px)",
    filter: "blur(0px)",
    transition: { duration: 0.45, ease: EASE_OUT },
  },
};

const staggerVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05, delayChildren: 0.05 } },
};

const reducedRevealVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.3, ease: "easeOut" } },
};

const LoginReveal = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      variants={reduceMotion ? reducedRevealVariants : revealVariants}
    >
      {children}
    </motion.div>
  );
};

const LoginLogo = () => {
  return (
    <LoginReveal>
      <WidgetZone id="login.logo">
        <AvatarBox />
      </WidgetZone>
    </LoginReveal>
  );
};

const LoginHeader = () => {
  const { t } = useTranslation();

  return (
    <LoginReveal className="mb-6 flex flex-col">
      <Heading>{t("login.title", { name: config.name ?? "Mercur" })}</Heading>
      <Text size="small" className="text-ui-fg-subtle">
        {t("login.hint")}
      </Text>
    </LoginReveal>
  );
};

const LoginForm = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const reason = searchParams.get("reason") || "";
  const reasonMessage =
    reason && reason.toLowerCase() === "unauthorized"
      ? t("login.sessionExpired")
      : reason;

  const form = useForm<z.infer<typeof LoginSchema>>({
    resolver: zodResolver(LoginSchema),
    mode: "onSubmit",
    reValidateMode: "onSubmit",
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const { mutateAsync, isPending } = useSignInWithEmailPass();

  const handleSubmit = form.handleSubmit(async ({ email, password }) => {
    await mutateAsync(
      {
        email,
        password,
      },
      {
        onError: (error) => {
          if (isFetchError(error)) {
            if (error.status === 401) {
              form.setError("email", {
                type: "manual",
                message: error.message,
              });

              return;
            }
          }

          form.setError("root.serverError", {
            type: "manual",
            message: error.message,
          });
        },
        onSuccess: () => {
          const email = form.getValues("email");
          sessionStorage.setItem("mercur_onboarding_email", email);
          setTimeout(() => {
            navigate("/store-select", {
              replace: true,
              state: { email },
            });
          }, 1000);
        },
      },
    );
  });

  const serverError =
    form.formState.errors?.root?.serverError?.message || reasonMessage;
  const reduceMotion = useReducedMotion();

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="flex w-full flex-col gap-y-6">
        <div className="flex flex-col gap-y-4">
          <Form.Field
            control={form.control}
            name="email"
            render={({ field }) => (
              <LoginReveal>
                <Form.Item>
                  <Form.Label>{t("fields.email")}</Form.Label>
                  <Form.Control>
                    <Input autoComplete="email" {...field} />
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              </LoginReveal>
            )}
          />
          <Form.Field
            control={form.control}
            name="password"
            render={({ field }) => (
              <LoginReveal>
                <Form.Item>
                  <Form.Label>{t("fields.password")}</Form.Label>
                  <Form.Control>
                    <Input
                      type="password"
                      autoComplete="current-password"
                      {...field}
                    />
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              </LoginReveal>
            )}
          />
          <AnimatePresence initial={false}>
            {serverError && (
              <motion.div
                key="server-error"
                initial={
                  reduceMotion
                    ? { opacity: 0 }
                    : {
                        opacity: 0,
                        transform: "translateY(-4px) scale(0.98)",
                        filter: "blur(2px)",
                      }
                }
                animate={{
                  opacity: 1,
                  transform: "translateY(0px) scale(1)",
                  filter: "blur(0px)",
                }}
                exit={{ opacity: 0, transition: { duration: 0.15 } }}
                transition={{ duration: 0.25, ease: EASE_OUT }}
              >
                <Alert
                  className="bg-ui-bg-base items-center p-2"
                  dismissible
                  variant="error"
                >
                  {serverError}
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <LoginReveal>
          <div className="transition-transform duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100">
            <Button className="w-full" type="submit" isLoading={isPending}>
              {t("login.submit")}
            </Button>
          </div>
        </LoginReveal>
      </form>
    </Form>
  );
};

const LoginFooter = () => {
  const { t } = useTranslation();
  const { feature_flags } = useFeatureFlags();

  return (
    <LoginReveal className="mt-auto flex flex-col gap-y-2">
      <span className="text-ui-fg-muted txt-small">
        <Trans
          t={t}
          i18nKey="login.forgotPassword"
          components={[
            <Link
              key="reset-password-link"
              to="/reset-password"
              className="text-ui-fg-interactive transition-fg hover:text-ui-fg-interactive-hover focus-visible:text-ui-fg-interactive-hover font-medium outline-none"
            />,
          ]}
        />
      </span>
      {feature_flags?.[MercurFeatureFlags.SELLER_REGISTRATION] && (
        <span className="text-ui-fg-muted txt-small">
          <Trans
            t={t}
            i18nKey="login.notSellerYet"
            components={[
              <Link
                key="register-link"
                to="/register"
                className="text-ui-fg-interactive transition-fg hover:text-ui-fg-interactive-hover focus-visible:text-ui-fg-interactive-hover font-medium outline-none"
              />,
            ]}
          />
        </span>
      )}
    </LoginReveal>
  );
};

const Root = ({ children }: { children?: ReactNode }) => {
  return (
    <AuthLayout>
      {Children.count(children) > 0 ? (
        children
      ) : (
        <motion.div
          className="flex flex-1 flex-col"
          initial="hidden"
          animate="show"
          variants={staggerVariants}
        >
          <LoginLogo />
          <WidgetZone id="login.before" />
          <div className="mt-6">
            <LoginHeader />
            <LoginForm />
          </div>
          <WidgetZone id="login.after" />
          <LoginFooter />
        </motion.div>
      )}
    </AuthLayout>
  );
};

export const LoginPage = Object.assign(Root, {
  Logo: LoginLogo,
  Header: LoginHeader,
  Form: LoginForm,
  Footer: LoginFooter,
});
