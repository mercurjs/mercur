import { zodResolver } from "@hookform/resolvers/zod"
import { Button, toast } from "@medusajs/ui"
import { useRef } from "react"
import { DefaultValues, useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { DataGrid } from "@components/data-grid"
import {
  RouteFocusModal,
  useRouteModal,
} from "@components/modals"
import { KeyboundForm } from "@components/utilities/keybound-form"
import {
  BatchUpdateProductItem,
  useBatchUpdateProducts,
} from "@hooks/api/products"
import { ExtendedAdminProduct } from "../../../types"
import { useProductBulkEditColumns } from "../../hooks/use-product-bulk-edit-columns"
import {
  ProductBulkEditItemSchema,
  ProductBulkEditSchema,
} from "../../schema"

type ProductBulkEditFormProps = {
  products: ExtendedAdminProduct[]
}

export const ProductBulkEditForm = ({
  products,
}: ProductBulkEditFormProps) => {
  const { t } = useTranslation()
  const { setCloseOnEscape, handleSuccess } = useRouteModal()

  const initialValues = useRef(getDefaultValues(products))

  const form = useForm<ProductBulkEditSchema>({
    defaultValues: getDefaultValues(products),
    resolver: zodResolver(ProductBulkEditSchema),
  })

  const columns = useProductBulkEditColumns()

  const { mutateAsync, isPending } = useBatchUpdateProducts()

  const onSubmit = form.handleSubmit(async (data) => {
    const updates: BatchUpdateProductItem[] = []

    for (const [productId, item] of Object.entries(
      data.products
    )) {
      const original =
        initialValues.current?.products?.[productId]

      if (!original) continue

      const changes: BatchUpdateProductItem = { id: productId }
      let hasChanges = false

      if (item.title !== original.title) {
        changes.title = item.title
        hasChanges = true
      }

      if (item.status !== original.status) {
        changes.status = item.status
        hasChanges = true
      }

      if (item.discountable !== original.discountable) {
        changes.discountable = item.discountable
        hasChanges = true
      }

      if (hasChanges) {
        updates.push(changes)
      }
    }

    if (updates.length === 0) {
      toast.info(t("products.bulkEdit.noChanges"))
      return
    }

    await mutateAsync(
      { update: updates },
      {
        onSuccess: () => {
          toast.success(t("products.bulkEdit.success"))
          handleSuccess()
        },
        onError: (error) => {
          toast.error(error.message)
        },
      }
    )
  })

  return (
    <RouteFocusModal.Form form={form}>
      <KeyboundForm
        onSubmit={onSubmit}
        className="flex size-full flex-col"
      >
        <RouteFocusModal.Header />
        <RouteFocusModal.Body className="size-full flex-1 overflow-y-auto">
          <DataGrid
            columns={columns}
            data={products}
            state={form}
            onEditingChange={(editing) => {
              setCloseOnEscape(!editing)
            }}
          />
        </RouteFocusModal.Body>
        <RouteFocusModal.Footer>
          <div className="flex items-center justify-end gap-2">
            <RouteFocusModal.Close asChild>
              <Button
                variant="secondary"
                size="small"
                type="button"
              >
                {t("actions.cancel")}
              </Button>
            </RouteFocusModal.Close>
            <Button
              type="submit"
              size="small"
              isLoading={isPending}
            >
              {t("actions.save")}
            </Button>
          </div>
        </RouteFocusModal.Footer>
      </KeyboundForm>
    </RouteFocusModal.Form>
  )
}

function getDefaultValues(
  products: ExtendedAdminProduct[]
): DefaultValues<ProductBulkEditSchema> {
  return {
    products: products.reduce(
      (acc, product) => {
        acc[product.id] = {
          title: product.title || "",
          status: product.status as "draft" | "published",
          discountable: product.discountable ?? true,
        }
        return acc
      },
      {} as Record<string, ProductBulkEditItemSchema>
    ),
  }
}
