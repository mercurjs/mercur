import { zodResolver } from "@hookform/resolvers/zod"
import { Alert, Button, Heading, Hint, Input, Text } from "@medusajs/ui"
import { useForm } from "react-hook-form"
import { Trans, useTranslation } from "react-i18next"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import * as z from "zod"

import { Form } from "@components/common/form"
import AvatarBox from "@components/common/logo-box/avatar-box"
import { useSignInWithEmailPass } from "@hooks/api"
import { isFetchError } from "@lib/is-fetch-error"

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
})

export const Login = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const reason = searchParams.get("reason") || ""
  const reasonMessage = reason && reason.toLowerCase() === "unauthorized" ? "Session expired" : reason

  const from = "/"

  const form = useForm<z.infer<typeof LoginSchema>>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  const { mutateAsync, isPending } = useSignInWithEmailPass()

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
              })

              return
            }
          }

          form.setError("root.serverError", {
            type: "manual",
            message: error.message,
          })
        },
        onSuccess: () => {
          setTimeout(() => {
            navigate(from, { replace: true })
          }, 1000)
        },
      }
    )
  })

  const serverError =
    form.formState.errors?.root?.serverError?.message || reasonMessage
  const validationError =
    form.formState.errors.email?.message ||
    form.formState.errors.password?.message

  return (
    <div className="bg-ui-bg-subtle flex min-h-dvh w-dvw items-center justify-center">
      <div className="m-4 flex w-full max-w-[280px] flex-col items-center">
        <AvatarBox />
        <div className="mb-4 flex flex-col items-center">
          <Heading>{t("login.title")}</Heading>
          <Text size="small" className="text-ui-fg-subtle text-center">
            {t("login.hint")}
          </Text>
        </div>
        <div className="flex w-full flex-col gap-y-3">
          <Form {...form}>
            <form
              onSubmit={handleSubmit}
              className="flex w-full flex-col gap-y-6"
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
                          />
                        </Form.Control>
                      </Form.Item>
                    )
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
                          />
                        </Form.Control>
                      </Form.Item>
                    )
                  }}
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
                  className="bg-ui-bg-base items-center p-2"
                  dismissible
                  variant="error"
                >
                  {serverError}
                </Alert>
              )}
              <Button className="w-full" type="submit" isLoading={isPending}>
                Sign In
              </Button>
            </form>
          </Form>
        </div>
        <span className="text-ui-fg-muted txt-small my-6">
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
          <span className="text-ui-fg-muted txt-small">
            <Trans
              i18nKey="login.notSellerYet"
              components={[
                <Link
                  to="/register"
                  className="text-ui-fg-interactive transition-fg hover:text-ui-fg-interactive-hover focus-visible:text-ui-fg-interactive-hover font-medium outline-none"
                />,
              ]}
            />
          </span>
      </div>
    </div>
  )
}
