import { useQueryClient } from "@tanstack/react-query";
import {
  Container,
  Heading,
  Text,
  toast,
  DropdownMenu,
  Button,
  Badge,
} from "@medusajs/ui";
import { useParams, useNavigate } from "react-router-dom";
import { EllipsisHorizontal } from "@medusajs/icons";
import { PossibleValuesTable } from "../attribute-edit-possible-value/components/possible-values-table";

import { SingleColumnLayout } from "../../../components/layout/single-column";
import {
  attributeQueryKeys,
  useAttribute,
} from "../../../hooks/api/attributes";
import { sdk } from "../../../lib/client";
import { SectionRow } from "../../../components/common/section";

export const AttributeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const queryClient = useQueryClient();

  const { attribute, isLoading } = useAttribute(
    id ?? "",
    {
      fields:
        "name, description, handle, product_categories.name, possible_values.*,is_filterable,is_required,ui_component",
    },
    { enabled: !!id }
  );

  if (isLoading) {
    return (
      <Container>
        <div className="flex items-center justify-center h-[200px]">
          <Text>Loading...</Text>
        </div>
      </Container>
    );
  }

  if (!attribute) {
    return (
      <Container>
        <div className="flex items-center justify-center h-[200px]">
          <Text>Attribute not found</Text>
        </div>
      </Container>
    );
  }

  const handleEdit = () => {
    navigate(`/settings/attributes/${id}/edit`);
  };

  const handleDelete = async () => {
    try {
      await sdk.client.fetch(`/admin/attributes/${id}`, {
        method: "DELETE",
      });
      toast.success("Attribute deleted!");
      queryClient.invalidateQueries({ queryKey: attributeQueryKeys.list() });
      navigate("/attributes");
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  return (
    <SingleColumnLayout>
      <Container className="divide-y p-0" data-testid="attribute-detail-container">
        <div className="flex items-center justify-between px-6 py-4" data-testid="attribute-detail-header">
          <Heading level="h2" data-testid="attribute-detail-heading">{attribute.name}</Heading>
          <div className="flex items-center gap-2" data-testid="attribute-detail-actions">
            <DropdownMenu>
              <DropdownMenu.Trigger asChild>
                <Button variant="transparent" size="small" data-testid="attribute-detail-action-menu-trigger">
                  <EllipsisHorizontal />
                </Button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Content align="end" data-testid="attribute-detail-action-menu">
                <DropdownMenu.Item onClick={handleEdit} data-testid="attribute-detail-edit-action">Edit</DropdownMenu.Item>
                <DropdownMenu.Item onClick={handleDelete} data-testid="attribute-detail-delete-action">
                  Delete
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu>
          </div>
        </div>

        <SectionRow title="Description" value={attribute.description} data-testid="attribute-detail-description-row" />
        <SectionRow title="Handle" value={attribute.handle} data-testid="attribute-detail-handle-row" />
        <SectionRow title="Type" value={attribute.ui_component} data-testid="attribute-detail-type-row" />
        <SectionRow
          title="Filterable"
          value={attribute.is_filterable ? "True" : "False"}
          data-testid="attribute-detail-filterable-row"
        />
        <SectionRow
          title="Required"
          value={attribute.is_required ? "True" : "False"}
          data-testid="attribute-detail-required-row"
        />
        <SectionRow
          title="Global"
          value={!attribute.product_categories?.length ? "True" : "False"}
          data-testid="attribute-detail-global-row"
        />

        {attribute.product_categories &&
          attribute.product_categories.length > 0 && (
            <SectionRow
              title="Product Categories"
              value={
                <>
                  {attribute.product_categories.map(
                    (category: { id: string; name: string }) => (
                      <Badge size="xsmall" key={category.id} data-testid={`attribute-detail-category-badge-${category.id}`}>
                        {category.name}
                      </Badge>
                    )
                  )}
                </>
              }
              data-testid="attribute-detail-categories-row"
            />
          )}
      </Container>

      <PossibleValuesTable attribute={attribute} isLoading={isLoading} />
    </SingleColumnLayout>
  );
};
