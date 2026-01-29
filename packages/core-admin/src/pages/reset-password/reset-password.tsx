import { useState } from "react";

import { Alert, Button, Heading, Input, Text, toast } from "@medusajs/ui";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Trans, useTranslation } from "react-i18next";
import { decodeToken } from "react-jwt";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import * as z from "zod";

import { Form } from "../../components/common/form";
import { LogoBox } from "../../components/common/logo-box";
import { i18n } from "../../components/utilities/i18n";
import {
  useResetPasswordForEmailPass,
  useUpdateProviderForEmailPass,
} from "../../hooks/api/auth";

const ResetPasswordInstructionsSchema = z.object({
  email: z.string().email(),
});

const ResetPasswordSchema = z
  .object({
    password: z.string().min(1),
    repeat_password: z.string().min(1),
  })
  .superRefine(({ password, repeat_password }, ctx) => {
    if (password !== repeat_password) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: i18n.t("resetPassword.passwordMismatch"),
        path: ["repeat_password"],
      });
    }
  });

const ResetPasswordTokenSchema = z.object({
  entity_id: z.string(),
  provider: z.string(),
  exp: z.number(),
  iat: z.number(),
});

type DecodedResetPasswordToken = {
  entity_id: string; // -> email in here
  provider: string;
  exp: string;
  iat: string;
};

const validateDecodedResetPasswordToken = (
  decoded: any,
): decoded is DecodedResetPasswordToken => {
  return ResetPasswordTokenSchema.safeParse(decoded).success;
};

const InvalidResetToken = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div
      className="flex min-h-dvh w-dvw items-center justify-center bg-ui-bg-base"
      data-testid="reset-password-invalid-token-page"
    >
      <div
        className="m-4 flex w-full max-w-[300px] flex-col items-center"
        data-testid="reset-password-invalid-token-container"
      >
        <LogoBox className="mb-4" />
        <div
          className="mb-6 flex flex-col items-center"
          data-testid="reset-password-invalid-token-header"
        >
          <Heading data-testid="reset-password-invalid-token-title">
            {t("resetPassword.invalidLinkTitle")}
          </Heading>
          <Text
            size="small"
            className="text-center text-ui-fg-subtle"
            data-testid="reset-password-invalid-token-hint"
          >
            {t("resetPassword.invalidLinkHint")}
          </Text>
        </div>
        <div className="flex w-full flex-col gap-y-3">
          <Button
            onClick={() => navigate("/reset-password", { replace: true })}
            className="w-full"
            type="submit"
            data-testid="reset-password-invalid-token-button"
          >
            {t("resetPassword.goToResetPassword")}
          </Button>
        </div>
        <span
          className="txt-small my-6"
          data-testid="reset-password-invalid-token-back-to-login-section"
        >
          <Trans
            i18nKey="resetPassword.backToLogin"
            components={[
              <Link
                key="login-link"
                to="/login"
                className="text-ui-fg-interactive outline-none transition-fg hover:text-ui-fg-interactive-hover focus-visible:text-ui-fg-interactive-hover"
                data-testid="reset-password-invalid-token-back-to-login-link"
              />,
            ]}
          />
        </span>
      </div>
    </div>
  );
};

