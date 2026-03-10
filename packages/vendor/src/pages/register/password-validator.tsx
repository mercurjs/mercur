import { useCallback, useEffect, useState } from "react"

import { CheckCircle } from "@medusajs/icons"
import { Container, Text } from "@medusajs/ui"
import { useTranslation } from "react-i18next"

export interface PasswordValidationState {
  isValid: boolean
  lower: boolean
  upper: boolean
  "12chars": boolean
  digit: boolean
  specialChar: boolean
}

export const INITIAL_VALIDATION_STATE: PasswordValidationState = {
  isValid: false,
  lower: false,
  upper: false,
  "12chars": false,
  digit: false,
  specialChar: false,
}

function validatePassword(password: string) {
  const errors = {
    tooShort: password.length < 12,
    noLower: !/[a-z]/.test(password),
    noUpper: !/[A-Z]/.test(password),
    noDigit: !/[0-9]/.test(password),
    noSpecialChar: !/[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/~`]/.test(password),
  }

  return {
    isValid: !Object.values(errors).some(Boolean),
    errors,
  }
}

type RuleKey = Exclude<keyof PasswordValidationState, "isValid">

const RULE_KEYS: RuleKey[] = ["12chars", "lower", "upper", "digit", "specialChar"]

const RULE_I18N_MAP: Record<RuleKey, string> = {
  lower: "validation.rules.lower",
  upper: "validation.rules.upper",
  "12chars": "validation.rules.12chars",
  digit: "validation.rules.digit",
  specialChar: "validation.rules.specialChar",
}

const PasswordRule = ({
  ruleKey,
  hasError,
}: {
  ruleKey: RuleKey
  hasError: boolean
}) => {
  const { t } = useTranslation()

  return (
    <Text
      as="p"
      size="xsmall"
      className={`flex items-center gap-2 ${hasError ? "text-ui-fg-error" : "text-ui-tag-green-text"}`}
    >
      <CheckCircle /> {t(RULE_I18N_MAP[ruleKey])}
    </Text>
  )
}

export const PasswordValidator = ({
  password,
  onValidationChange,
}: {
  password: string
  onValidationChange: (state: PasswordValidationState) => void
}) => {
  const [dirty, setDirty] = useState(false)
  const [state, setState] = useState<PasswordValidationState>(INITIAL_VALIDATION_STATE)

  const handleValidationChange = useCallback(onValidationChange, [])

  useEffect(() => {
    if (!dirty && password.length > 0) {
      setDirty(true)
    }

    const validation = validatePassword(password)

    const nextState: PasswordValidationState = {
      isValid: validation.isValid,
      lower: validation.errors.noLower,
      upper: validation.errors.noUpper,
      "12chars": validation.errors.tooShort,
      digit: validation.errors.noDigit,
      specialChar: validation.errors.noSpecialChar,
    }

    handleValidationChange(nextState)
    setState(nextState)
  }, [password, handleValidationChange])

  if (!dirty) {
    return null
  }

  return (
    <Container className="flex flex-col gap-y-1 p-2">
      {RULE_KEYS.map((key) => (
        <PasswordRule key={key} ruleKey={key} hasError={state[key]} />
      ))}
    </Container>
  )
}
