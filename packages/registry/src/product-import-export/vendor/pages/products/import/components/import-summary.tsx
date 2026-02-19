import { Text } from "@medusajs/ui"
import { CheckCircleSolid } from "@medusajs/icons"

type ImportSummaryProps = {
  created: number
}

export const ImportSummary = ({ created }: ImportSummaryProps) => {
  return (
    <div className="flex flex-col items-center gap-y-4 py-8">
      <CheckCircleSolid className="text-ui-fg-interactive" />
      <div className="flex flex-col items-center gap-y-1">
        <Text size="large" weight="plus">
          Import Complete
        </Text>
        <Text className="text-ui-fg-subtle">
          {created} product(s) were successfully created.
        </Text>
      </div>
    </div>
  )
}