const ChooseNewPassword = ({ token }: { token: string }) => {
  const { t } = useTranslation();

  const [showAlert, setShowAlert] = useState(false);

  const invite: DecodedResetPasswordToken | null = token
    ? decodeToken(token)
    : null;

  const isValidResetPasswordToken =
    invite && validateDecodedResetPasswordToken(invite);

  const form = useForm<z.infer<typeof ResetPasswordSchema>>({
    resolver: zodResolver(ResetPasswordSchema),
    defaultValues: {
      password: "",
      repeat_password: "",
    },
  });

  const { mutateAsync, isPending } = useUpdateProviderForEmailPass(token);

  const handleSubmit = form.handleSubmit(async ({ password }) => {
    if (!invite) {
      return;
    }

    await mutateAsync(
      {
        password,
      },
      {
        onSuccess: () => {
          form.setValue("password", "");
          form.setValue("repeat_password", "");
          setShowAlert(true);
        },
        onError: (error) => {
          toast.error(error.message);
        },
      },
    );
  });

  if (!isValidResetPasswordToken) {
    return <InvalidResetToken />;
  }

  return (
    <div
      className="flex min-h-dvh w-dvw items-center justify-center bg-ui-bg-subtle"
      data-testid="reset-password-choose-new-password-page"
    >
      <div
        className="m-4 flex w-full max-w-[280px] flex-col items-center"
        data-testid="reset-password-choose-new-password-container"
      >
        <LogoBox className="mb-4" />
        <div
          className="mb-6 flex flex-col items-center"
          data-testid="reset-password-choose-new-password-header"
        >
          <Heading data-testid="reset-password-choose-new-password-title">
            {t("resetPassword.resetPassword")}
          </Heading>
          <Text
            size="small"
            className="text-center text-ui-fg-subtle"
            data-testid="reset-password-choose-new-password-hint"
          >
            {t("resetPassword.newPasswordHint")}
          </Text>
        </div>
        <div className="flex w-full flex-col gap-y-3">
          <Form {...form}>
            <form
              onSubmit={handleSubmit}
              className="flex w-full flex-col gap-y-6"
              data-testid="reset-password-choose-new-password-form"
            >
              <div className="flex flex-col gap-y-4">
                <Input
                  type="email"
                  disabled
                  value={invite?.entity_id}
                  data-testid="reset-password-email-display"
                />
                <Form.Field
                  control={form.control}
                  name="password"
                  render={({ field }) => {
                    return (
                      <Form.Item>
                        <Form.Control>
                          <Input
                            autoComplete="new-password"
                            type="password"
                            {...field}
                            placeholder={t("resetPassword.newPassword")}
                            data-testid="reset-password-new-password-input"
                          />
                        </Form.Control>
                        <Form.ErrorMessage />
                      </Form.Item>
                    );
                  }}
                />
                <Form.Field
                  control={form.control}
                  name="repeat_password"
                  render={({ field }) => {
                    return (
                      <Form.Item>
                        <Form.Control>
                          <Input
                            autoComplete="off"
                            type="password"
                            {...field}
                            placeholder={t("resetPassword.repeatNewPassword")}
                            data-testid="reset-password-repeat-password-input"
                          />
                        </Form.Control>
                        <Form.ErrorMessage />
                      </Form.Item>
                    );
                  }}
                />
              </div>
              {showAlert && (
                <Alert
                  dismissible
                  variant="success"
                  data-testid="reset-password-success-alert"
                >
                  <div className="flex flex-col">
                    <span className="mb-1 text-ui-fg-base">
                      {t("resetPassword.successfulResetTitle")}
                    </span>
                    <span>{t("resetPassword.successfulReset")}</span>
                  </div>
                </Alert>
              )}
              {!showAlert && (
                <Button
                  className="w-full"
                  type="submit"
                  isLoading={isPending}
                  data-testid="reset-password-submit-button"
                >
                  {t("resetPassword.resetPassword")}
                </Button>
              )}
            </form>
          </Form>
        </div>
        <span
          className="txt-small my-6"
          data-testid="reset-password-choose-new-password-back-to-login-section"
        >
          <Trans
            i18nKey="resetPassword.backToLogin"
            components={[
              <Link
                key="login-link"
                to="/login"
                className="hover:text-ui-fg-base-hover focus-visible:text-ui-fg-base-hover text-ui-fg-base outline-none transition-fg"
                data-testid="reset-password-choose-new-password-back-to-login-link"
              />,
            ]}
          />
        </span>
      </div>
    </div>
  );
};

export const ResetPassword = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [showAlert, setShowAlert] = useState(false);

  const token = searchParams.get("token");

  const form = useForm<z.infer<typeof ResetPasswordInstructionsSchema>>({
    resolver: zodResolver(ResetPasswordInstructionsSchema),
    defaultValues: {
      email: "",
    },
  });

  const { mutateAsync, isPending } = useResetPasswordForEmailPass();

  const handleSubmit = form.handleSubmit(async ({ email }) => {
    await mutateAsync(
      {
        email,
      },
      {
        onSuccess: () => {
          form.setValue("email", "");
          setShowAlert(true);
        },
        onError: (error) => {
          toast.error(error.message);
        },
      },
    );
  });

  if (token) {
    return <ChooseNewPassword token={token} />;
  }

  return (
    <div
      className="flex min-h-dvh w-dvw items-center justify-center bg-ui-bg-base"
      data-testid="reset-password-page"
    >
      <div
        className="m-4 flex w-full max-w-[300px] flex-col items-center"
        data-testid="reset-password-container"
      >
        <LogoBox className="mb-4" />
        <div
          className="mb-4 flex flex-col items-center"
          data-testid="reset-password-header"
        >
          <Heading data-testid="reset-password-title">
            {t("resetPassword.resetPassword")}
          </Heading>
          <Text
            size="small"
            className="text-center text-ui-fg-subtle"
            data-testid="reset-password-hint"
          >
            {t("resetPassword.hint")}
          </Text>
        </div>
        <div className="flex w-full flex-col gap-y-3">
          <Form {...form}>
            <form
              onSubmit={handleSubmit}
              className="flex w-full flex-col gap-y-6"
              data-testid="reset-password-form"
            >
              <div className="mt-4 flex flex-col gap-y-3">
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
                            placeholder={t("fields.email")}
                            data-testid="reset-password-email-input"
                          />
                        </Form.Control>
                        <Form.ErrorMessage />
                      </Form.Item>
                    );
                  }}
                />
              </div>
              {showAlert && (
                <Alert
                  dismissible
                  variant="success"
                  data-testid="reset-password-success-alert"
                >
                  <div className="flex flex-col">
                    <span className="mb-1 text-ui-fg-base">
                      {t("resetPassword.successfulRequestTitle")}
                    </span>
                    <span>{t("resetPassword.successfulRequest")}</span>
                  </div>
                </Alert>
              )}
              <Button
                className="w-full"
                type="submit"
                isLoading={isPending}
                data-testid="reset-password-submit-button"
              >
                {t("resetPassword.sendResetInstructions")}
              </Button>
            </form>
          </Form>
        </div>
        <span
          className="txt-small my-6"
          data-testid="reset-password-back-to-login-section"
        >
          <Trans
            i18nKey="resetPassword.backToLogin"
            components={[
              <Link
                key="login-link"
                to="/login"
                className="hover:text-ui-fg-base-hover focus-visible:text-ui-fg-base-hover text-ui-fg-base outline-none transition-fg"
                data-testid="reset-password-back-to-login-link"
              />,
            ]}
          />
        </span>
      </div>
    </div>
  );
};
