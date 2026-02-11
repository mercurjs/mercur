import { zodResolver } from "@hookform/resolvers/zod"
import { HttpTypes } from "@medusajs/types"
import { Button, Input, toast } from "@medusajs/ui"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { z } from "zod"
import {sdk} from "@lib/client"

import { Form } from "@components/common/form"
import { Combobox } from "@components/inputs/combobox"
import { RouteDrawer, useRouteModal } from "@components/modals"
import { KeyboundForm } from "@components/utilities/keybound-form"
import { useUpdateStore } from "@hooks/api/store"
import { useComboboxData } from "@hooks/use-combobox-data"
import { fetchQuery } from "@lib/client"

type EditSellerFormProps = {
  seller: HttpTypes.AdminStore
}

const EditSellerSchema = z.object({
  name: z.string().min(1),
  default_region_id: z.string().optional(),
  default_location_id: z.string().optional(),
})

export const EditSellerForm = ({ seller }: EditSellerFormProps) => {
  const { t } = useTranslation()
  const { handleSuccess } = useRouteModal()

  const form = useForm<z.infer<typeof EditSellerSchema>>({
    defaultValues: {
      name: seller.name,
      default_region_id: seller.default_region_id || undefined,
      default_location_id: seller.default_location_id || undefined,
    },
    resolver: zodResolver(EditSellerSchema),
  })

  const { mutateAsync, isPending } = useUpdateStore(seller.id)

  const regionsCombobox = useComboboxData({
    queryKey: ["regions", "default_region_id"],
    queryFn: (params) => sdk.vendor.regions.query({ ...params, fields: "id,name" }),
    defaultValue: seller.default_region_id || undefined,
    getOptions: (data: any) =>
      data.regions.map((r: any) => ({ label: r.name, value: r.id })),
  })

  const locationsCombobox = useComboboxData({
    queryFn: (params) =>
      fetchQuery(`/vendor/stock-locations`, {
        method: "GET",
        query: { ...params, fields: "id,name" },
      }),
    getOptions: (data: any) =>
      data.stock_locations.map((l: any) => ({ label: l.name, value: l.id })),
    queryKey: ["stock_locations", "default_location_id"],
    defaultValue: seller.default_location_id || undefined,
  })

  const handleSubmit = form.handleSubmit(async (values) => {
    await mutateAsync(values, {
      onSuccess: () => {
        toast.success(t("seller.toast.update", "Seller updated successfully"))
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
              name="name"
              render={({ field }) => (
                <Form.Item>
                  <Form.Label>{t("fields.name")}</Form.Label>
                  <Form.Control>
                    <Input placeholder="Company Name" {...field} />
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            />
            <Form.Field
              control={form.control}
              name="default_region_id"
              render={({ field }) => {
                return (
                  <Form.Item>
                    <Form.Label>{t("seller.defaultRegion", "Default Region")}</Form.Label>
                    <Form.Control>
                      <Combobox
                        {...field}
                        options={regionsCombobox.options}
                        searchValue={regionsCombobox.searchValue}
                        onSearchValueChange={regionsCombobox.onSearchValueChange}
                        disabled={regionsCombobox.disabled}
                      />
                    </Form.Control>
                    <Form.ErrorMessage />
                  </Form.Item>
                )
              }}
            />
            <Form.Field
              control={form.control}
              name="default_location_id"
              render={({ field }) => {
                return (
                  <Form.Item>
                    <Form.Label>{t("seller.defaultLocation", "Default Location")}</Form.Label>
                    <Form.Control>
                      <Combobox
                        {...field}
                        options={locationsCombobox.options}
                        searchValue={locationsCombobox.searchValue}
                        onSearchValueChange={locationsCombobox.onSearchValueChange}
                        disabled={locationsCombobox.disabled}
                      />
                    </Form.Control>
                    <Form.ErrorMessage />
                  </Form.Item>
                )
              }}
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
