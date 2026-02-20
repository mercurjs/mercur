import { zodResolver } from "@hookform/resolvers/zod"
import { Alert, Button, Heading, Hint, Input, Text } from "@medusajs/ui"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { decodeToken } from "react-jwt"
import { Link, useSearchParams } from "react-router-dom"
import { z } from "zod"

import {
  useSignUpForInvite,
  useAcceptInvite,
} from "../../hooks/api/invites"

const CreateAccountSchema = z
  .object({
    email: z.string().email(),
    first_name: z.string().min(1, "First name is required"),
    last_name: z.string().min(1, "Last name is required"),
    password: z.string().min(1, "Password is required"),
    repeat_password: z.string().min(1, "Please repeat password"),
  })
  .superRefine(({ password, repeat_password }, ctx) => {
    if (password !== repeat_password) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Passwords do not match",
        path: ["repeat_password"],
      })
    }
  })

type DecodedInvite = {
  id: string
  exp: number
  iat: number
}

const InviteSchema = z.object({
  id: z.string(),
  exp: z.number(),
  iat: z.number(),
})

const validateDecodedInvite = (decoded: unknown): decoded is DecodedInvite => {
  return InviteSchema.safeParse(decoded).success
}

const InviteAcceptPage = () => {
  const [searchParams] = useSearchParams()
  const [success, setSuccess] = useState(false)

  const token = searchParams.get("token") || null
  const invite: DecodedInvite | null = token ? decodeToken(token) : null
  const isValidInvite = invite && validateDecodedInvite(invite)

  return (
    <div className="bg-ui-bg-subtle relative flex min-h-dvh w-dvw items-center justify-center p-4">
      <div className="flex w-full max-w-[360px] flex-col items-center">
        {isValidInvite ? (
          !success ? (
            <CreateView
              onSuccess={() => setSuccess(true)}
              token={token!}
            />
          ) : (
            <SuccessView />
          )
        ) : (
          <InvalidView />
        )}
      </div>
    </div>
  )
}

const LoginLink = () => (
  <div className="flex w-full flex-col items-center">
    <div className="my-6 h-px w-full border-b border-dotted" />
    <Link
      to="/login"
      className="txt-small text-ui-fg-base transition-fg hover:text-ui-fg-base-hover font-medium outline-none"
    >
      Back to login
    </Link>
  </div>
)

const InvalidView = () => (
  <div className="flex flex-col items-center">
    <div className="flex flex-col items-center gap-y-1">
      <Heading>Invalid invite</Heading>
      <Text size="small" className="text-ui-fg-subtle text-center">
        The invite link is invalid or has expired. Please request a new invite.
      </Text>
    </div>
    <LoginLink />
  </div>
)

const CreateView = ({
  onSuccess,
  token,
}: {
  onSuccess: () => void
  token: string
}) => {
  const [invalid, setInvalid] = useState(false)

  const form = useForm<z.infer<typeof CreateAccountSchema>>({
    resolver: zodResolver(CreateAccountSchema),
    defaultValues: {
      email: "",
      first_name: "",
      last_name: "",
      password: "",
      repeat_password: "",
    },
  })

  const { mutateAsync: signUp, isPending: isCreating } = useSignUpForInvite()
  const { mutateAsync: acceptInvite, isPending: isAccepting } =
    useAcceptInvite(token)

  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      const authToken = await signUp({
        email: data.email,
        password: data.password,
      })

      await acceptInvite({
        name: `${data.first_name} ${data.last_name}`,
        auth_token: authToken,
      })

      onSuccess()
    } catch (error: any) {
      if (error?.status === 400) {
        form.setError("root", {
          type: "manual",
          message: "This invite is no longer valid.",
        })
        setInvalid(true)
        return
      }
      form.setError("root", {
        type: "manual",
        message: error.message || "Something went wrong",
      })
    }
  })

  const serverError = form.formState.errors.root?.message
  const validationError =
    form.formState.errors.email?.message ||
    form.formState.errors.first_name?.message ||
    form.formState.errors.last_name?.message ||
    form.formState.errors.password?.message ||
    form.formState.errors.repeat_password?.message

  return (
    <div className="flex w-full flex-col items-center">
      <div className="mb-4 flex flex-col items-center">
        <Heading>Create your account</Heading>
        <Text size="small" className="text-ui-fg-subtle text-center">
          Enter your details to accept the invitation and join the team.
        </Text>
      </div>
      <form onSubmit={handleSubmit} className="flex w-full flex-col gap-y-6">
        <div className="flex flex-col gap-y-2">
          <Input
            autoComplete="off"
            placeholder="Email"
            className="bg-ui-bg-field-component"
            {...form.register("email")}
          />
          <Input
            autoComplete="given-name"
            placeholder="First name"
            className="bg-ui-bg-field-component"
            {...form.register("first_name")}
          />
          <Input
            autoComplete="family-name"
            placeholder="Last name"
            className="bg-ui-bg-field-component"
            {...form.register("last_name")}
          />
          <Input
            autoComplete="new-password"
            type="password"
            placeholder="Password"
            className="bg-ui-bg-field-component"
            {...form.register("password")}
          />
          <Input
            autoComplete="off"
            type="password"
            placeholder="Repeat password"
            className="bg-ui-bg-field-component"
            {...form.register("repeat_password")}
          />
          {validationError && (
            <div className="mt-2 text-center">
              <Hint variant="error">{validationError}</Hint>
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
        </div>
        <Button
          className="w-full"
          type="submit"
          isLoading={isCreating || isAccepting}
          disabled={invalid}
        >
          Create account
        </Button>
      </form>
      <LoginLink />
    </div>
  )
}

const SuccessView = () => (
  <div className="flex w-full flex-col items-center gap-y-6">
    <div className="flex flex-col items-center gap-y-1">
      <Heading className="text-center">Account created!</Heading>
      <Text size="small" className="text-ui-fg-subtle text-center">
        Your account has been created. You can now log in.
      </Text>
    </div>
    <Button variant="secondary" asChild className="w-full">
      <Link to="/login" replace>
        Go to login
      </Link>
    </Button>
  </div>
)

export default InviteAcceptPage
