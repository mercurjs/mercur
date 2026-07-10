"use client"

import { Button, Card } from "@/components/atoms"
import { LabeledInput } from "@/components/cells"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  FieldError,
  FieldValues,
  FormProvider,
  useForm,
  useFormContext,
  UseFormReturn,
} from "react-hook-form"
import { ProfilePasswordFormData, profilePasswordSchema } from "./schema"
import { useState } from "react"
import { updateCustomerPassword } from "@/lib/data/customer"
import { Heading, toast } from "@medusajs/ui"
import LocalizedClientLink from "../LocalizedLink/LocalizedLink"
import { PasswordValidator } from "@/components/cells/PasswordValidator/PasswordValidator"

export const ProfilePasswordForm = ({ token }: { token?: string }) => {
  const form = useForm<ProfilePasswordFormData>({
    resolver: zodResolver(profilePasswordSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  })

  return (
    <FormProvider {...form}>
      <Form form={form} token={token} />
    </FormProvider>
  )
}

const Form = ({
  form,
  token,
}: {
  form: UseFormReturn<ProfilePasswordFormData>
  token?: string
}) => {
  const [success, setSuccess] = useState(false)
  const [confirmPasswordError, setConfirmPasswordError] = useState<
    FieldError | undefined
  >(undefined)
  const [newPasswordError, setNewPasswordError] = useState({
    isValid: false,
    lower: false,
    upper: false,
    "8chars": false,
    symbolOrDigit: false,
  })

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useFormContext()

  const updatePassword = async (data: FieldValues) => {
    if (form.getValues("confirmPassword") !== form.getValues("newPassword")) {
      setConfirmPasswordError({
        message: "Passwords don't match. Please enter correct password.",
        type: "custom",
      } as FieldError)
      return
    }

    setConfirmPasswordError(undefined)

    if (newPasswordError.isValid) {
      try {
        const res = await updateCustomerPassword(data.newPassword, token!)
        if (res.success) {
          setSuccess(true)
        } else {
          toast.error(res.error || "Something went wrong")
        }
      } catch (err) {
        console.log(err)
        return
      }
    }
  }

  return success ? (
    <div className="p-4">
      <Heading
        level="h1"
        className="uppercase heading-md text-primary text-center"
      >
        Password changed
      </Heading>
      <p className="text-center my-8">
        Your are ready to log in with your new password
      </p>
      <LocalizedClientLink href="/login">
        <Button
          className="uppercase py-3 px-6 !font-semibold w-full"
          size="large"
        >
          Log in
        </Button>
      </LocalizedClientLink>
    </div>
  ) : (
    <form
      className="flex flex-col gap-4 px-4"
      onSubmit={handleSubmit(updatePassword)}
    >
      <Heading
        level="h1"
        className="uppercase heading-md text-primary"
      >
        Set new password
      </Heading>
      <p className="text-secondary label-md">
        Almost done. Enter your new password, and you&apos;re good to go.
      </p>
      <LabeledInput
        label="Password"
        type="password"
        error={errors.newPassword as FieldError}
        {...register("newPassword")}
      />
      <PasswordValidator
        password={form.watch("newPassword")}
        setError={setNewPasswordError}
      />
      <LabeledInput
        label="Confirm password"
        type="password"
        error={(confirmPasswordError || errors.confirmPassword) as FieldError}
        {...register("confirmPassword")}
      />
      <Button className="w-full my-4 uppercase">Set new password</Button>
    </form>
  )
}
