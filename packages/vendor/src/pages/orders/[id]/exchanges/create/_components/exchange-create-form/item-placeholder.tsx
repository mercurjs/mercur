import { Tag } from "@medusajs/icons"
import { clx, Hint, Text } from "@medusajs/ui"
import { useTranslation } from "react-i18next"

type ItemPlaceholderProps = {
  description: string
  error?: string
  "data-testid"?: string
}

export const ItemPlaceholder = ({
  description,
  error,
  "data-testid": testId,
}: ItemPlaceholderProps) => {
  const { t } = useTranslation()

  return (
    <div>
      <div
        className={clx(
          "bg-ui-bg-field mt-4 flex w-full flex-col items-center justify-center gap-y-3 rounded-lg border px-6 py-8",
          { "border-ui-border-error": !!error }
        )}
        data-testid={testId}
      >
        <Tag className="text-ui-fg-subtle" />
        <div className="flex flex-col items-center gap-y-1">
          <Text size="small" leading="compact" weight="plus">
            {t("orders.returns.emptyState.title")}
          </Text>
          <Text size="small" className="text-ui-fg-subtle text-center">
            {description}
          </Text>
        </div>
      </div>
      {error && (
        <Hint
          variant="error"
          className="mt-2"
          data-testid={testId ? `${testId}-error` : undefined}
        >
          {error}
        </Hint>
      )}
    </div>
  )
}
