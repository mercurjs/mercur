import { Children, ReactNode, useState } from "react"

import { zodResolver } from "@hookform/resolvers/zod"
import { Alert, Button, Heading, Hint, Input, Text } from "@medusajs/ui"
import { useForm } from "react-hook-form"
import { Trans, useTranslation } from "react-i18next"
import { Link, Navigate } from "react-router-dom"
import config from "virtual:mercur/config"
import * as z from "zod"

import { Form } from "@components/common/form"
import AvatarBox from "@components/common/logo-box/avatar-box"
import { useSignUpWithEmailPass } from "@hooks/api"
import { fetchQuery } from "@lib/client"

import {
  INITIAL_VALIDATION_STATE,
  PasswordValidationState,
  PasswordValidator,
} from "./password-validator"
import { RegisterSchema } from "./register-schema"

const RegisterLogo = () => {
  return <AvatarBox />
}

const RegisterHeader = () => {
  const { t } = useTranslation()

  return (
    <div className="mb-4 flex flex-col items-center">
      <Heading>{t("register.title")}</Heading>
      <Text size="small" className="text-ui-fg-subtle text-center">
        {t("register.hint")}
      </Text>
    </div>
  )
}

const RegisterForm = () => {
  const { t } = useTranslation()
  const [success, setSuccess] = useState(false)

  const [passwordValidation, setPasswordValidation] =
    useState<PasswordValidationState>(INITIAL_VALIDATION_STATE)

  const form = useForm<z.infer<typeof RegisterSchema>>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  })

  const { mutateAsync, isPending } = useSignUpWithEmailPass()
  const [isCreatingSeller, setIsCreatingSeller] = useState(false)

  const handleSubmit = form.handleSubmit(async ({ name, email, password, confirmPassword }) => {
    if (!passwordValidation.isValid) {
      return
    }

    try {
      const authResponse = await mutateAsync({ name, email, password, confirmPassword })
      const token = (authResponse as { token: string }).token

      setIsCreatingSeller(true)

      await fetchQuery("/vendor/sellers", {
        method: "POST",
        body: { name, email },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      setSuccess(true)
    } catch (error: any) {
      setIsCreatingSeller(false)
      const status = "status" in error ? error.status : undefined

      if (status === 401) {
        form.setError("email", {
          type: "manual",
          message: error.message,
        })
        return
      }

      if (status === 409) {
        form.setError("email", {
          type: "manual",
          message: t("register.emailTaken"),
        })
        return
      }

      form.setError("root.serverError", {
        type: "manual",
        message: error.message,
      })
    }
  })

  const serverError = form.formState.errors?.root?.serverError?.message
  const validationError =
    form.formState.errors.email?.message ||
    form.formState.errors.password?.message ||
    form.formState.errors.name?.message ||
    form.formState.errors.confirmPassword?.message

  if (success) {
    return <RegisterSuccess />
  }

  return (
    <div className="flex w-full flex-col gap-y-3">
      <Form {...form}>
        <form
          onSubmit={handleSubmit}
          className="flex w-full flex-col gap-y-6"
        >
          <div className="flex flex-col gap-y-2">
            <Form.Field
              control={form.control}
              name="name"
              render={({ field }) => (
                <Form.Item>
                  <Form.Control>
                    <Input
                      autoComplete="organization"
                      {...field}
                      className="bg-ui-bg-field-component"
                      placeholder={t("register.companyName")}
                    />
                  </Form.Control>
                </Form.Item>
              )}
            />
            <Form.Field
              control={form.control}
              name="email"
              render={({ field }) => (
                <Form.Item>
                  <Form.Control>
                    <Input
                      autoComplete="email"
                      {...field}
                      className="bg-ui-bg-field-component"
                      placeholder={t("fields.email")}
                    />
                  </Form.Control>
                </Form.Item>
              )}
            />
            <Form.Field
              control={form.control}
              name="password"
              render={({ field }) => (
                <Form.Item>
                  <Form.Control>
                    <Input
                      type="password"
                      autoComplete="new-password"
                      {...field}
                      className="bg-ui-bg-field-component"
                      placeholder={t("fields.password")}
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
                  <Form.Control>
                    <Input
                      type="password"
                      autoComplete="new-password"
                      {...field}
                      className="bg-ui-bg-field-component"
                      placeholder={t("register.confirmPassword")}
                    />
                  </Form.Control>
                </Form.Item>
              )}
            />
            <PasswordValidator
              password={form.watch("password")}
              onValidationChange={setPasswordValidation}
            />
          </div>
          {validationError && (
            <div className="text-center">
              <Hint className="inline-flex" variant={"error"}>
                {validationError}
              </Hint>
            </div>
          )}
          {serverError && (
            <Alert
              className="items-center bg-ui-bg-base p-2"
              dismissible
              variant="error"
            >
              {serverError}
            </Alert>
          )}
          <Button className="w-full" type="submit" isLoading={isPending || isCreatingSeller}>
            {t("register.signUp")}
          </Button>
        </form>
      </Form>
    </div>
  )
}

const RegisterSuccess = () => {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col items-center">
      <Heading>{t("register.successTitle")}</Heading>
      <Text
        size="small"
        className="mt-2 max-w-[320px] text-center text-ui-fg-subtle"
      >
        {t("register.successHint")}
      </Text>
      <Link to="/login">
        <Button className="mt-8">{t("register.backToLogin")}</Button>
      </Link>
    </div>
  )
}

const RegisterFooter = () => {
  return (
    <span className="txt-small my-6 text-ui-fg-muted">
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
  )
}

const Root = ({ children }: { children?: ReactNode }) => {
  if (!config.enableSellerRegistration) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="bg-ui-bg-subtle flex min-h-dvh w-dvw items-center justify-center">
      <div className="m-4 flex w-full max-w-[280px] flex-col items-center">
        {Children.count(children) > 0 ? (
          children
        ) : (
          <>
            <RegisterLogo />
            <RegisterHeader />
            <RegisterForm />
            <RegisterFooter />
          </>
        )}
      </div>
    </div>
  )
}

export const RegisterPage = Object.assign(Root, {
  Logo: RegisterLogo,
  Header: RegisterHeader,
  Form: RegisterForm,
  Success: RegisterSuccess,
  Footer: RegisterFooter,
})
