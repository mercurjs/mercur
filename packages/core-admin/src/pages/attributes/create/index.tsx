import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"

import { useQueryClient } from "@tanstack/react-query"

import { attributeQueryKeys } from "@hooks/api/attributes"
import { sdk } from "@lib/client"
import { Button, FocusModal, ProgressTabs, toast } from "@medusajs/ui"

import {
  AttributeForm,
  type AttributeFormRef,
} from "@pages/attributes/[id]/edit/_components/attribute-form"
import type { CreateAttributeFormSchema } from "@pages/attributes/[id]/edit/_common/schema"

import type { AdminProductCategory } from "@medusajs/types"
import type { z } from "zod"

const AttributeCreate = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const formRef = useRef<AttributeFormRef>(null)
  const [categories, setCategories] = useState<AdminProductCategory[]>([])
  const [activeTab, setActiveTab] = useState<"details" | "type">("details")
  const [tabStatuses, setTabStatuses] = useState<{
    detailsStatus: "not-started" | "in-progress" | "completed"
    typeStatus: "not-started" | "in-progress" | "completed"
  }>({
    detailsStatus: "not-started",
    typeStatus: "not-started",
  })
  const queryClient = useQueryClient()

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { product_categories } = await sdk.client.fetch<{
          product_categories: AdminProductCategory[]
        }>("/admin/product-categories", {
          method: "GET",
        })

        setCategories(product_categories)
      } catch (error) {
        console.error("Failed to fetch categories:", error)
      }
    }
    fetchCategories()
  }, [])

  const handleSave = async (
    data: z.infer<typeof CreateAttributeFormSchema>
  ) => {
    try {
      const { ...payload } = data
      await sdk.client.fetch("/admin/attributes", {
        method: "POST",
        body: payload,
      })

      queryClient.invalidateQueries({ queryKey: attributeQueryKeys.lists() })

      toast.success("Attribute was successfully created.")
      navigate(-1)
    } catch (error) {
      toast.error((error as Error).message)
      console.error(error)
    }
  }

  const handleClose = () => {
    navigate(-1)
  }

  const handleTabChange = (value: string) => {
    const newTab = value as "details" | "type"

    if (newTab === "type" && tabStatuses.detailsStatus === "not-started") {
      toast.warning(t("attributes.create.fillNameWarning"))

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
    <FocusModal
      open={true}
      onOpenChange={(open) => {
        if (!open) handleClose()
      }}
      data-testid="attribute-create-modal"
    >
      <FocusModal.Content data-testid="attribute-create-modal-content">
        <ProgressTabs
          value={activeTab}
          onValueChange={handleTabChange}
          className="h-full w-full overflow-y-auto"
          data-testid="attribute-create-progress-tabs"
        >
          <FocusModal.Header
            className="sticky top-0 z-10 flex h-fit w-full items-center justify-between bg-ui-bg-base py-0"
            data-testid="attribute-create-modal-header"
          >
            <div className="h-full w-full border-l">
              <ProgressTabs.List
                className="flex w-full items-center justify-start"
                data-testid="attribute-create-progress-tabs-list"
              >
                <ProgressTabs.Trigger
                  value="details"
                  status={tabStatuses.detailsStatus}
                  data-testid="attribute-create-details-tab"
                >
                  Details
                </ProgressTabs.Trigger>
                <ProgressTabs.Trigger
                  value="type"
                  status={tabStatuses.typeStatus}
                  data-testid="attribute-create-type-tab"
                >
                  Type
                </ProgressTabs.Trigger>
              </ProgressTabs.List>
            </div>
          </FocusModal.Header>
          <FocusModal.Body
            className="flex flex-col items-center py-16"
            data-testid="attribute-create-modal-body"
          >
            <div>
              <AttributeForm
                ref={formRef}
                //@ts-expect-error The received values will be for create form
                onSubmit={handleSave}
                categories={categories}
                activeTab={activeTab}
                onFormStateChange={setTabStatuses}
              />
            </div>
          </FocusModal.Body>
        </ProgressTabs>
        <FocusModal.Footer data-testid="attribute-create-modal-footer">
          <Button
            variant="secondary"
            onClick={handleClose}
            data-testid="attribute-create-modal-cancel-button"
          >
            Cancel
          </Button>
          {activeTab === "details" ? (
            <Button
              type="button"
              onClick={handleNext}
              data-testid="attribute-create-modal-next-button"
            >
              Next
            </Button>
          ) : (
            <Button
              type="submit"
              form="attribute-form"
              data-testid="attribute-create-modal-save-button"
            >
              Save
            </Button>
          )}
        </FocusModal.Footer>
      </FocusModal.Content>
    </FocusModal>
  )
}

export const Component = AttributeCreate
