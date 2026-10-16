import { Children, ReactNode } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import i18n from "i18next";
import { Alert, Button, Heading, Input } from "@medusajs/ui";
import { useForm } from "react-hook-form";
import { Trans, useTranslation } from "react-i18next";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import * as z from "zod";

import { MercurFeatureFlags } from "@mercurjs/types";
import { WidgetZone } from "@mercurjs/dashboard-shared";
import { Form } from "@components/common/form";
import AvatarBox from "@components/common/logo-box/avatar-box";
import { AuthLayout, AuthReveal } from "@components/layout/auth-layout";
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

const LoginLogo = () => {
  return (
    <AuthReveal order={0} className="mb-4">
      <WidgetZone id="login.logo">
        <AvatarBox />
      </WidgetZone>
    </AuthReveal>
  );
};

const LoginHeader = () => {
  const { t } = useTranslation();

  return (
    <AuthReveal order={1} className="mb-8 flex flex-col">
      <Heading level="h1" className="text-xl">
        {t("login.title", { name: config.name ?? "Mercur" })}
      </Heading>
    </AuthReveal>
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

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="flex w-full flex-col gap-y-6">
        <div className="flex flex-col gap-y-4">
          <Form.Field
            control={form.control}
            name="email"
            render={({ field }) => (
              <AuthReveal order={2}>
                <Form.Item>
                  <Form.Label>{t("fields.email")}</Form.Label>
                  <Form.Control>
                    <Input autoComplete="email" {...field} />
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              </AuthReveal>
            )}
          />
          <Form.Field
            control={form.control}
            name="password"
            render={({ field }) => (
              <AuthReveal order={3}>
                <Form.Item>
                  <div className="flex items-center justify-between">
                    <Form.Label>{t("fields.password")}</Form.Label>
                    <Link
                      to="/reset-password"
                      tabIndex={-1}
                      className="text-ui-fg-interactive transition-fg hover:text-ui-fg-interactive-hover focus-visible:text-ui-fg-interactive-hover txt-compact-small-plus outline-none"
                      data-testid="login-forgot-password-link"
                    >
                      {t("login.forgotPasswordLink")}
                    </Link>
                  </div>
                  <Form.Control>
                    <Input
                      type="password"
                      autoComplete="current-password"
                      {...field}
                    />
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              </AuthReveal>
            )}
          />
          {serverError && (
            <div className="animate-login-alert motion-reduce:animate-login-fade">
              <Alert
                className="bg-ui-bg-base items-center p-2"
                dismissible
                variant="error"
              >
                {serverError}
              </Alert>
            </div>
          )}
        </div>
        <AuthReveal order={4}>
          <div className="transition-transform duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100">
            <Button className="w-full" type="submit" isLoading={isPending}>
              {t("login.submit")}
            </Button>
          </div>
        </AuthReveal>
      </form>
    </Form>
  );
};

const LoginFooter = () => {
  const { t } = useTranslation();
  const { feature_flags } = useFeatureFlags();

  if (!feature_flags?.[MercurFeatureFlags.SELLER_REGISTRATION]) {
    return null;
  }

  return (
    <AuthReveal order={5} className="mt-6">
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
    </AuthReveal>
  );
};

const Root = ({ children }: { children?: ReactNode }) => {
  return (
    <AuthLayout align="center">
      {Children.count(children) > 0 ? (
        children
      ) : (
        <div className="group/auth flex w-full flex-col" data-reveal="true">
          <LoginLogo />
          <WidgetZone id="login.before" />
          <div className="flex w-full flex-col">
            <LoginHeader />
            <LoginForm />
          </div>
          <WidgetZone id="login.after" />
          <LoginFooter />
        </div>
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
