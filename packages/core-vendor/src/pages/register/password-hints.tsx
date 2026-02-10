'use client';

import { useEffect, useState, type FC } from 'react';

import { CheckCircle } from '@medusajs/icons';
import { Container } from '@medusajs/ui';
import { clsx } from 'clsx';
import { useTranslation } from 'react-i18next';

function validatePassword(password: string) {
  const errors = {
    tooShort: password.length < 12,
    noLower: !/[a-z]/.test(password),
    noUpper: !/[A-Z]/.test(password),
    noDigit: !/[0-9]/.test(password),
    noSpecialChar: !/[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/~`]/.test(password)
  };

  return {
    isValid: !Object.values(errors).some(Boolean),
    errors
  };
}

const rules = {
  isValid: false,
  hasError: false,
  lower: false,
  upper: false,
  '12chars': false,
  digit: false,
  specialChar: false
};

const PasswordRule: FC<{ hasError: boolean; ruleName: keyof typeof rules }> = ({
  ruleName,
  hasError
}) => {
  const { t } = useTranslation();
  if (ruleName === 'hasError' || ruleName === 'isValid') return;

  const rulesText: Record<Exclude<keyof typeof rules, 'hasError' | 'isValid'>, string> = {
    lower: t('validation.rules.lower'),
    upper: t('validation.rules.upper'),
    '12chars': t('validation.rules.12chars'),
    digit: t('validation.rules.digit'),
    specialChar: t('validation.rules.specialChar')
  };

  return (
    <p
      className={clsx(
        'flex items-center gap-2 text-xs',
        hasError ? 'text-red-700' : 'text-green-700'
      )}
    >
      <CheckCircle /> {rulesText[ruleName]}
    </p>
  );
};

export const PasswordValidator = ({
  password,
  setError
}: {
  password: string;
  setError: (error: any) => void;
}) => {
  const [newPasswordError, setNewPasswordError] = useState(rules);
  useEffect(() => {
    const validation = validatePassword(password);

    const nextState = {
      isValid: validation.isValid,
      hasError: !validation.isValid,
      lower: validation.errors.noLower,
      upper: validation.errors.noUpper,
      '12chars': validation.errors.tooShort,
      digit: validation.errors.noDigit,
      specialChar: validation.errors.noSpecialChar
    };

    setError(nextState);
    setNewPasswordError(nextState);
  }, [password]);

  return (
    <Container className="flex flex-col gap-y-1 p-2">
      {(Object.keys(newPasswordError) as (keyof typeof rules)[]).map(k => (
        <PasswordRule
          key={k}
          ruleName={k}
          hasError={newPasswordError[k]}
        />
      ))}
    </Container>
  );
};
