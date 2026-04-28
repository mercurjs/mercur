import { Children, ReactNode } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import i18n from "i18next";
import { Alert, Button, Heading, Input, Text } from "@medusajs/ui";
import { useForm } from "react-hook-form";
import { Trans, useTranslation } from "react-i18next";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
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
    <div className="mb-6 flex flex-col">
      <Heading>{t("login.title")}</Heading>
      <Text size="small" className="text-ui-fg-subtle">
        {t("login.hint")}
      </Text>
    </div>
  );
};

const LoginForm = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const reason = searchParams.get("reason") || "";
  const reasonMessage =
    reason && reason.toLowerCase() === "unauthorized"
      ? "Session expired"
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
              <Form.Item>
                <Form.Label>{t("fields.email")}</Form.Label>
                <Form.Control>
                  <Input autoComplete="email" {...field} />
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
                  />
                </Form.Control>
                <Form.ErrorMessage />
              </Form.Item>
            )}
          />
          {serverError && (
            <Alert
              className="bg-ui-bg-base items-center p-2"
              dismissible
              variant="error"
            >
              {serverError}
            </Alert>
          )}
        </div>
        <Button className="w-full" type="submit" isLoading={isPending}>
          {t("login.submit")}
        </Button>
      </form>
    </Form>
  );
};

const LoginFooter = () => {
  return (
    <div className="mt-auto flex flex-col gap-y-2">
      <span className="text-ui-fg-muted txt-small">
        <Trans
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
      {config.enableSellerRegistration && (
        <span className="text-ui-fg-muted txt-small">
          <Trans
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

export const LoginPage = Object.assign(Root, {
  Logo: LoginLogo,
  Header: LoginHeader,
  Form: LoginForm,
  Footer: LoginFooter,
});
