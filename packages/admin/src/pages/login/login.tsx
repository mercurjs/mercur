import { Children, ReactNode, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import i18n from "i18next";
import { Button, Heading, Input, Text, toast } from "@medusajs/ui";
import { useForm } from "react-hook-form";
import { Trans, useTranslation } from "react-i18next";
import {
  Link,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import * as z from "zod";

import { Form } from "@components/common/form";
import AvatarBox from "@components/common/logo-box/avatar-box";
import { AuthLayout } from "@components/layout/auth-layout";
import { useSignInWithEmailPass } from "@hooks/api";
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
  return <AvatarBox />;
};

const LoginHeader = () => {
  const { t } = useTranslation();

  return (
    <div className="mb-6 flex flex-col" data-testid="login-header">
      <Heading data-testid="login-title">
        {t("login.title", { name: config.name ?? "Mercur" })}
      </Heading>
      <Text size="small" className="text-ui-fg-subtle" data-testid="login-hint">
        {t("login.hint")}
      </Text>
    </div>
  );
};

const LoginForm = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const reason = searchParams.get("reason") || "";
  const from = location.state?.from?.pathname || "/orders";

  useEffect(() => {
    if (reason && reason.toLowerCase() === "unauthorized") {
      toast.error(t("login.sessionExpired"));
    }
  }, [reason, t]);

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
          if (isFetchError(error) && error.status === 401) {
            toast.error(t("login.invalidCredentials"));
            return;
          }

          toast.error(error.message);
        },
        onSuccess: () => {
          navigate(from, { replace: true });
        },
      },
    );
  });

  return (
    <Form {...form}>
      <form
        onSubmit={handleSubmit}
        className="flex w-full flex-col gap-y-6"
        data-testid="login-form"
      >
        <div className="flex flex-col gap-y-4">
          <Form.Field
            control={form.control}
            name="email"
            render={({ field }) => (
              <Form.Item>
                <Form.Label>{t("fields.email")}</Form.Label>
                <Form.Control>
                  <Input
                    autoComplete="email"
                    {...field}
                    data-testid="login-email-input"
                  />
                </Form.Control>
                <Form.ErrorMessage />
              </Form.Item>
            )}
          />
          <Form.Field
            control={form.control}
            name="password"
            render={({ field }) => (
              <Form.Item>
                <Form.Label>{t("fields.password")}</Form.Label>
                <Form.Control>
                  <Input
                    type="password"
                    autoComplete="current-password"
                    {...field}
                    data-testid="login-password-input"
                  />
                </Form.Control>
                <Form.ErrorMessage />
              </Form.Item>
            )}
          />
        </div>
        <Button
          className="w-full"
          type="submit"
          isLoading={isPending}
          data-testid="login-submit-button"
        >
          {t("login.submit")}
        </Button>
      </form>
    </Form>
  );
};

const LoginFooter = () => {
  const { t } = useTranslation();

  return (
    <div
      className="mt-auto flex flex-col gap-y-2"
      data-testid="login-forgot-password-section"
    >
      <span className="text-ui-fg-muted txt-small">
        <Trans
          t={t}
          i18nKey="login.forgotPassword"
          components={[
            <Link
              key="reset-password-link"
              to="/reset-password"
              className="text-ui-fg-interactive transition-fg hover:text-ui-fg-interactive-hover focus-visible:text-ui-fg-interactive-hover font-medium outline-none"
              data-testid="login-reset-password-link"
            />,
          ]}
        />
      </span>
    </div>
  );
};

const Root = ({ children }: { children?: ReactNode }) => {
  return (
    <AuthLayout>
      {Children.count(children) > 0 ? (
        children
      ) : (
        <>
          <LoginLogo />
          <div className="mt-6">
            <LoginHeader />
            <LoginForm />
          </div>
          <LoginFooter />
        </>
      )}
    </AuthLayout>
  );
};

export const Login = Object.assign(Root, {
  Logo: LoginLogo,
  Header: LoginHeader,
  Form: LoginForm,
  Footer: LoginFooter,
});
