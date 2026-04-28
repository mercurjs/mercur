import { zodResolver } from "@hookform/resolvers/zod"
import { ProductDTO, HttpTypes } from "@mercurjs/types"
import { Button, toast } from "@medusajs/ui"
import { useRef } from "react"
import { DefaultValues, useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { DataGrid } from "../../../../../components/data-grid"
import {
  RouteFocusModal,
  useRouteModal,
} from "../../../../../components/modals"
import { KeyboundForm } from "../../../../../components/utilities/keybound-form"
import { useBatchUpdateProducts } from "../../../../../hooks/api/products"
import { useProductBulkEditColumns } from "../../hooks/use-product-bulk-edit-columns"
import { ProductBulkEditSchema } from "../../schema"

type ProductBulkEditFormProps = {
  products: ProductDTO[]
}

export const ProductBulkEditForm = ({ products }: ProductBulkEditFormProps) => {
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
    const initialById = new Map(
      (initialValues.current.products ?? []).map((p) => [p?.id, p] as const)
    )

    const changed = data.products
      .filter((p) => {
        const prev = initialById.get(p.id)
        return (
          !prev ||
          prev.status !== p.status ||
          prev.discountable !== p.discountable
        )
      })
      .map((p) => ({
        id: p.id,
        status: p.status as HttpTypes.AdminProductStatus,
        discountable: p.discountable,
      }))

    if (!changed.length) {
      handleSuccess()
      return
    }

    await mutateAsync(
      { products: changed },
      {
        onSuccess: () => {
          toast.success(
            t("products.bulkEdit.successToast", { count: changed.length })
          )
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
      <KeyboundForm onSubmit={onSubmit} className="flex size-full flex-col">
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
              <Button variant="secondary" size="small" type="button">
                {t("actions.cancel")}
              </Button>
            </RouteFocusModal.Close>
            <Button type="submit" size="small" isLoading={isPending}>
              {t("actions.save")}
            </Button>
          </div>
        </RouteFocusModal.Footer>
      </KeyboundForm>
    </RouteFocusModal.Form>
  )
}

function getDefaultValues(
  products: ProductDTO[]
): DefaultValues<ProductBulkEditSchema> {
  return {
    products: products.map((p) => ({
      id: p.id,
      status: p.status,
      discountable: p.discountable,
    })),
  }
}
