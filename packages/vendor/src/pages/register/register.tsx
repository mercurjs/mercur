import { Children, ReactNode, useEffect, useState } from "react"

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
import {
  useFeatureFlags,
  useSignInWithEmailPass,
  useSignUpWithEmailPass,
} from "@hooks/api"

import { RegisterSchema } from "./register-schema"

export const REGISTER_DRAFT_KEY = "mercur_register_draft"

export type RegisterDraft = Partial<z.infer<typeof RegisterSchema>>

export const getStoredRegisterDraft = (): RegisterDraft => {
  if (typeof window === "undefined") {
    return {}
  }
  try {
    const raw = sessionStorage.getItem(REGISTER_DRAFT_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      return {
        first_name: typeof parsed.first_name === "string" ? parsed.first_name : "",
        last_name: typeof parsed.last_name === "string" ? parsed.last_name : "",
        email: typeof parsed.email === "string" ? parsed.email : "",
        password: typeof parsed.password === "string" ? parsed.password : "",
      }
    }
  } catch {
    // Ignore storage parse error
  }
  return {}
}

export const setStoredRegisterDraft = (draft: Partial<RegisterDraft>) => {
  if (typeof window === "undefined") return
  try {
    const current = getStoredRegisterDraft()
    sessionStorage.setItem(
      REGISTER_DRAFT_KEY,
      JSON.stringify({ ...current, ...draft }),
    )
  } catch {
    // Ignore storage write error
  }
}

const PasswordRequirements = ({ value = "" }: { value?: string }) => {
  const { t } = useTranslation()

  const trimmed = value.trim()
  const hasMinLength = trimmed.length >= 8
  const hasLower = /[a-z]/.test(value)
  const hasUpper = /[A-Z]/.test(value)
  const hasNumberOrSymbol = /[\d\W]/.test(value)

  const requirements = [
    {
      id: "minLength",
      label: t("register.passwordRequirements.minLength", "At least 8 characters"),
      met: hasMinLength,
    },
    {
      id: "lowercase",
      label: t("register.passwordRequirements.lowercase", "One lowercase letter"),
      met: hasLower,
    },
    {
      id: "uppercase",
      label: t("register.passwordRequirements.uppercase", "One uppercase letter"),
      met: hasUpper,
    },
    {
      id: "numberOrSymbol",
      label: t("register.passwordRequirements.numberOrSymbol", "One number or symbol"),
      met: hasNumberOrSymbol,
    },
  ]

  const metCount = requirements.filter((r) => r.met).length
  const allMet = metCount === requirements.length

  return (
    <div className="mt-2 flex flex-col gap-y-2.5">
      {/* 4-segment progress bar */}
      <div className="flex w-full items-center gap-x-1.5" aria-hidden="true">
        {requirements.map((req, idx) => {
          const isFilled = idx < metCount
          return (
            <div
              key={req.id}
              className={clx(
                "h-1 flex-1 rounded-full transition-all duration-300",
                isFilled
                  ? allMet
                    ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.35)]"
                    : "bg-emerald-500/80"
                  : "bg-ui-border-base"
              )}
            />
          )
        })}
      </div>

      {/* Conditions list with green checkmark when aligned */}
      <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
        {requirements.map((req) => (
          <div
            key={req.id}
            className={clx(
              "flex items-center gap-x-2 text-xs transition-colors duration-200",
              req.met
                ? "text-emerald-700 dark:text-emerald-400 font-medium"
                : "text-ui-fg-subtle"
            )}
          >
            <div className="flex h-4 w-4 shrink-0 items-center justify-center">
              {req.met ? (
                <CheckCircleMiniSolid className="h-4 w-4 text-emerald-600 dark:text-emerald-400 transition-transform scale-100" />
              ) : (
                <div className="h-1.5 w-1.5 rounded-full bg-ui-fg-muted/40" />
              )}
            </div>
            <span>{req.label}</span>
          </div>
        ))}
      </div>

      {allMet && (
        <div className="flex items-center gap-x-1.5 pt-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
          <CheckCircleMiniSolid className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>
            {t("register.passwordRequirements.allMet", "Password meets all requirements")}
          </span>
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

  const [initialDraft] = useState<RegisterDraft>(() => getStoredRegisterDraft())

  const form = useForm<z.infer<typeof RegisterSchema>>({
    resolver: zodResolver(RegisterSchema),
    mode: "onSubmit",
    reValidateMode: "onSubmit",
    defaultValues: {
      first_name: initialDraft.first_name || "",
      last_name: initialDraft.last_name || "",
      email: initialDraft.email || "",
      password: initialDraft.password || "",
    },
  })

  // Watch and persist form values to sessionStorage so details survive back navigation / reload
  useEffect(() => {
    const subscription = form.watch((values) => {
      setStoredRegisterDraft({
        first_name: values.first_name || "",
        last_name: values.last_name || "",
        email: values.email || "",
        password: values.password || "",
      })
    })
    return () => subscription.unsubscribe()
  }, [form])

  const { mutateAsync: signUp, isPending: isSigningUp } = useSignUpWithEmailPass()
  const { mutateAsync: signIn, isPending: isSigningIn } = useSignInWithEmailPass()
  const isPending = isSigningUp || isSigningIn

  const handleSubmit = form.handleSubmit(async ({ first_name, last_name, email, password }) => {
    setServerError(null)
    try {
      try {
        await signUp({ email, password })
      } catch (signError: any) {
        const message = signError?.message?.toLowerCase() || ""
        if (
          message.includes("already exists") ||
          message.includes("duplicate") ||
          message.includes("identity")
        ) {
          await signIn({ email, password })
        } else {
          throw signError
        }
      }
      // Persist identity details for onboarding step that creates the seller member.
      // Backend emailpass register does not accept these fields directly today,
      // so they ride through sessionStorage and land on the member via onboarding.
      setStoredRegisterDraft({ first_name, last_name, email, password })
      sessionStorage.setItem("mercur_onboarding_email", email)
      navigate("/onboarding", { state: { email, first_name, last_name } })
    } catch (error: any) {
      setServerError(error?.message || t("register.error"))
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
