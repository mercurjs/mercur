import { defineRouteConfig } from "@medusajs/admin-sdk";
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
import { SectionRow } from "../../../components/section-row";
import { PossibleValuesTable } from "../components/possible-values-table";

import { SingleColumnLayout } from "../../../layouts/single-column";
import { attributeQueryKeys, useAttribute } from "../../../hooks/api/attributes";
import { mercurQuery } from "../../../lib/client";

const AttributeDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const queryClient = useQueryClient();

  const { attribute, isLoading } = useAttribute(id ?? "", {
    fields: 'name, description, handle, product_categories.name, possible_values.*'
  }, { enabled: !!id })

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
    navigate(`/attributes/${id}/edit`);
  };

  const handleDelete = async () => {
    try {
      await mercurQuery(`/admin/attributes/${id}`, {
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
      <Container className="divide-y p-0">
        <div className="flex items-center justify-between px-6 py-4">
          <Heading level="h2">{attribute.name}</Heading>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenu.Trigger asChild>
                <Button variant="transparent" size="small">
                  <EllipsisHorizontal />
                </Button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Content align="end">
                <DropdownMenu.Item onClick={handleEdit}>
                  Edit
                </DropdownMenu.Item>
                <DropdownMenu.Item onClick={handleDelete}>
                  Delete
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu>
          </div>
        </div>

        <SectionRow title="Description" value={attribute.description} />
        <SectionRow title="Handle" value={attribute.handle} />
        <SectionRow
          title="Global"
          value={!attribute.product_categories?.length ? "True" : "False"}
        />

        {attribute.product_categories &&
          attribute.product_categories.length > 0 && (
            <SectionRow
              title="Product Categories"
              value={
                <>
                  {attribute.product_categories.map((category: { id: string; name: string }) => (
                    <Badge size="xsmall" key={category.id}>
                      {category.name}
                    </Badge>
                  ))}
                </>
              }
            />
          )}
      </Container>

      <PossibleValuesTable attribute={attribute} isLoading={isLoading} />
    </SingleColumnLayout>
  );
};

export const config = defineRouteConfig({
  label: "Attribute Details",
});

export default AttributeDetailPage;
