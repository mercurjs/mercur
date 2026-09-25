import { Children, ReactNode, useState } from "react"

import { zodResolver } from "@hookform/resolvers/zod"
import { CheckCircleMiniSolid, Spinner } from "@medusajs/icons"
import { Button, Heading, Hint, Input, Text, clx } from "@medusajs/ui"
import { MercurFeatureFlags } from "@mercurjs/types"
import { useForm } from "react-hook-form"
import { Trans, useTranslation } from "react-i18next"
import { Link, Navigate, useNavigate } from "react-router-dom"
import config from "virtual:mercur/config"
import * as z from "zod"

import { Form } from "@components/common/form"
import AvatarBox from "@components/common/logo-box/avatar-box"
import { AuthLayout } from "@components/layout/auth-layout"
import { useFeatureFlags, useSignUpWithEmailPass } from "@hooks/api"
import { getStoredRegisterDraft, setStoredRegisterDraft } from "@lib/onboarding-draft"

import { RegisterSchema } from "./register-schema"

export const PasswordRequirements = ({ value = "" }: { value?: string }) => {
  const { t } = useTranslation()

  const trimmed = value.trim()
  const hasMinLength = trimmed.length >= 8
  const hasLower = /[a-z]/.test(value)
  const hasUpper = /[A-Z]/.test(value)
  const hasNumberOrSymbol = /[\d\W]/.test(value)

  const requirements = [
    {
      id: "minLength",
      label: t("register.passwordRequirements.minLength"),
      met: hasMinLength,
    },
    {
      id: "lowercase",
      label: t("register.passwordRequirements.lowercase"),
      met: hasLower,
    },
    {
      id: "uppercase",
      label: t("register.passwordRequirements.uppercase"),
      met: hasUpper,
    },
    {
      id: "numberOrSymbol",
      label: t("register.passwordRequirements.numberOrSymbol"),
      met: hasNumberOrSymbol,
    },
  ]

  const allMet = requirements.every((r) => r.met)

  return (
    <div data-testid="password-requirements" className="mt-2 flex flex-col gap-y-1.5">
      <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
        {requirements.map((req) => (
          <div
            key={req.id}
            data-testid={`password-requirement-${req.id}`}
            data-met={req.met}
            className={clx(
              "flex items-center gap-x-2 text-xs transition-colors",
              req.met ? "text-ui-tag-green-text" : "text-ui-fg-subtle"
            )}
          >
            <div className="flex h-4 w-4 shrink-0 items-center justify-center">
              {req.met ? (
                <CheckCircleMiniSolid className="h-4 w-4 text-ui-tag-green-icon" />
              ) : (
                <div className="h-1.5 w-1.5 rounded-full bg-ui-fg-muted" />
              )}
            </div>
            <span>{req.label}</span>
          </div>
        ))}
      </div>

      {allMet && (
        <div
          data-testid="password-requirements-all-met"
          className="flex items-center gap-x-1.5 pt-0.5 text-xs text-ui-tag-green-text"
        >
          <CheckCircleMiniSolid className="h-3.5 w-3.5 text-ui-tag-green-icon" />
          <span>{t("register.passwordRequirements.allMet")}</span>
        </div>
      )}
    </div>
  )
}

const RegisterLogo = () => {
  return <AvatarBox />
}

const RegisterHeader = () => {
  const { t } = useTranslation()

  return (
    <div className="mb-6 flex flex-col">
      <Heading>{t("register.title", { name: config.name ?? "Mercur" })}</Heading>
      <Text size="small" className="text-ui-fg-subtle">
        {t("register.hint", { name: config.name ?? "Mercur" })}
      </Text>
    </div>
  )
}

const RegisterForm = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [serverError, setServerError] = useState<string | null>(null)

  const [initialDraft] = useState(() => getStoredRegisterDraft())

  const form = useForm<z.infer<typeof RegisterSchema>>({
    resolver: zodResolver(RegisterSchema),
    mode: "onSubmit",
    reValidateMode: "onSubmit",
    defaultValues: {
      first_name: initialDraft.first_name || "",
      last_name: initialDraft.last_name || "",
      email: initialDraft.email || "",
      password: "",
    },
  })

  const { mutateAsync: signUp, isPending } = useSignUpWithEmailPass()

  const handleSubmit = form.handleSubmit(async ({ first_name, last_name, email, password }) => {
    setServerError(null)
    try {
      await signUp({ email, password })
      setStoredRegisterDraft({ first_name, last_name, email })
      sessionStorage.setItem("mercur_onboarding_email", email)
      navigate("/onboarding", { state: { email, first_name, last_name } })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : t("register.error")
      setServerError(message)
    }
  })

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="flex w-full flex-col gap-y-6">
        <div className="flex flex-col gap-y-4">
          <Form.Field
            control={form.control}
            name="first_name"
            render={({ field }) => (
              <Form.Item>
                <Form.Label>{t("register.firstName")}</Form.Label>
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
                <Form.Label>{t("register.lastName")}</Form.Label>
                <Form.Control>
                  <Input autoComplete="family-name" {...field} />
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
                    autoComplete="new-password"
                    {...field}
                  />
                </Form.Control>
                <PasswordRequirements value={field.value || ""} />
                <Form.ErrorMessage />
              </Form.Item>
            )}
          />
          {serverError && (
            <Hint className="inline-flex" variant="error">
              {serverError}
            </Hint>
          )}
        </div>
        <Button className="w-full" type="submit" isLoading={isPending}>
          {t("actions.continue")}
        </Button>
      </form>
    </Form>
  )
}

const RegisterFooter = () => {
  const { t } = useTranslation()

  return (
    <div className="mt-auto">
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
    </div>
  )
}

const Root = ({ children }: { children?: ReactNode }) => {
  const { feature_flags, isLoading } = useFeatureFlags()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="text-ui-fg-interactive animate-spin" />
      </div>
    )
  }

  if (!feature_flags?.[MercurFeatureFlags.SELLER_REGISTRATION]) {
    return <Navigate to="/login" replace />
  }

  const onboardingEmail =
    typeof window !== "undefined"
      ? sessionStorage.getItem("mercur_onboarding_email")
      : null

  if (onboardingEmail) {
    return <Navigate to="/onboarding" replace />
  }

  return (
    <AuthLayout>
      {Children.count(children) > 0 ? (
        children
      ) : (
        <>
          <RegisterLogo />
          <div className="mt-6">
            <RegisterHeader />
            <RegisterForm />
          </div>
          <RegisterFooter />
        </>
      )}
    </AuthLayout>
  )
}

export const RegisterPage = Object.assign(Root, {
  Logo: RegisterLogo,
  Header: RegisterHeader,
  Form: RegisterForm,
  Footer: RegisterFooter,
})
