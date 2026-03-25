import { Children, ReactNode } from "react"

import { zodResolver } from "@hookform/resolvers/zod"
import { Button, Heading, Hint, Input, Text } from "@medusajs/ui"
import { useForm } from "react-hook-form"
import { Trans, useTranslation } from "react-i18next"
import { Link, useNavigate } from "react-router-dom"
import config from "virtual:mercur/config"
import * as z from "zod"

import { Form } from "@components/common/form"
import AvatarBox from "@components/common/logo-box/avatar-box"

import { RegisterSchema } from "./register-schema"

const RegisterLogo = () => {
  return <AvatarBox />
}

const RegisterHeader = () => {
  const { t } = useTranslation()

  return (
    <div className="mb-4 flex flex-col items-center">
      <Heading>{t("register.title", { name: config.name ?? "Mercur" })}</Heading>
      <Text size="small" className="text-ui-fg-subtle text-center">
        {t("register.hint")}
      </Text>
    </div>
  )
}

const RegisterForm = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const form = useForm<z.infer<typeof RegisterSchema>>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  })

  const handleSubmit = form.handleSubmit(async ({ email }) => {
    navigate("/onboarding", { state: { email } })
  })

  const validationError =
    form.formState.errors.email?.message ||
    form.formState.errors.password?.message ||
    form.formState.errors.confirmPassword?.message

  return (
    <div className="flex w-full flex-col items-center">
      <Form {...form}>
        <form
          onSubmit={handleSubmit}
          className="flex w-full flex-col gap-y-6"
        >
          <div className="flex flex-col gap-y-2">
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
            {validationError && (
              <div className="mt-6 text-center">
                <Hint className="inline-flex" variant={"error"}>
                  {validationError}
                </Hint>
              </div>
            )}
          </div>
          <Button className="w-full" type="submit">
            {t("actions.continue")}
          </Button>
        </form>
      </Form>
      <RegisterFooter />
    </div>
  )
}

const RegisterFooter = () => {
  return (
    <div className="flex w-full flex-col items-center">
      <div className="my-6 h-px w-full border-b border-dotted" />
      <span className="text-ui-fg-muted txt-small">
        <Trans
          i18nKey="register.alreadySeller"
          components={[
            <Link
              key="login-link"
              to="/login"
              className="txt-small text-ui-fg-base transition-fg hover:text-ui-fg-base-hover focus-visible:text-ui-fg-base-hover font-medium outline-none"
            />,
          ]}
        />
      </span>
    </div>
  )
}

const Root = ({ children }: { children?: ReactNode }) => {
  return (
    <div className="bg-ui-bg-subtle relative flex min-h-dvh w-dvw items-center justify-center p-4">
      <div className="flex w-full max-w-[360px] flex-col items-center">
        {Children.count(children) > 0 ? (
          children
        ) : (
          <>
            <RegisterLogo />
            <RegisterHeader />
            <RegisterForm />
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
  Footer: RegisterFooter,
})
