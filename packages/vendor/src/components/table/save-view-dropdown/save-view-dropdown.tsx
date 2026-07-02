import React from "react"
import { useTranslation } from "react-i18next"
import {
  DropdownMenu,
  Button,
  usePrompt,
} from "@medusajs/ui"
import {
  CloudArrowUp,
  SquarePlusMicro,
} from "@medusajs/icons"

interface SaveViewDropdownProps {
  isDefaultView: boolean
  currentViewId?: string | null
  currentViewName?: string | null
  onSaveAsDefault?: () => void
  onUpdateExisting?: () => void
  onSaveAsNew?: () => void
}

export const SaveViewDropdown: React.FC<SaveViewDropdownProps> = ({
  isDefaultView,
  currentViewId,
  currentViewName,
  onSaveAsDefault,
  onUpdateExisting,
  onSaveAsNew,
}) => {
  const { t } = useTranslation()
  const prompt = usePrompt()

  const handleSaveAsDefault = async () => {
    const result = await prompt({
      title: t("views.prompts.saveAsDefault.title"),
      description: t("views.prompts.saveAsDefault.description"),
      confirmText: t("views.prompts.saveAsDefault.confirmText"),
      cancelText: t("views.prompts.saveAsDefault.cancelText"),
    })

    if (result && onSaveAsDefault) {
      onSaveAsDefault()
    }
  }

  const handleUpdateExisting = async () => {
    const result = await prompt({
      title: t("views.prompts.updateExisting.title"),
      description: t("views.prompts.updateExisting.description", {
        name: currentViewName,
      }),
      confirmText: t("views.prompts.updateExisting.confirmText"),
      cancelText: t("views.prompts.updateExisting.cancelText"),
    })

    if (result && onUpdateExisting) {
      onUpdateExisting()
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenu.Trigger asChild>
        <Button variant="secondary" size="small">
          {t("views.save")}
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content>
        {isDefaultView && onSaveAsDefault && (
          <DropdownMenu.Item onClick={handleSaveAsDefault}>
            <CloudArrowUp className="h-4 w-4" />
            {t("views.saveAsSystemDefault")}
          </DropdownMenu.Item>
        )}
        {!isDefaultView && currentViewId && onUpdateExisting && (
          <DropdownMenu.Item onClick={handleUpdateExisting}>
            <CloudArrowUp className="h-4 w-4" />
            {t("views.updateNamed", { name: currentViewName })}
          </DropdownMenu.Item>
        )}
        {onSaveAsNew && (
          <DropdownMenu.Item onClick={onSaveAsNew}>
            <SquarePlusMicro className="h-4 w-4" />
            {t("views.saveAsNew")}
          </DropdownMenu.Item>
        )}
      </DropdownMenu.Content>
    </DropdownMenu>
  )
}
