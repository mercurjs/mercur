import { zodResolver } from "@hookform/resolvers/zod"
import { AdminStore } from "@medusajs/types"
import { Container, Heading, Text, toast } from "@medusajs/ui"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { z } from "zod"

import { Form } from "../../../../../components/common/form"
import { SwitchBox } from "../../../../../components/common/switch-box"
import { useUpdateStore } from "../../../../../hooks/api/store"

const ApprovalSchema = z.object({
  require_product_approval: z.boolean(),
})

type MarketplaceApprovalSectionProps = {
  store: AdminStore
}

export const MarketplaceApprovalSection = ({
  store,
}: MarketplaceApprovalSectionProps) => {
  const { t } = useTranslation()
  const { mutateAsync } = useUpdateStore(store.id)

  const current = store.metadata?.require_product_approval
  const requireApproval = typeof current === "boolean" ? current : true

  const form = useForm<z.infer<typeof ApprovalSchema>>({
    defaultValues: { require_product_approval: requireApproval },
    resolver: zodResolver(ApprovalSchema),
  })

  const handleToggle = async (checked: boolean) => {
    await mutateAsync(
      {
        metadata: { ...(store.metadata ?? {}), require_product_approval: checked },
      },
      {
        onSuccess: () => toast.success(t("marketplace.productApproval.successToast")),
        onError: (error) => {
          form.setValue("require_product_approval", !checked)
          toast.error(error.message)
        },
      }
    )
  }

  return (
    <Container className="divide-y p-0" data-testid="marketplace-approval-section">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading>{t("marketplace.productApproval.title")}</Heading>
          <Text className="text-ui-fg-subtle" size="small">
            {t("marketplace.productApproval.subtitle")}
          </Text>
        </div>
      </div>
      <div className="px-6 py-4">
        <Form {...form}>
          <SwitchBox
            control={form.control}
            name="require_product_approval"
            label={t("marketplace.productApproval.label")}
            description={t("marketplace.productApproval.description")}
            onCheckedChange={handleToggle}
          />
        </Form>
      </div>
    </Container>
  )
}
