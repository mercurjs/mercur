import { XMarkMini } from "@medusajs/icons"
import { IconButton, Text } from "@medusajs/ui"
import { useCan } from "@mercurjs/dashboard-shared"
import { useProduct } from "../../../../../hooks/api"

type TargetItemProps = {
  index: number
  onRemove: (index: number) => void
  label: string
  value: string
}

export const TargetItem = ({
  index,
  label,
  onRemove,
  value,
}: TargetItemProps) => {
  const canViewProducts = useCan("products")
  const { product } = useProduct(
    value,
    { fields: "id,title" },
    { enabled: !label && canViewProducts }
  )

  return (
    <div className="bg-ui-bg-field-component shadow-borders-base flex items-center justify-between gap-2 rounded-md px-2 py-0.5">
      <Text size="small" leading="compact">
        {label || product?.title || value}
      </Text>
      <IconButton
        size="small"
        variant="transparent"
        type="button"
        onClick={() => onRemove(index)}
      >
        <XMarkMini />
      </IconButton>
    </div>
  )
}
