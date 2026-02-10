import { zodResolver } from "@hookform/resolvers/zod"
import { Button, ProgressTabs, toast } from "@medusajs/ui"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"

import {
  RouteFocusModal,
  useRouteModal,
} from "@components/modals"
import { KeyboundForm } from "@components/utilities/keybound-form"
import { transformNullableFormData } from "@lib/form-helpers"
import { CreateCategoryDetails } from "./create-category-details"
import { CreateCategorySchema } from "./schema"
import { useCreateVendorRequest } from "@hooks/api"

type CreateCategoryFormProps = {
  parentCategoryId: string | null
}

enum Tab {
  DETAILS = "details",
  ORGANIZE = "organize",
}

export const CreateCategoryForm = ({
  parentCategoryId,
}: CreateCategoryFormProps) => {
  const { t } = useTranslation()
  const { handleSuccess } = useRouteModal()

  const form = useForm<CreateCategorySchema>({
    defaultValues: {
      name: "",
      description: "",
      handle: "",
      status: "active",
      visibility: "public",
      rank: parentCategoryId ? 0 : null,
      parent_category_id: parentCategoryId,
    },
    resolver: zodResolver(CreateCategorySchema),
  })

  const { mutateAsync, isPending } = useCreateVendorRequest()

  const handleSubmit = form.handleSubmit((data) => {
    const {
      visibility,
      status,
      parent_category_id,
      rank,
      name,
      handle,
      ...rest
    } = data
    const parsedData = transformNullableFormData(rest, false)

    mutateAsync(
      {
        request: {
          type: "product_category",
          data: {
            name: name,
            handle,
            ...parsedData,
            is_active: "active",
            is_internal: true,
            rank: rank ?? undefined,
            parent_category_id: null,
          },
        },
      },
      {
        onSuccess: () => {
          toast.success("Request has been sent")

          handleSuccess("/requests")
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
        onSubmit={handleSubmit}
        className="flex size-full flex-col overflow-hidden"
      >
        <ProgressTabs value={Tab.DETAILS} className="flex size-full flex-col">
          <RouteFocusModal.Header>
            <div className="flex w-full items-center justify-between">
              <div className="-my-2 w-full max-w-[400px] border-l">
                <ProgressTabs.List className="grid w-full grid-cols-2">
                  <ProgressTabs.Trigger
                    value={Tab.DETAILS}
                    status={"in-progress"}
                    className="w-full min-w-0 overflow-hidden"
                  >
                    <span className="truncate">
                      {t("categories.create.tabs.details")}
                    </span>
                  </ProgressTabs.Trigger>
                </ProgressTabs.List>
              </div>
            </div>
          </RouteFocusModal.Header>
          <RouteFocusModal.Body className="flex size-full flex-col overflow-auto">
            <ProgressTabs.Content value={Tab.DETAILS}>
              <CreateCategoryDetails form={form} />
            </ProgressTabs.Content>
          </RouteFocusModal.Body>
          <RouteFocusModal.Footer>
            <div className="flex items-center justify-end gap-x-2">
              <RouteFocusModal.Close asChild>
                <Button size="small" variant="secondary">
                  {t("actions.cancel")}
                </Button>
              </RouteFocusModal.Close>
              <Button
                key="submit-btn"
                size="small"
                variant="primary"
                type="submit"
                isLoading={isPending}
              >
                Request
              </Button>
            </div>
          </RouteFocusModal.Footer>
        </ProgressTabs>
      </KeyboundForm>
    </RouteFocusModal.Form>
  )
}
