import { Alert, Button, Heading, Hint, Input, Text } from "@medusajs/ui";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Trans, useTranslation } from "react-i18next";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import * as z from "zod";
import AvatarBox from "@components/common/logo-box/avatar-box";
import { Form } from "@components/common/form";
import { useExtension } from "@providers/extension-provider";
import { useSignInWithEmailPass } from "@hooks/api";
import { isFetchError } from "@lib/is-fetch-error";

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const Login = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { getWidgets } = useExtension();
  const [searchParams] = useSearchParams()


  const reason = searchParams.get("reason") || ""
  const reasonMessage = reason && reason.toLowerCase() === "unauthorized" ? "Session expired" : reason
  const from = location.state?.from?.pathname || "/orders";

  const form = useForm<z.infer<typeof LoginSchema>>({
    resolver: zodResolver(LoginSchema),
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
          navigate(from, { replace: true });
        },
      },
    );
  });

  const serverError = form.formState.errors?.root?.serverError?.message || reasonMessage;
  const validationError =
    form.formState.errors.email?.message ||
    form.formState.errors.password?.message;

  return (
    <div
      className="flex min-h-dvh w-dvw items-center justify-center bg-ui-bg-subtle"
      data-testid="login-page"
    >
      <div
        className="m-4 flex w-full max-w-[280px] flex-col items-center"
        data-testid="login-container"
      >
        <AvatarBox />
        <div
          className="mb-4 flex flex-col items-center"
          data-testid="login-header"
        >
          <Heading data-testid="login-title">{t("login.title")}</Heading>
          <Text
            size="small"
            className="text-center text-ui-fg-subtle"
            data-testid="login-hint"
          >
            {t("login.hint")}
          </Text>
        </div>
        <div className="flex w-full flex-col gap-y-3">
          {getWidgets("login.before").map((Component, i) => {
            return <Component key={i} />;
          })}
          <Form {...form}>
            <form
              onSubmit={handleSubmit}
              className="flex w-full flex-col gap-y-6"
              data-testid="login-form"
            >
              <div className="flex flex-col gap-y-1">
                <Form.Field
                  control={form.control}
                  name="email"
                  render={({ field }) => {
                    return (
                      <Form.Item>
                        <Form.Control>
                          <Input
                            autoComplete="email"
                            {...field}
                            className="bg-ui-bg-field-component"
                            placeholder={t("fields.email")}
                            data-testid="login-email-input"
                          />
                        </Form.Control>
                      </Form.Item>
                    );
                  }}
                />
                <Form.Field
                  control={form.control}
                  name="password"
                  render={({ field }) => {
                    return (
                      <Form.Item>
                        <Form.Label>{}</Form.Label>
                        <Form.Control>
                          <Input
                            type="password"
                            autoComplete="current-password"
                            {...field}
                            className="bg-ui-bg-field-component"
                            placeholder={t("fields.password")}
                            data-testid="login-password-input"
                          />
                        </Form.Control>
                      </Form.Item>
                    );
                  }}
                />
              </div>
              {validationError && (
                <div
                  className="text-center"
                  data-testid="login-validation-error"
                >
                  <Hint
                    className="inline-flex"
                    variant="error"
                    data-testid="login-validation-error-message"
                  >
                    {validationError}
                  </Hint>
                </div>
              )}
              {serverError && (
                <Alert
                  className="items-center bg-ui-bg-base p-2"
                  dismissible
                  variant="error"
                  data-testid="login-server-error"
                >
                  {serverError}
                </Alert>
              )}
              <Button
                className="w-full"
                type="submit"
                isLoading={isPending}
                data-testid="login-submit-button"
              >
                {t("actions.continueWithEmail")}
              </Button>
            </form>
          </Form>
          {getWidgets("login.after").map((Component, i) => {
            return <Component key={i} />;
          })}
        </div>
        <span
          className="txt-small my-6 text-ui-fg-muted"
          data-testid="login-forgot-password-section"
        >
          <Trans
            i18nKey="login.forgotPassword"
            components={[
              <Link
                key="reset-password-link"
                to="/reset-password"
                className="font-medium text-ui-fg-interactive outline-none transition-fg hover:text-ui-fg-interactive-hover focus-visible:text-ui-fg-interactive-hover"
                data-testid="login-reset-password-link"
              />,
            ]}
          />
        </span>
      </div>
    </div>
  );
};
