'use client';

import { useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { FetchError } from '@medusajs/js-sdk';
import Link from 'next/link';
import { FieldError, FormProvider, useForm, useFormContext } from 'react-hook-form';

import { Button } from '@/components/atoms';
import { LabeledInput } from '@/components/cells';
import { sendResetPasswordEmail } from '@/lib/data/customer';
import { toast } from '@/lib/helpers/toast';

import { ForgotPasswordFormData, forgotPasswordSchema } from './schema';

export const ForgotPasswordForm = () => {
  const methods = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: ''
    }
  });

  return (
    <FormProvider {...methods}>
      <Form />
    </FormProvider>
  );
};

const Form = () => {
  const {
    handleSubmit,
    register,
    formState: { errors, isSubmitting },
    reset
  } = useFormContext<ForgotPasswordFormData>();

  const submit = async (data: ForgotPasswordFormData) => {
    if (!data.email) return;

    const result = await sendResetPasswordEmail(data.email);

    if (!result.success) {
      toast.error({ title: result.error || 'An error occurred. Please try again.' });
      return;
    }

    reset({ email: '' });

    toast.success({
      title: `Password reset was requested. If an account exists for ${data.email}, you’ll receive an email with a reset link. Check your inbox and spam folder - the link is valid for one hour.`
    });
  };

  return (
    <div
      className="mx-auto mt-6 w-full max-w-xl space-y-4 rounded-sm border p-4"
      data-testid="forgot-password-form-container"
    >
      <h1 className="heading-md my-0 mb-2 uppercase text-primary">Forgot your password?</h1>
      <p className="text-md">
        Enter the email you used to sign up and we&#39;ll send you a password reset email. email.
      </p>
      <form
        onSubmit={handleSubmit(submit)}
        data-testid="forgot-password-form"
      >
        <div className="space-y-4">
          <LabeledInput
            label="E-mail"
            placeholder="Your e-mail address"
            error={errors.email as FieldError}
            data-testid="forgot-password-email-input"
            {...register('email')}
          />
        </div>

        <div className="mt-8 space-y-4">
          <Button
            className="w-full uppercase"
            disabled={isSubmitting}
            data-testid="forgot-password-submit-button"
          >
            Reset Password
          </Button>

          <Link
            href="/user"
            className="flex"
            data-testid="forgot-password-back-to-login-link"
          >
            <Button
              variant="tonal"
              className="flex w-full justify-center uppercase"
            >
              Back to log in
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
};
