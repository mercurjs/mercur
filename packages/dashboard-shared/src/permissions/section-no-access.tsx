import { Text } from "@medusajs/ui"
import { useTranslation } from "react-i18next"

/**
 * Inline state for a section whose data the actor may not read. Sections
 * render this for a 403 instead of throwing to the page's error boundary.
 */
export const SectionNoAccess = ({ className }: { className?: string }) => {
  const { t } = useTranslation()

  return (
    <div className={className ?? "px-6 py-4"} data-testid="section-no-access">
      <Text size="small" leading="compact" className="text-ui-fg-subtle">
        {t("permissions.noAccess")}
      </Text>
    </div>
  )
}
