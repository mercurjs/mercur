import { Text } from "@medusajs/ui"
import { useTranslation } from "react-i18next"

/**
 * The "Tip" callout shown under the category icon field (create wizard) and in
 * the icon edit drawer, explaining where the icon appears on the storefront.
 */
export const CategoryIconTip = () => {
  const { t } = useTranslation()

  return (
    <div
      className="bg-ui-bg-component shadow-elevation-card-rest rounded-lg px-3 py-2"
      data-testid="category-icon-tip"
    >
      <div className="flex items-center gap-x-2">
        <div className="bg-ui-border-strong h-4 w-0.5 shrink-0 rounded-full" />
        <Text size="small" className="text-ui-fg-subtle">
          <span className="text-ui-fg-base font-medium">
            {t("categories.icon.tip.label")}
          </span>{" "}
          {t("categories.icon.tip.text")}
        </Text>
      </div>
    </div>
  )
}
