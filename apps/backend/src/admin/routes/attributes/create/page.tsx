import { defineRouteConfig } from "@medusajs/admin-sdk";
import { useQueryClient } from "@tanstack/react-query";
import {
  FocusModal,
  Button,
  toast,
  ProgressTabs,
} from "@medusajs/ui";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { AdminProductCategory } from "@medusajs/types";
import { AttributeForm, CreateAttributeFormSchema } from "../components/AttributeForm";
import { z } from "zod";
import { mercurQuery } from "../../../lib/client";
import { attributeQueryKeys } from "../../../hooks/api/attributes";

const CreateAttributePage = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<AdminProductCategory[]>([]);
  const [activeTab, setActiveTab] = useState<"details" | "type">("details");
  const [tabStatuses, setTabStatuses] = useState<{
    detailsStatus: "not-started" | "in-progress" | "completed";
    typeStatus: "not-started" | "in-progress" | "completed";
  }>({
    detailsStatus: "not-started",
    typeStatus: "not-started",
  });
  const [formRef, setFormRef] = useState<any>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await mercurQuery("/admin/product-categories", {
          method: "GET",
        });
        setCategories(response.product_categories);
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      }
    };
    fetchCategories();
  }, []);

  const handleSave = async (data: z.infer<typeof CreateAttributeFormSchema>) => {
    try {
      const { ...payload } = data;
      await mercurQuery("/admin/attributes", {
        method: "POST",
        body: payload,
      });

      queryClient.invalidateQueries({ queryKey: attributeQueryKeys.lists() });

      toast.success("Attribute created!");
      navigate(-1);
    } catch (error) {
      toast.error((error as Error).message);
      console.error(error);
    }
  };

  const handleClose = () => {
    navigate(-1);
  };

  const handleContinueOrSave = async () => {
    if (activeTab === "details") {
      if (formRef) {
        const isValid = await formRef.trigger(["name", "description", "handle", "product_category_ids"]);

        // Also manually validate categories using the function attached to formRef
        const categoryValid = formRef.validateCategories ? formRef.validateCategories() : true;

        if (isValid && categoryValid) {
          setActiveTab("type");
        }
      }
    } else {
      if (formRef) {
        const isValid = await formRef.trigger();
        if (isValid) {
          const form = document.getElementById("attribute-form") as HTMLFormElement;
          if (form) {
            form.requestSubmit();
          }
        }
      }
    }
  };

  return (
    <FocusModal
      open={true}
      onOpenChange={(open) => {
        if (!open) handleClose();
      }}
    >
      <FocusModal.Content>
        <FocusModal.Header className="flex items-center justify-between bg-ui-bg-base w-full py-0 h-fit sticky top-0 z-10">
          <ProgressTabs value={activeTab} onValueChange={(value) => setActiveTab(value as "details" | "type")} className="w-full h-full">
            <div className="w-full border-l h-full">
              <ProgressTabs.List className="justify-start flex w-full items-center">
                <ProgressTabs.Trigger value="details" status={tabStatuses.detailsStatus}>
                  Details
                </ProgressTabs.Trigger>
                <ProgressTabs.Trigger value="type" status={tabStatuses.typeStatus}>
                  Type
                </ProgressTabs.Trigger>
              </ProgressTabs.List>
            </div>
          </ProgressTabs>
        </FocusModal.Header>
        <FocusModal.Body className="flex flex-col items-center pt-16 h-full overflow-y-auto">
          <div className="w-full flex justify-center">
            <AttributeForm
              //@ts-expect-error The received values will be for create form
              onSubmit={handleSave}
              onCancel={handleClose}
              categories={categories}
              activeTab={activeTab}
              onFormStateChange={setTabStatuses}
              onFormRef={setFormRef}
            />
          </div>
        </FocusModal.Body>
        <FocusModal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleContinueOrSave}>
            {activeTab === "details" ? "Continue" : "Save"}
          </Button>
        </FocusModal.Footer>
      </FocusModal.Content>
    </FocusModal>
  );
};

export const config = defineRouteConfig({});

export default CreateAttributePage;
