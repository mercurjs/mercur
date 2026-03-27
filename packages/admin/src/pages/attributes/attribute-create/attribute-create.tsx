import { useRef, useState } from "react"
import { Button, Heading, ProgressTabs, Text, toast } from "@medusajs/ui"
import { useTranslation } from "react-i18next"

import {
  AttributeForm,
  type AttributeFormRef,
} from "../attribute-edit/components/attribute-form"
import type {
  CreateAttributeFormValues,
  UpdateAttributeFormValues,
} from "../attribute-edit/types"
import { useCreateAttribute, useProductCategories } from "../../../hooks/api"
import { RouteFocusModal, useRouteModal } from "../../../components/modals"

const AttributeCreateInner = () => {
  const { t } = useTranslation()
  const { handleSuccess } = useRouteModal()
  const formRef = useRef<AttributeFormRef>(null)

  const [activeTab, setActiveTab] = useState<"details" | "type">("details")
  const [tabStatuses, setTabStatuses] = useState<{
    detailsStatus: "not-started" | "in-progress" | "completed"
    typeStatus: "not-started" | "in-progress" | "completed"
  }>({
    detailsStatus: "not-started",
    typeStatus: "not-started",
  })

  const { mutateAsync, isPending } = useCreateAttribute()
  const { product_categories: categories = [] } = useProductCategories({
    limit: 999,
  })

  const handleSave = async (
    data: CreateAttributeFormValues | UpdateAttributeFormValues
  ) => {
    await mutateAsync(data as CreateAttributeFormValues, {
      onSuccess: () => {
        toast.success(
          t("attributes.create.successToast", {
            name: (data as CreateAttributeFormValues).name,
          })
        )
        handleSuccess("/settings/attributes")
      },
      onError: (error) => {
        toast.error(error.message)
      },
    })
  }

  const handleTabChange = (value: string) => {
    const newTab = value as "details" | "type"

    if (newTab === "type" && tabStatuses.detailsStatus === "not-started") {
      toast.warning(
        t(
          "attributes.create.fillNameWarning",
          "Please fill in the name first."
        )
      )
      return
    }

    setActiveTab(newTab)
  }

  const handleNext = async () => {
    if (formRef.current) {
      const isValid = await formRef.current.validateFields(["name"])
      if (isValid) {
        setActiveTab("type")
      }
    } else {
      setActiveTab("type")
    }
  }

  return (
    <ProgressTabs
      value={activeTab}
      onValueChange={handleTabChange}
      className="flex size-full flex-col overflow-hidden"
      data-testid="attribute-create-progress-tabs"
    >
      <RouteFocusModal.Header
        data-testid="attribute-create-modal-header"
      >
        <ProgressTabs.List
          className="justify-start flex w-full items-center"
          data-testid="attribute-create-progress-tabs-list"
        >
          <ProgressTabs.Trigger
            value="details"
            status={tabStatuses.detailsStatus}
            data-testid="attribute-create-details-tab"
          >
            {t("attributes.create.tabs.details", "Details")}
          </ProgressTabs.Trigger>
          <ProgressTabs.Trigger
            value="type"
            status={tabStatuses.typeStatus}
            data-testid="attribute-create-type-tab"
          >
            {t("attributes.create.tabs.type", "Type")}
          </ProgressTabs.Trigger>
        </ProgressTabs.List>
      </RouteFocusModal.Header>

      <RouteFocusModal.Body
        className="flex flex-1 justify-center overflow-auto px-6 py-16"
        data-testid="attribute-create-modal-body"
      >
        <div className="flex w-full max-w-[720px] flex-col gap-y-8">
          <div className="flex flex-col gap-y-1">
            <RouteFocusModal.Title asChild>
              <Heading data-testid="attribute-create-modal-heading">
                {t("attributes.create.header", "Create Attribute")}
              </Heading>
            </RouteFocusModal.Title>
            <RouteFocusModal.Description asChild>
              <Text
                size="small"
                className="text-ui-fg-subtle"
                data-testid="attribute-create-modal-subtitle"
              >
                {t(
                  "attributes.create.subtitle",
                  "Define a new product attribute."
                )}
              </Text>
            </RouteFocusModal.Description>
          </div>

          <AttributeForm
            ref={formRef}
            onSubmit={handleSave}
            categories={categories}
            mode="create"
            activeTab={activeTab}
            onFormStateChange={setTabStatuses}
          />
        </div>
      </RouteFocusModal.Body>

      <RouteFocusModal.Footer data-testid="attribute-create-modal-footer">
        <div className="flex items-center justify-end gap-2">
          <RouteFocusModal.Close asChild>
            <Button
              size="small"
              variant="secondary"
              type="button"
              data-testid="attribute-create-modal-cancel-button"
            >
              {t("actions.cancel", "Cancel")}
            </Button>
          </RouteFocusModal.Close>
          {activeTab === "details" ? (
            <Button
              size="small"
              type="button"
              onClick={handleNext}
              data-testid="attribute-create-modal-next-button"
            >
              {t("actions.continue", "Next")}
            </Button>
          ) : (
            <Button
              size="small"
              type="submit"
              form="attribute-form"
              isLoading={isPending}
              data-testid="attribute-create-modal-save-button"
            >
              {t("actions.save", "Save")}
            </Button>
          )}
        </div>
      </RouteFocusModal.Footer>
    </ProgressTabs>
  )
}

export const AttributeCreate = () => {
  return (
    <RouteFocusModal data-testid="attribute-create-modal">
      <AttributeCreateInner />
    </RouteFocusModal>
  )
}
