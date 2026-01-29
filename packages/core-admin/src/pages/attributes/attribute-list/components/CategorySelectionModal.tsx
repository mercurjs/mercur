import React, { useState, useEffect } from "react";
import { Prompt } from "@medusajs/ui";
import { AdminProductCategory } from "@medusajs/types";
import MultiSelectCategory from "../../attribute-create/components/MultiSelectCategory";
import { sdk } from "../../../../lib/client";

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
      const response = await sdk.client.fetch<{
        product_categories: AdminProductCategory[];
      }>("/admin/product-categories", {
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
    <Prompt open={open} variant="confirmation" onOpenChange={onOpenChange} data-testid="attribute-category-selection-modal">
      <Prompt.Content data-testid="attribute-category-selection-modal-content">
        <Prompt.Header data-testid="attribute-category-selection-modal-header">
          <Prompt.Title className="border-ui-border-base border-b -mx-6 pl-6 pb-4 -mt-2" data-testid="attribute-category-selection-modal-title">
            Select category
          </Prompt.Title>
          <Prompt.Description className="flex flex-col gap-4 py-4" data-testid="attribute-category-selection-modal-description">
            Please select the category where this attribute applies.
            <MultiSelectCategory
              categories={categories}
              value={selectedCategories}
              onChange={setSelectedCategories}
            />
          </Prompt.Description>
        </Prompt.Header>

        <Prompt.Footer className="border-ui-border-base border-t py-4" data-testid="attribute-category-selection-modal-footer">
          <Prompt.Cancel onClick={handleCancel} data-testid="attribute-category-selection-modal-cancel-button">Cancel</Prompt.Cancel>
          <Prompt.Action
            onClick={handleConfirm}
            disabled={selectedCategories.length === 0 || isLoading}
            data-testid="attribute-category-selection-modal-save-button"
          >
            Save
          </Prompt.Action>
        </Prompt.Footer>
      </Prompt.Content>
    </Prompt>
  );
};
