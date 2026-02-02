import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"

import { useQueryClient } from "@tanstack/react-query"

import {
  attributeQueryKeys,
  useAttribute,
  useUpdateAttribute,
} from "@hooks/api/attributes"
import { sdk } from "@lib/client"
import { Button, FocusModal, ProgressTabs, toast } from "@medusajs/ui"

import { AttributeForm } from "@pages/attributes/[id]/edit/_components/attribute-form"
import { CreateAttributeFormSchema } from "@pages/attributes/[id]/edit/_common/schema"

import type { AdminProductCategory } from "@medusajs/types"
import type { z } from "zod"

const AttributeEdit = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const [categories, setCategories] = useState<AdminProductCategory[]>([])
  const [activeTab, setActiveTab] = useState<"details" | "type">("details")
  const [tabStatuses, setTabStatuses] = useState<{
    detailsStatus: "not-started" | "in-progress" | "completed"
    typeStatus: "not-started" | "in-progress" | "completed"
  }>({
    detailsStatus: "completed",
    typeStatus: "completed",
  })
  const queryClient = useQueryClient()

  const { attribute, isLoading } = useAttribute(
    id ?? "",
    {
      fields:
        "name,description,handle,ui_component,product_categories.name,possible_values.*,is_filterable,is_required",
    },
    { enabled: !!id }
  )

  const { mutateAsync } = useUpdateAttribute(id!)

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await sdk.client.fetch<{
          product_categories: AdminProductCategory[]
        }>("/admin/product-categories", {
          method: "GET",
        })
        setCategories(response.product_categories)
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
      await mutateAsync(payload)

      queryClient.invalidateQueries({ queryKey: attributeQueryKeys.lists() })

      toast.success("Attribute updated!")
      navigate(-1)
    } catch (error) {
      toast.error((error as Error).message)
      console.error(error)
    }
  }

  const handleClose = () => {
    navigate(-1)
  }

  if (isLoading) {
    return null
  }

  if (!attribute) {
    return null
  }

  return (
    <FocusModal
      open={true}
      onOpenChange={(open) => {
        if (!open) handleClose()
      }}
      data-testid="attribute-edit-modal"
    >
      <FocusModal.Content data-testid="attribute-edit-modal-content">
        <ProgressTabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as "details" | "type")}
          className="h-full w-full"
          data-testid="attribute-edit-progress-tabs"
        >
          <FocusModal.Header
            className="flex h-fit w-full items-center justify-between py-0"
            data-testid="attribute-edit-modal-header"
          >
            <div className="h-full w-full border-l">
              <ProgressTabs.List
                className="flex w-full items-center justify-start"
                data-testid="attribute-edit-progress-tabs-list"
              >
                <ProgressTabs.Trigger
                  value="details"
                  status={tabStatuses.detailsStatus}
                  data-testid="attribute-edit-details-tab"
                >
                  Details
                </ProgressTabs.Trigger>
                <ProgressTabs.Trigger
                  value="type"
                  status={tabStatuses.typeStatus}
                  data-testid="attribute-edit-type-tab"
                >
                  Type
                </ProgressTabs.Trigger>
              </ProgressTabs.List>
            </div>
          </FocusModal.Header>
          <FocusModal.Body
            className="flex flex-col items-center py-16"
            data-testid="attribute-edit-modal-body"
          >
            <div>
              <AttributeForm
                initialData={attribute}
                //@ts-expect-error correct data type will be received here
                onSubmit={handleSave}
                onCancel={handleClose}
                categories={categories}
                activeTab={activeTab}
                onFormStateChange={setTabStatuses}
              />
            </div>
          </FocusModal.Body>
        </ProgressTabs>
        <FocusModal.Footer data-testid="attribute-edit-modal-footer">
          <Button
            variant="secondary"
            onClick={handleClose}
            data-testid="attribute-edit-modal-cancel-button"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="attribute-form"
            data-testid="attribute-edit-modal-save-button"
          >
            Save
          </Button>
        </FocusModal.Footer>
      </FocusModal.Content>
    </FocusModal>
  )
}

export const Component = AttributeEdit
