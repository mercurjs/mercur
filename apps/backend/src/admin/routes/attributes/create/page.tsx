import { defineRouteConfig } from "@medusajs/admin-sdk";
import { useQueryClient } from "@tanstack/react-query";
import {
  FocusModal,
  Heading,
  Button,
  toast,
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

      queryClient.invalidateQueries({ queryKey: attributeQueryKeys.list() });

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

  return (
    <FocusModal
      open={true}
      onOpenChange={(open) => {
        if (!open) handleClose();
      }}
    >
      <FocusModal.Content>
        <FocusModal.Header>
          <Heading>Create Attribute</Heading>
        </FocusModal.Header>
        <FocusModal.Body className="flex flex-col items-center py-16">
          <div>
            <AttributeForm
              //@ts-expect-error The received values will be for create form
              onSubmit={handleSave}
              onCancel={handleClose}
              categories={categories}
            />
          </div>
        </FocusModal.Body>
        <FocusModal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" form="attribute-form">
            Create
          </Button>
        </FocusModal.Footer>
      </FocusModal.Content>
    </FocusModal>
  );
};

export const config = defineRouteConfig({});

export default CreateAttributePage;
