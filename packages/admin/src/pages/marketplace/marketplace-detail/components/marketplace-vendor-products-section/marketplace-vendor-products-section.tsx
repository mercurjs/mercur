import { zodResolver } from "@hookform/resolvers/zod"
import { AdminStore } from "@medusajs/types"
import { Container, Heading, Text, toast } from "@medusajs/ui"
import { useForm, useWatch } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { z } from "zod"

import { Form } from "../../../../../components/common/form"
import { SwitchBox } from "../../../../../components/common/switch-box"
import { useUpdateStore } from "../../../../../hooks/api/store"

const VendorProductsSchema = z.object({
  allow_vendor_product_creation: z.boolean(),
  require_product_approval: z.boolean(),
})

type SettingKey = keyof z.infer<typeof VendorProductsSchema>

type MarketplaceVendorProductsSectionProps = {
  store: AdminStore
}

export const MarketplaceVendorProductsSection = ({
  store,
}: MarketplaceVendorProductsSectionProps) => {
  const { t } = useTranslation()
  const { mutateAsync } = useUpdateStore(store.id)

  const allowCreationValue = store.metadata?.allow_vendor_product_creation
  const allowCreationDefault =
    typeof allowCreationValue === "boolean" ? allowCreationValue : true

  const approvalValue = store.metadata?.require_product_approval
  const requireApprovalDefault =
    typeof approvalValue === "boolean" ? approvalValue : true

  const form = useForm<z.infer<typeof VendorProductsSchema>>({
    defaultValues: {
      allow_vendor_product_creation: allowCreationDefault,
      require_product_approval: requireApprovalDefault,
    },
    resolver: zodResolver(VendorProductsSchema),
  })

  const allowCreation = useWatch({
    control: form.control,
    name: "allow_vendor_product_creation",
    defaultValue: allowCreationDefault,
  })

  const persist = (key: SettingKey, checked: boolean, successToastKey: string) => {
    void mutateAsync(
      {
        metadata: { ...(store.metadata ?? {}), [key]: checked },
      },
      {
        onSuccess: () => toast.success(t(successToastKey)),
        onError: (error) => {
          form.setValue(key, !checked)
          toast.error(error.message)
        },
      }
    ).catch(() => {
      // `mutateAsync` rejects even when `onError` runs; swallow to avoid an
      // unhandled rejection from UI event callbacks.
    })
  }

  return (
    <Container
      className="divide-y p-0"
      data-testid="marketplace-vendor-products-section"
    >
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading>{t("marketplace.vendorProducts.title")}</Heading>
          <Text className="text-ui-fg-subtle" size="small">
            {t("marketplace.vendorProducts.subtitle")}
          </Text>
        </div>
      </div>
      <Form {...form}>
        <div className="px-6 py-4">
          <SwitchBox
            control={form.control}
            name="allow_vendor_product_creation"
            label={t("marketplace.vendorProducts.allowCreation.label")}
            description={t(
              "marketplace.vendorProducts.allowCreation.description"
            )}
            onCheckedChange={(checked) => {
              persist(
                "allow_vendor_product_creation",
                checked,
                "marketplace.vendorProducts.allowCreation.successToast"
              )
            }}
          />
        </div>
        {allowCreation && (
          <div className="px-6 py-4">
            <SwitchBox
              control={form.control}
              name="require_product_approval"
              label={t("marketplace.productApproval.label")}
              description={t("marketplace.productApproval.description")}
              onCheckedChange={(checked) => {
                persist(
                  "require_product_approval",
                  checked,
                  "marketplace.productApproval.successToast"
                )
              }}
            />
          </div>
        )}
      </Form>
    </Container>
  )
}