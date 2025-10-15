
import { Badge, createDataTableColumnHelper, DropdownMenu, toast, usePrompt, Switch, IconButton } from "@medusajs/ui";
import { EllipsisHorizontal, PencilSquare, Trash } from "@medusajs/icons";
import { AttributeDTO } from "@mercurjs/framework";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { attributeQueryKeys } from "../../api/attributes";
import { mercurQuery } from "../../../lib/client";
import { CategorySelectionModal } from "../../../routes/attributes/components/CategorySelectionModal";


const columnHelper = createDataTableColumnHelper<AttributeDTO>();

export const useAttributeTableColumns = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const prompt = usePrompt();

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [currentAttribute, setCurrentAttribute] = useState<AttributeDTO | null>(null);

  const handleEdit = (attributeId: string) => {
    navigate(`/attributes/${attributeId}/edit`);
  };

  const handleToggleFilterable = async (attributeId: string, currentValue: boolean, attribute: AttributeDTO) => {
    try {
      await mercurQuery(`/admin/attributes/${attributeId}`, {
        method: "POST",
        body: {
          name: attribute.name,
          description: attribute.description,
          handle: attribute.handle,
          is_filterable: !currentValue,
          is_required: attribute.is_required,
          ui_component: attribute.ui_component,
          // metadata: {},
          product_category_ids: attribute.product_categories?.map((category) => category.id),
          possible_values: attribute.possible_values?.map((value) => ({
            id: value.id,
            value: value.value,
            rank: value.rank,
            metadata: value.metadata,
          })),
        },
      });

      queryClient.invalidateQueries({ queryKey: attributeQueryKeys.lists() });
      toast.success("Attribute updated!");
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const handleToggleGlobal = async (attributeId: string, newValue: boolean, attribute: AttributeDTO) => {
    const isCurrentlyGlobal = !attribute.product_categories?.length;

    if (isCurrentlyGlobal && !newValue) {
      setCurrentAttribute(attribute);
      setIsCategoryModalOpen(true);
      return;
    }

    if (!isCurrentlyGlobal && newValue) {
      try {
        await mercurQuery(`/admin/attributes/${attributeId}`, {
          method: "POST",
          body: {
            name: attribute.name,
            description: attribute.description,
            handle: attribute.handle,
            is_filterable: attribute.is_filterable,
            is_required: attribute.is_required,
            ui_component: attribute.ui_component,
            product_category_ids: [],
            possible_values: attribute.possible_values?.map((value) => ({
              id: value.id,
              value: value.value,
              rank: value.rank,
              metadata: value.metadata ?? {},
            })),
          },
        });

        queryClient.invalidateQueries({ queryKey: attributeQueryKeys.lists() });
        queryClient.invalidateQueries({ queryKey: attributeQueryKeys.detail(attributeId) });
        toast.success("Attribute updated!");
      } catch (error) {
        toast.error((error as Error).message);
      }
      return;
    }
  };

  const handleCategorySelection = async (selectedCategories: string[]) => {
    if (!currentAttribute) return;

    try {
      await mercurQuery(`/admin/attributes/${currentAttribute.id}`, {
        method: "POST",
        body: {
          name: currentAttribute.name,
          description: currentAttribute.description,
          handle: currentAttribute.handle,
          is_filterable: currentAttribute.is_filterable,
          is_required: currentAttribute.is_required,
          ui_component: currentAttribute.ui_component,
          product_category_ids: selectedCategories,
          possible_values: currentAttribute.possible_values?.map((value) => ({
            id: value.id,
            value: value.value,
            rank: value.rank,
            metadata: value.metadata,
          })),
        },
      });

      queryClient.invalidateQueries({ queryKey: attributeQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: attributeQueryKeys.detail(currentAttribute.id) });
      toast.success("Attribute updated!");
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setCurrentAttribute(null);
      setIsCategoryModalOpen(false);
    }
  };

  const handleDelete = async (attributeId: string, attributeName: string) => {
    const confirmed = await prompt({
      title: "Delete Attribute",
      description: `You are about to delete attribute ${attributeName}. This action cannot be undone.`,
      confirmText: "Delete",
      cancelText: "Cancel",
    });

    if (!confirmed) {
      return;
    }

    try {
      await mercurQuery(`/admin/attributes/${attributeId}`, {
        method: "DELETE",
      });
      toast.success("Attribute deleted!");
      queryClient.invalidateQueries({ queryKey: attributeQueryKeys.lists() });
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const columns = useMemo(
    () => [
      columnHelper.accessor("name", {
        header: "Name",
      }),
      columnHelper.accessor("handle", {
        header: "Handle",
      }),
      columnHelper.accessor("is_filterable", {
        header: "Filterable",
        cell: (info) => {
          const attribute = info.row.original;
          return (
            <div onClick={(e) => e.stopPropagation()}>
              <Switch
                checked={info.getValue()}
                onCheckedChange={() => handleToggleFilterable(attribute.id, info.getValue(), attribute)}
              />
            </div>
          );
        },
      }),
      columnHelper.accessor("product_categories", {
        header: "Global",
        cell: (info) => {
          const attribute = info.row.original;
          const isGlobal = !info.getValue()?.length;
          return (
            <Switch
              checked={isGlobal}
              onCheckedChange={(newValue) => handleToggleGlobal(attribute.id, newValue, attribute)}
              onClick={(e) => e.stopPropagation()}
            />
          );
        },
      }),
      columnHelper.accessor("possible_values", {
        header: "Possible Values",
        cell: (info) => {
          const values = info.getValue();
          if (!values || values.length === 0) {
            return "-";
          }

          if (values.length <= 3) {
            return (
              <div className="flex flex-wrap gap-2">
                {values.map((value) => (
                  <Badge size="xsmall" key={value.id}>
                    {value.value}
                  </Badge>
                ))}
              </div>
            );
          }

          const remainingCount = values.length - 2;
          return (
            <div className="flex flex-wrap gap-2">
              {values.slice(0, 2).map((value) => (
                <Badge size="xsmall" key={value.id}>
                  {value.value}
                </Badge>
              ))}
              <Badge size="xsmall" color="grey">
                +{remainingCount}
              </Badge>
            </div>
          );
        },
      }),
      columnHelper.display({
        id: "actions",
        header: "",
        cell: (info) => {
          const attribute = info.row.original;
          return (
            <div className="flex items-center justify-end">
              <DropdownMenu>
                <DropdownMenu.Trigger asChild>
                  <IconButton variant="transparent" size="small">
                    <EllipsisHorizontal />
                  </IconButton>
                </DropdownMenu.Trigger>
                <DropdownMenu.Content align="end">
                  <DropdownMenu.Item onClick={(e) => {
                    e.stopPropagation(),
                      handleEdit(attribute.id)
                  }}>
                    <span className="flex items-center gap-2">
                      <PencilSquare /> Edit</span>
                  </DropdownMenu.Item>
                  <DropdownMenu.Item onClick={(e) => {
                    e.stopPropagation(),
                      handleDelete(attribute.id, attribute.name)
                  }}>
                    <span className="flex items-center gap-2">
                      <Trash /> Delete
                    </span>
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu>
            </div>
          );
        },
      }),
    ],
    [navigate, queryClient, prompt, handleToggleFilterable, handleToggleGlobal]
  );

  return {
    columns,
    modal: (
      <CategorySelectionModal
        open={isCategoryModalOpen}
        onOpenChange={setIsCategoryModalOpen}
        onConfirm={handleCategorySelection}
      />
    )
  };
};
