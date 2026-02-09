import { MouseEvent } from "react";

import { XMarkMini } from "@medusajs/icons";
import { Text, clx } from "@medusajs/ui";

import { Popover as RadixPopover } from "radix-ui";
import { useTranslation } from "react-i18next";

export type FilterChipProps = {
  hadPreviousValue?: boolean;
  label: string;
  value?: string;
  readonly?: boolean;
  hasOperator?: boolean;
  onRemove: () => void;
  "data-testid"?: string;
};

const FilterChip = ({
  hadPreviousValue,
  label,
  value,
  readonly,
  hasOperator,
  onRemove,
  "data-testid": dataTestId,
}: FilterChipProps) => {
  const { t } = useTranslation();

  const handleRemove = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onRemove();
  };

  return (
    <div
      className="flex cursor-default select-none items-stretch overflow-hidden rounded-md bg-ui-bg-field text-ui-fg-subtle shadow-borders-base transition-fg"
      data-testid={dataTestId}
    >
      {!hadPreviousValue && <RadixPopover.Anchor />}
      <div
        className={clx(
          "flex items-center justify-center whitespace-nowrap px-2 py-1",
          {
            "border-r": !!(value || hadPreviousValue),
          },
        )}
        data-testid={dataTestId ? `${dataTestId}-label` : undefined}
      >
        <Text size="small" weight="plus" leading="compact">
          {label}
        </Text>
      </div>
      <div className="flex w-full items-center overflow-hidden">
        {hasOperator && !!(value || hadPreviousValue) && (
          <div
            className="border-r p-1 px-2"
            data-testid={dataTestId ? `${dataTestId}-operator` : undefined}
          >
            <Text
              size="small"
              weight="plus"
              leading="compact"
              className="text-ui-fg-muted"
            >
              {t("general.is")}
            </Text>
          </div>
        )}
        {!!(value || hadPreviousValue) && (
          <RadixPopover.Trigger
            asChild
            className={clx(
              "flex-1 cursor-pointer overflow-hidden border-r p-1 px-2",
              {
                "hover:bg-ui-bg-field-hover": !readonly,
                "data-[state=open]:bg-ui-bg-field-hover": !readonly,
              },
            )}
            data-testid={dataTestId ? `${dataTestId}-value` : undefined}
          >
            <Text
              size="small"
              leading="compact"
              weight="plus"
              className="truncate text-nowrap"
            >
              {value || "\u00A0"}
            </Text>
          </RadixPopover.Trigger>
        )}
      </div>
      {!readonly && !!(value || hadPreviousValue) && (
        <button
          onClick={handleRemove}
          className={clx(
            "flex items-center justify-center p-1 text-ui-fg-muted transition-fg",
            "hover:bg-ui-bg-subtle-hover",
            "active:bg-ui-bg-subtle-pressed active:text-ui-fg-base",
          )}
          data-testid={dataTestId ? `${dataTestId}-remove` : undefined}
        >
          <XMarkMini />
        </button>
      )}
    </div>
  );
};

export default FilterChip;
