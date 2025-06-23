import { defineWidgetConfig } from "@medusajs/admin-sdk";
import { Container, Heading, Table } from "@medusajs/ui";
import { useProduct } from "../hooks/api/product";

const ProductAttributeValuesWidget = (props: any) => {
  const { product } = useProduct(props.data.id, {
    fields: 'attribute_values.*,attribute_values.attribute.*'
  });

  return (
    <div>
      <Container className="divide-y p-0 pb-2">
        <div className="flex items-center justify-between px-6 py-4">
          <Heading>Custom Attributes</Heading>
        </div>
        
        <div className="mb-6">
            <Table>
              <Table.Body>
                {product?.attribute_values?.map((attribute: any) => (
                  <Table.Row key={attribute?.id}>
                    <Table.Cell>{attribute?.attribute?.name}</Table.Cell>
                    <Table.Cell>{attribute?.value}</Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
        </div>
      </Container>
    </div>
  );
};

export const config = defineWidgetConfig({
  zone: "product.details.after",
});

export default ProductAttributeValuesWidget;
