import { ExclamationCircle, MagnifyingGlass, PlusMini } from "@medusajs/icons"
import { Button, Text, clx } from "@medusajs/ui"
import React from "react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"

export type NoResultsProps = {
  title?: string
  message?: string
  className?: string
  icon?: React.ReactNode
}

export const NoResults = ({
  title,
  message,
  className,
  icon = <MagnifyingGlass />,
}: NoResultsProps) => {
  const { t } = useTranslation()

  return (
    <div
      className={clx(
        "flex h-[400px] w-full items-center justify-center",
        className
      )}
    >
      <div className="flex flex-col items-center gap-y-2">
        {icon}
        <Text size="small" leading="compact" weight="plus">
          {title ?? t("general.noResultsTitle")}
        </Text>
        <Text size="small" className="text-ui-fg-subtle">
          {message ?? t("general.noResultsMessage")}
        </Text>
      </div>
    </div>
  )
}

type ActionProps = {
  action?: {
    to: string
    label: string
  }
  dataTestId?: string
}

export type NoRecordsProps = {
  title?: string
  message?: string
  className?: string
  buttonVariant?: string
  icon?: React.ReactNode
} & ActionProps

const DefaultButton = ({ action, dataTestId }: ActionProps) =>
  action && (
    <Link to={action.to}>
      <Button variant="secondary" size="small" data-testid={dataTestId}>
        {action.label}
      </Button>
    </Link>
  )

const TransparentIconLeftButton = ({ action, dataTestId }: ActionProps) =>
  action && (
    <Link to={action.to}>
      <Button
        variant="transparent"
        className="text-ui-fg-interactive"
        data-testid={dataTestId}
      >
        <PlusMini /> {action.label}
      </Button>
    </Link>
  )

export const NoRecords = ({
  title,
  message,
  action,
  className,
  buttonVariant = "default",
  dataTestId,
  icon = <ExclamationCircle className="text-ui-fg-subtle" />,
}: NoRecordsProps) => {
  const { t } = useTranslation()

  return (
    <div
      className={clx(
        "flex h-[150px] w-full flex-col items-center justify-center gap-y-4",
        className
      )}
    >
      <div className="flex flex-col items-center gap-y-3">
        {icon}

        <div className="flex flex-col items-center gap-y-1">
          <Text size="small" leading="compact" weight="plus">
            {title ?? t("general.noRecordsTitle")}
          </Text>

          <Text
            size="small"
            className="text-ui-fg-muted whitespace-pre-line text-center"
          >
            {message ?? t("general.noRecordsMessage")}
          </Text>
        </div>
      </div>

      {buttonVariant === "default" && (
        <DefaultButton action={action} dataTestId={dataTestId} />
      )}
      {buttonVariant === "transparentIconLeft" && (
        <TransparentIconLeftButton action={action} dataTestId={dataTestId} />
      )}
    </div>
  )
}
