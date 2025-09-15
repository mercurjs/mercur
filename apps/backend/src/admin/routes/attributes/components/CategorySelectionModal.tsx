import React, { useState, useEffect } from "react";
import {
  Prompt,
} from "@medusajs/ui";
import { AdminProductCategory } from "@medusajs/types";
import MultiSelectCategory from "../create/components/MultiSelectCategory";
import { mercurQuery } from "../../../lib/client";

interface CategorySelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (selectedCategories: string[]) => void;
}

export const CategorySelectionModal: React.FC<CategorySelectionModalProps> = ({
  open,
  onOpenChange,
  onConfirm,
}) => {
  const [categories, setCategories] = useState<AdminProductCategory[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchCategories();
    }
  }, [open]);

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const response = await mercurQuery("/admin/product-categories", {
        method: "GET",
      });
      setCategories(response.product_categories || []);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = () => {
    onConfirm(selectedCategories);
    setSelectedCategories([]);
    onOpenChange(false);
  };

  const handleCancel = () => {
    setSelectedCategories([]);
    onOpenChange(false);
  };

  return (
    <Prompt open={open} variant="confirmation" onOpenChange={onOpenChange}>
      <Prompt.Content>
        <Prompt.Header >
          <Prompt.Title className="border-ui-border-base border-b -mx-6 pl-6 pb-4 -mt-2">Select category</Prompt.Title>
          <Prompt.Description className="flex flex-col gap-4 py-4">
            Please select the category where this attribute applies.
            <MultiSelectCategory
              categories={categories}
              value={selectedCategories}
              onChange={setSelectedCategories}
            />
          </Prompt.Description>
        </Prompt.Header>

        <Prompt.Footer className="border-ui-border-base border-t py-4">
          <Prompt.Cancel onClick={handleCancel}>
            Cancel
          </Prompt.Cancel>
          <Prompt.Action
            onClick={handleConfirm}
            disabled={selectedCategories.length === 0}
          >
            Save
          </Prompt.Action>
        </Prompt.Footer>
      </Prompt.Content>
    </Prompt>
  );
};
