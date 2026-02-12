import { zodResolver } from "@hookform/resolvers/zod"
import { HttpTypes } from "@medusajs/types"
import { Button, Input, toast } from "@medusajs/ui"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { z } from "zod"

import { Form } from "@components/common/form"
import { RouteDrawer, useRouteModal } from "@components/modals"
import { KeyboundForm } from "@components/utilities/keybound-form"
import { useUpdateStore } from "@hooks/api/store"

type EditStoreCompanyFormProps = {
  store: HttpTypes.AdminStore
}

const EditStoreCompanySchema = z.object({
  address_line: z.string().optional(),
  postal_code: z.string().optional(),
  city: z.string().optional(),
  country_code: z.string().optional(),
  tax_id: z.string().optional(),
})

export const EditStoreCompanyForm = ({ store }: EditStoreCompanyFormProps) => {
  const { t } = useTranslation()
  const { handleSuccess } = useRouteModal()

  const storeAny = store as any

  const form = useForm<z.infer<typeof EditStoreCompanySchema>>({
    defaultValues: {
      address_line: storeAny.address_line ?? "",
      postal_code: storeAny.postal_code ?? "",
      city: storeAny.city ?? "",
      country_code: storeAny.country_code ?? "",
      tax_id: storeAny.tax_id ?? "",
    },
    resolver: zodResolver(EditStoreCompanySchema),
  })

  const { mutateAsync, isPending } = useUpdateStore(store.id)

  const handleSubmit = form.handleSubmit(async (values) => {
    await mutateAsync(values as any, {
      onSuccess: () => {
        toast.success(t("store.toast.update", "Store successfully updated"))
        handleSuccess()
      },
      onError: (error) => {
        toast.error(error.message)
      },
    })
  })

  return (
    <RouteDrawer.Form form={form}>
      <KeyboundForm onSubmit={handleSubmit} className="flex h-full flex-col overflow-hidden">
        <RouteDrawer.Body className="overflow-y-auto">
          <div className="flex flex-col gap-y-8">
            <Form.Field
              control={form.control}
              name="address_line"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label>{t("fields.address")}</Form.Label>
                  <Form.Control>
                    <Input {...field} />
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            />
            <Form.Field
              control={form.control}
              name="postal_code"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label>{t("fields.postalCode", "Postal code")}</Form.Label>
                  <Form.Control>
                    <Input {...field} />
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            />
            <Form.Field
              control={form.control}
              name="city"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label>{t("fields.city")}</Form.Label>
                  <Form.Control>
                    <Input {...field} />
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            />
            <Form.Field
              control={form.control}
              name="country_code"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label>{t("fields.country")}</Form.Label>
                  <Form.Control>
                    <Input {...field} />
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            />
            <Form.Field
              control={form.control}
              name="tax_id"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label>{t("fields.taxId", "Tax ID")}</Form.Label>
                  <Form.Control>
                    <Input {...field} />
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            />
          </div>
        </RouteDrawer.Body>
        <RouteDrawer.Footer>
          <div className="flex items-center justify-end gap-x-2">
            <RouteDrawer.Close asChild>
              <Button size="small" variant="secondary">
                {t("actions.cancel")}
              </Button>
            </RouteDrawer.Close>
            <Button size="small" isLoading={isPending} type="submit">
              {t("actions.save")}
            </Button>
          </div>
        </RouteDrawer.Footer>
      </KeyboundForm>
    </RouteDrawer.Form>
  )
}
