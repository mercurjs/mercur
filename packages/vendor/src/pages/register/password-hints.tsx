import { useEffect, useMemo, type FC } from 'react';

import { CheckCircleMiniSolid } from '@medusajs/icons';
import { Container } from '@medusajs/ui';
import { useTranslation } from 'react-i18next';

function validatePassword(password: string) {
  const errors = {
    tooShort: password.length < 12,
    noLower: !/[a-z]/.test(password),
    noUpper: !/[A-Z]/.test(password),
    noDigit: !/[0-9]/.test(password),
    noSpecialChar: !/[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/~`]/.test(password),
  };

  return {
    isValid: !Object.values(errors).some(Boolean),
    errors,
  };
}

type ValidationState = {
  isValid: boolean;
  lower: boolean;
  upper: boolean;
  '12chars': boolean;
  digit: boolean;
  specialChar: boolean;
};

const ruleKeys = ['12chars', 'lower', 'upper', 'digit', 'specialChar'] as const;
type RuleKey = (typeof ruleKeys)[number];

const PasswordRule: FC<{ passed: boolean; label: string }> = ({
  passed,
  label,
}) => {
  return (
    <p
      className={`flex items-center gap-2 text-xs ${passed ? 'text-ui-fg-subtle' : 'text-ui-fg-muted'}`}
    >
      <CheckCircleMiniSolid
        className={passed ? 'text-ui-tag-green-icon' : 'text-ui-fg-disabled'}
      />
      {label}
    </p>
  );
};

export const PasswordValidator = ({
  password,
  setError,
}: {
  password: string;
  setError: (error: ValidationState) => void;
}) => {
  const { t } = useTranslation();

  const validation = useMemo(() => validatePassword(password), [password]);

  const state: ValidationState = useMemo(
    () => ({
      isValid: validation.isValid,
      lower: !validation.errors.noLower,
      upper: !validation.errors.noUpper,
      '12chars': !validation.errors.tooShort,
      digit: !validation.errors.noDigit,
      specialChar: !validation.errors.noSpecialChar,
    }),
    [validation]
  );

  useEffect(() => {
    setError(state);
  }, [state, setError]);

  const ruleLabels: Record<RuleKey, string> = {
    '12chars': t('validation.rules.12chars'),
    lower: t('validation.rules.lower'),
    upper: t('validation.rules.upper'),
    digit: t('validation.rules.digit'),
    specialChar: t('validation.rules.specialChar'),
  };

  return (
    <Container className="flex flex-col gap-y-1 p-2">
      {ruleKeys.map((key) => (
        <PasswordRule key={key} passed={state[key]} label={ruleLabels[key]} />
      ))}
    </Container>
  );
};
