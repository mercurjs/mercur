import React from "react";

import { ExclamationCircle, MagnifyingGlass, PlusMini } from "@medusajs/icons";
import { Button, Text, clx } from "@medusajs/ui";

import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

export type NoResultsProps = {
  title?: string;
  message?: string;
  className?: string;
};

export const NoResults = ({ title, message, className }: NoResultsProps) => {
  const { t } = useTranslation();

  return (
    <div
      className={clx(
        "flex h-[400px] w-full items-center justify-center",
        className,
      )}
    >
      <div className="flex flex-col items-center gap-y-2">
        <MagnifyingGlass />
        <Text size="small" leading="compact" weight="plus">
          {title ?? t("general.noResultsTitle")}
        </Text>
        <Text size="small" className="text-ui-fg-subtle">
          {message ?? t("general.noResultsMessage")}
        </Text>
      </div>
    </div>
  );
};

type ActionProps = {
  action?: {
    to: string;
    label: string;
  };
  dataTestId?: string;
};

type NoRecordsProps = {
  title?: string;
  message?: string;
  className?: string;
  buttonVariant?: string;
  icon?: React.ReactNode;
  "data-testid"?: string;
} & ActionProps;

const DefaultButton = ({
  action,
  "data-testid": dataTestId,
}: ActionProps & { "data-testid"?: string }) =>
  action && (
    <Link
      to={action.to}
      data-testid={dataTestId ? `${dataTestId}-action-button` : undefined}
    >
      <Button
        variant="secondary"
        size="small"
        data-testid={
          dataTestId ? `${dataTestId}-action-button-inner` : undefined
        }
      >
        {action.label}
      </Button>
    </Link>
  );

const TransparentIconLeftButton = ({
  action,
  "data-testid": dataTestId,
}: ActionProps & { "data-testid"?: string }) =>
  action && (
    <Link
      to={action.to}
      data-testid={dataTestId ? `${dataTestId}-action-button` : undefined}
    >
      <Button
        variant="transparent"
        className="text-ui-fg-interactive"
        data-testid={
          dataTestId ? `${dataTestId}-action-button-inner` : undefined
        }
      >
        <PlusMini /> {action.label}
      </Button>
    </Link>
  );

export const NoRecords = ({
  title,
  message,
  action,
  className,
  buttonVariant = "default",
  icon = <ExclamationCircle className="text-ui-fg-subtle" />,
  "data-testid": dataTestId,
}: NoRecordsProps) => {
  const { t } = useTranslation();

  return (
    <div
      className={clx(
        "flex h-[150px] w-full flex-col items-center justify-center gap-y-4",
        className,
      )}
      data-testid={dataTestId}
    >
      <div
        className="flex flex-col items-center gap-y-3"
        data-testid={dataTestId ? `${dataTestId}-content` : undefined}
      >
        <div data-testid={dataTestId ? `${dataTestId}-icon` : undefined}>
          {icon}
        </div>

        <div
          className="flex flex-col items-center gap-y-1"
          data-testid={dataTestId ? `${dataTestId}-text` : undefined}
        >
          <Text
            size="small"
            leading="compact"
            weight="plus"
            data-testid={dataTestId ? `${dataTestId}-title` : undefined}
          >
            {title ?? t("general.noRecordsTitle")}
          </Text>

          <Text
            size="small"
            className="text-ui-fg-muted"
            data-testid={dataTestId ? `${dataTestId}-message` : undefined}
          >
            {message ?? t("general.noRecordsMessage")}
          </Text>
        </div>
      </div>

      {buttonVariant === "default" && (
        <DefaultButton action={action} data-testid={dataTestId} />
      )}
      {buttonVariant === "transparentIconLeft" && (
        <TransparentIconLeftButton action={action} data-testid={dataTestId} />
      )}
    </div>
  );
};
