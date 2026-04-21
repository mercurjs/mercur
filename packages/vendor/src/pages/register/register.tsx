import { Children, ReactNode, useState } from "react"

import { zodResolver } from "@hookform/resolvers/zod"
import { Spinner } from "@medusajs/icons"
import { Button, Heading, Hint, Input, Text } from "@medusajs/ui"
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

import { RegisterSchema } from "./register-schema"

const RegisterLogo = () => {
  return <AvatarBox />
}

const RegisterHeader = () => {
  const { t } = useTranslation()

  return (
    <div className="mb-6 flex flex-col">
      <Heading>{t("register.title")}</Heading>
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

  const form = useForm<z.infer<typeof RegisterSchema>>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  })

  const { mutateAsync: signUp, isPending } = useSignUpWithEmailPass()

  const handleSubmit = form.handleSubmit(async ({ email, password }) => {
    setServerError(null)
    try {
      await signUp({ email, password })
      navigate("/onboarding", { state: { email } })
    } catch (error: any) {
      setServerError(error?.message || t("register.error"))
    }
  })

  const validationError =
    form.formState.errors.email?.message ||
    form.formState.errors.password?.message ||
    form.formState.errors.confirmPassword?.message

  const displayError = validationError || serverError

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
              </Form.Item>
            )}
          />
          <Form.Field
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <Form.Item>
                <Form.Label>{t("register.confirmPassword")}</Form.Label>
                <Form.Control>
                  <Input
                    type="password"
                    autoComplete="new-password"
                    {...field}
                  />
                </Form.Control>
              </Form.Item>
            )}
          />
          {displayError && (
            <Hint className="inline-flex" variant="error">
              {displayError}
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
  return (
    <div className="mt-auto">
      <span className="text-ui-fg-muted txt-small">
        <Trans
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
          <div className="mt-8">
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
