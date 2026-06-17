import { Text } from "@medusajs/ui"
import { useTranslation } from "react-i18next"

/**
 * The "Tip" callout shown under the collection icon field (create form) and in
 * the icon edit drawer, explaining where the icon appears on the storefront.
 */
export const CollectionIconTip = () => {
  const { t } = useTranslation()

  return (
    <div
      className="bg-ui-bg-component shadow-elevation-card-rest flex items-stretch gap-x-3 rounded-lg px-3 py-2"
      data-testid="collection-icon-tip"
    >
      <div className="bg-ui-border-strong w-[3px] shrink-0 self-stretch rounded-full" />
      <Text size="small" className="text-ui-fg-subtle">
        <span className="text-ui-fg-base font-medium">
          {t("collections.icon.tip.label")}
        </span>{" "}
        {t("collections.icon.tip.text")}
      </Text>
    </div>
  )
}
