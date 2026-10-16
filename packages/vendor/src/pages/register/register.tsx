import { Children, ReactNode, useState } from "react";

import { Spinner } from "@medusajs/icons";
import { Alert, Button, Heading, Input, Text } from "@medusajs/ui";
import {
  FormExtensionZone,
  useExtendableForm,
} from "@mercurjs/dashboard-shared";
import { MercurFeatureFlags } from "@mercurjs/types";
import { Trans, useTranslation } from "react-i18next";
import { Link, Navigate, useNavigate } from "react-router-dom";
import config from "virtual:mercur/config";

import { Form } from "@components/common/form";
import AvatarBox from "@components/common/logo-box/avatar-box";
import { AuthLayout, AuthReveal } from "@components/layout/auth-layout";
import { useFeatureFlags, useSignUpWithEmailPass } from "@hooks/api";

import { RegisterSchema } from "./register-schema";

const REGISTER_DRAFT_KEY = "mercur_register_draft";

const RegisterLogo = () => {
  return (
    <AuthReveal order={0} className="mb-4">
      <AvatarBox />
    </AuthReveal>
  );
};

const RegisterHeader = () => {
  const { t } = useTranslation();

  return (
    <AuthReveal order={1} className="mb-8 flex flex-col">
      <Heading level="h1" className="text-xl">
        {t("register.title", { name: config.name ?? "Mercur" })}
      </Heading>
      <Text size="small" className="text-ui-fg-subtle">
        {t("register.hint", { name: config.name ?? "Mercur" })}
      </Text>
    </AuthReveal>
  );
};

const RegisterForm = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useExtendableForm({
    schema: RegisterSchema,
    model: "member",
    zone: "register",
    mode: "onSubmit",
    reValidateMode: "onSubmit",
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      password: "",
    },
  });

  const { mutateAsync: signUp, isPending } = useSignUpWithEmailPass();

  const handleSubmit = form.handleSubmit(
    async ({ first_name, last_name, email, password, additional_data }) => {
      setServerError(null);
      try {
        await signUp({ email, password });
        // Persist identity details for onboarding step that creates the seller member.
        // Backend emailpass register does not accept these fields directly today,
        // so they ride through sessionStorage and land on the member via onboarding.
        sessionStorage.setItem(
          REGISTER_DRAFT_KEY,
          JSON.stringify({ first_name, last_name, email, additional_data }),
        );
        navigate("/onboarding", { state: { email, first_name, last_name } });
      } catch (error: any) {
        setServerError(error?.message || t("register.error"));
      }
    },
  );

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="flex w-full flex-col gap-y-6">
        <div className="flex flex-col gap-y-4">
          <Form.Field
            control={form.control}
            name="first_name"
            render={({ field }) => (
              <AuthReveal order={2}>
                <Form.Item>
                  <Form.Label>{t("register.firstName")}</Form.Label>
                  <Form.Control>
                    <Input autoComplete="given-name" {...field} />
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              </AuthReveal>
            )}
          />
          <Form.Field
            control={form.control}
            name="last_name"
            render={({ field }) => (
              <AuthReveal order={3}>
                <Form.Item>
                  <Form.Label>{t("register.lastName")}</Form.Label>
                  <Form.Control>
                    <Input autoComplete="family-name" {...field} />
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              </AuthReveal>
            )}
          />
          <Form.Field
            control={form.control}
            name="email"
            render={({ field }) => (
              <AuthReveal order={4}>
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
              <AuthReveal order={5}>
                <Form.Item>
                  <Form.Label>{t("fields.password")}</Form.Label>
                  <Form.Control>
                    <Input
                      type="password"
                      autoComplete="new-password"
                      {...field}
                    />
                  </Form.Control>
                  <Form.Hint>{t("register.passwordHint")}</Form.Hint>
                  <Form.ErrorMessage />
                </Form.Item>
              </AuthReveal>
            )}
          />
          <AuthReveal order={6}>
            <FormExtensionZone
              model="member"
              zone="register"
              control={form.control}
            />
          </AuthReveal>
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
        <AuthReveal order={7}>
          <div className="transition-transform duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100">
            <Button className="w-full" type="submit" isLoading={isPending}>
              {t("actions.continue")}
            </Button>
          </div>
        </AuthReveal>
      </form>
    </Form>
  );
};

const RegisterFooter = () => {
  const { t } = useTranslation();

  return (
    <AuthReveal order={8} className="mt-6">
      <span className="text-ui-fg-muted txt-small">
        <Trans
          t={t}
          i18nKey="register.alreadySeller"
          components={[
            <Link
              key="login-link"
              to="/login"
              className="text-ui-fg-interactive transition-fg hover:text-ui-fg-interactive-hover focus-visible:text-ui-fg-interactive-hover font-medium outline-none"
            />,
          ]}
        />
      </span>
    </AuthReveal>
  );
};

const Root = ({ children }: { children?: ReactNode }) => {
  const { feature_flags, isLoading } = useFeatureFlags();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="text-ui-fg-interactive animate-spin" />
      </div>
    );
  }

  if (!feature_flags?.[MercurFeatureFlags.SELLER_REGISTRATION]) {
    return <Navigate to="/login" replace />;
  }

  return (
    <AuthLayout align="center">
      {Children.count(children) > 0 ? (
        children
      ) : (
        <div className="group/auth flex w-full flex-col" data-reveal="true">
          <RegisterLogo />
          <div className="flex w-full flex-col">
            <RegisterHeader />
            <RegisterForm />
          </div>
          <RegisterFooter />
        </div>
      )}
    </AuthLayout>
  );
};

export const RegisterPage = Object.assign(Root, {
  Logo: RegisterLogo,
  Header: RegisterHeader,
  Form: RegisterForm,
  Footer: RegisterFooter,
});
