import { Button } from "@medusajs/ui"
import { useTranslation } from "react-i18next"

import { RouteFocusModal } from "@components/modals"

import {
  ProductCreateTab,
  useProductCreateContext,
} from "./product-create-context"

export const SAVE_DRAFT_BUTTON = "save-draft-button"

export function Footer() {
  const { t } = useTranslation()
  const { tab, onNext, isPending, showInventoryTab } =
    useProductCreateContext()

  return (
    <RouteFocusModal.Footer data-testid="product-create-form-footer">
      <div
        className="flex items-center justify-end gap-x-2"
        data-testid="product-create-form-footer-actions"
      >
        <RouteFocusModal.Close asChild>
          <Button
            variant="secondary"
            size="small"
            data-testid="product-create-form-cancel-button"
          >
            {t("actions.cancel")}
          </Button>
        </RouteFocusModal.Close>
        <Button
          data-name={SAVE_DRAFT_BUTTON}
          size="small"
          type="submit"
          isLoading={isPending}
          className="whitespace-nowrap"
          data-testid="product-create-form-save-draft-button"
        >
          {t("actions.saveAsDraft")}
        </Button>
        <PrimaryButton
          tab={tab}
          next={onNext}
          isLoading={isPending}
          showInventoryTab={showInventoryTab}
        />
      </div>
    </RouteFocusModal.Footer>
  )
}

type PrimaryButtonProps = {
  tab: ProductCreateTab
  next: (tab: ProductCreateTab) => Promise<void>
  isLoading?: boolean
  showInventoryTab: boolean
}

const PrimaryButton = ({
  tab,
  next,
  isLoading,
  showInventoryTab,
}: PrimaryButtonProps) => {
  const { t } = useTranslation()

  if (
    (tab === ProductCreateTab.VARIANTS && !showInventoryTab) ||
    (tab === ProductCreateTab.INVENTORY && showInventoryTab)
  ) {
    return (
      <Button
        data-name="publish-button"
        key="submit-button"
        type="submit"
        variant="primary"
        size="small"
        isLoading={isLoading}
        data-testid="product-create-form-publish-button"
      >
        {t("actions.publish")}
      </Button>
    )
  }

  return (
    <Button
      key="next-button"
      type="button"
      variant="primary"
      size="small"
      onClick={() => next(tab)}
      data-testid="product-create-form-continue-button"
    >
      {t("actions.continue")}
    </Button>
  )
}
