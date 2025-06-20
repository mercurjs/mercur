import { defineRouteConfig } from "@medusajs/admin-sdk";
import { FocusModal, Heading, Button, toast } from "@medusajs/ui";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { AdminProductCategory } from "@medusajs/types";
import {
  AttributeForm,
  CreateAttributeFormSchema,
} from "../../components/AttributeForm";
import { z } from "zod";
import { useAttribute, useUpdateAttribute } from "../../../../hooks/api/attributes";
import { mercurQuery } from "../../../../lib/client";


const EditAttributePage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [categories, setCategories] = useState<AdminProductCategory[]>([]);

  const { attribute, isLoading } = useAttribute(
    id ?? "",
    {
      fields:
        "name,description,handle,ui_component,product_categories.name,possible_values.*,is_filterable",
    },
    { enabled: !!id }
  );

  const { mutateAsync } = useUpdateAttribute(id!);

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

  const handleSave = async (
    data: z.infer<typeof CreateAttributeFormSchema>
  ) => {
    const { ...payload } = data;
    await mutateAsync(payload, {
      onSuccess: () => {
        toast.success("Attribute updated!");
        navigate(-1);
      },
      onError: (error) => {
        toast.error((error as Error).message);
        console.error(error);
      },
    });
  };

  const handleClose = () => {
    navigate(-1);
  };

  if (isLoading) {
    return null;
  }

  if (!attribute) {
    return null;
  }

  return (
    <FocusModal
      open={true}
      onOpenChange={(open) => {
        if (!open) handleClose();
      }}
    >
      <FocusModal.Content>
        <FocusModal.Header>
          <Heading>Edit Attribute</Heading>
        </FocusModal.Header>
        <FocusModal.Body className="flex flex-col items-center py-16">
          <div>
            <AttributeForm
              initialData={attribute}
              //@ts-expect-error correct data type will be received here
              onSubmit={handleSave}
              categories={categories}
            />
          </div>
        </FocusModal.Body>
        <FocusModal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" form="attribute-form">
            Save
          </Button>
        </FocusModal.Footer>
      </FocusModal.Content>
    </FocusModal>
  );
};

export const config = defineRouteConfig({
  label: "Edit Attribute",
});

export default EditAttributePage;
