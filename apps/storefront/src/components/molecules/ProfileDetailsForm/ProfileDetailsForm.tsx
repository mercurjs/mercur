'use client';

import { FC, useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { HttpTypes } from '@medusajs/types';
import { FieldError, FieldValues, FormProvider, useForm, useFormContext } from 'react-hook-form';

import { Button } from '@/components/atoms';
import { LabeledInput } from '@/components/cells';
import { updateCustomer } from '@/lib/data/customer';

import { ProfileDetailsFormData, profileDetailsSchema } from './schema';

interface Props {
  defaultValues?: ProfileDetailsFormData;
  handleClose?: () => void;
}

export const ProfileDetailsForm: FC<Props> = ({ defaultValues, ...props }) => {
  const methods = useForm<ProfileDetailsFormData>({
    resolver: zodResolver(profileDetailsSchema),
    defaultValues: defaultValues || {
      firstName: '',
      lastName: '',
      phone: '',
      email: ''
    }
  });

  return (
    <FormProvider {...methods}>
      <Form {...props} />
    </FormProvider>
  );
};

const Form: React.FC<Props> = ({ handleClose }) => {
  const [error, setError] = useState<string>();
  const {
    handleSubmit,
    register,
    formState: { errors }
  } = useFormContext();

  const submit = async (data: FieldValues) => {
    const body = {
      first_name: data.firstName,
      last_name: data.lastName,
      phone: data.phone
    };
    try {
      await updateCustomer(body as HttpTypes.StoreUpdateCustomer);
    } catch (err) {
      setError((err as Error).message);
      return;
    }

    setError('');
    handleClose && handleClose();
  };

  return (
    <form onSubmit={handleSubmit(submit)} data-testid="profile-details-form">
      <div className="space-y-4 px-4">
        <div className="items-top mb-4 grid max-w-full grid-cols-2 gap-4">
          <LabeledInput
            label="First name"
            placeholder="Type first name"
            error={errors.firstName as FieldError}
            data-testid="profile-details-form-first-name-input"
            {...register('firstName')}
          />
          <LabeledInput
            label="Last name"
            placeholder="Type last name"
            error={errors.lastName as FieldError}
            data-testid="profile-details-form-last-name-input"
            {...register('lastName')}
          />
          <LabeledInput
            label="Phone"
            placeholder="Type phone number"
            error={errors.phone as FieldError}
            data-testid="profile-details-form-phone-input"
            {...register('phone')}
          />
          <LabeledInput
            label="Email"
            disabled
            data-testid="profile-details-form-email-input"
            {...register('email')}
          />
        </div>
        {error && <p className="label-md text-negative" data-testid="profile-details-form-error">{error}</p>}
        <Button className="w-full" data-testid="profile-details-form-submit-button">Save</Button>
      </div>
    </form>
  );
};
