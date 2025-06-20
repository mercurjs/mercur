import { Link, useNavigate } from "react-router-dom";
import { TwoColumnLayout } from "../../../../layouts/TwoColumnLayout";
import { SectionRow } from "../../components/section-row";
import { Badge, Button, Container, Heading, Table } from "@medusajs/ui";
import { useVendorRequest } from "../../../../hooks/api/requests";
import { ProductDTO } from "@medusajs/framework/types";
import { useProductCategory } from "../../../../hooks/api/product_category";
import { useProductCollection } from "../../../../hooks/api/product_collection";
import { useProductType } from "../../../../hooks/api/product_type";
import { useProductTags } from "../../../../hooks/api/product_tags";
import { useState } from "react";
import { ResolveRequestPrompt } from "../../components/resolve-request";
import { LoadingSpinner } from "../../../../common/LoadingSpinner";

export const ProductRequestDetail = ({ id }: { id: string }) => {
  const navigate = useNavigate();
  const { request, isError, isLoading } = useVendorRequest(id!);
  const requestData = request?.data as ProductDTO;

  const [promptOpen, setPromptOpen] = useState(false);
  const [requestAccept, setRequestAccept] = useState(false);

  const handlePrompt = (_: string, accept: boolean) => {
    setRequestAccept(accept);
    setPromptOpen(true);
  };

  if (!request || isLoading || isError) {
    return <LoadingSpinner />
  }

  return (
    <TwoColumnLayout
      firstCol={
        <>
          <Container className="divide-y p-0">
            <div className="flex items-center justify-between px-6 py-4">
              <Heading>{requestData.title}</Heading>
              <ResolveRequestPrompt
                close={() => {
                  setPromptOpen(false);
                }}
                open={promptOpen}
                id={request.id!}
                accept={requestAccept}
                onSuccess={() => {
                  close();
                  navigate("/requests/product");
                }}
              />
              <div className="flex items-center gap-x-4">
                <Button
                  onClick={() => {
                    handlePrompt(id, true);
                  }}
                >
                  Accept
                </Button>
                <Button
                  onClick={() => {
                    handlePrompt(id, false);
                  }}
                  variant="danger"
                >
                  Reject
                </Button>
              </div>
            </div>

            <SectionRow title="Description" value={requestData.description} />
            <SectionRow title="Subtitle" value={requestData.subtitle} />
            <SectionRow
              title="Handle"
              value={requestData.handle ? `/${requestData.handle}` : "-"}
            />
            <SectionRow
              title="Discountable"
              value={requestData.discountable ? "True" : "False"}
            />
          </Container>
          <ProductOptionsInfo product={requestData} />
          <ProductVariantInfo product={requestData} />
        </>
      }
      secondCol={
        <>
          <ProductOrganizationInfo product={requestData} />
          <ProductAttributeInfo product={requestData} />
        </>
      }
    />
  )
};

const ProductOptionsInfo = ({ product }: { product: ProductDTO }) => {
  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Options</Heading>
      </div>

      {product.options?.map((option) => {
        return (
          <SectionRow
            title={option.title}
            key={option.title}
            value={option.values?.map((val) => {
              return (
                <Badge
                  key={`${option.title}-${val}`}
                  size="2xsmall"
                  className="flex min-w-[20px] items-center justify-center"
                >
                  {String(val)}
                </Badge>
              );
            })}
          />
        );
      })}
    </Container>
  );
};

const ProductVariantInfo = ({ product }: { product: ProductDTO }) => {
  return (
    <Container>
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading>Variants</Heading>
        </div>
      </div>
      <div className="flex size-full flex-col overflow-hidden">
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Title</Table.HeaderCell>
              <Table.HeaderCell>SKU</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {product.variants?.map((v) => {
              return (
                <Table.Row key={v.title}>
                  <Table.Cell>{v.title || "-"}</Table.Cell>
                  <Table.Cell>{v.sku || "-"}</Table.Cell>
                </Table.Row>
              );
            })}
          </Table.Body>
        </Table>
      </div>
    </Container>
  );
};

const ProductOrganizationInfo = ({ product }: { product: ProductDTO }) => {
  let category_name = "";
  let category_id = "";
  let collection_name = "";
  let type_name = "";
  const productTags: { id: string; value: string }[] = [];

  if (product.categories && product.categories[0]) {
    category_id = product.categories[0].id;
    const { product_category } = useProductCategory(category_id);
    category_name = product_category?.name || "";
  }

  if (product.collection_id) {
    const { product_collection } = useProductCollection(product.collection_id);
    collection_name = product_collection?.title || "";
  }

  if (product.type_id) {
    const { product_type } = useProductType(product.type_id);
    type_name = product_type?.value || "";
  }

  if (product.tags && product.tags.length) {
    const tagIds = product.tags.map((t) => t.id);
    const { product_tags } = useProductTags({ id: tagIds });
    product_tags?.forEach((t) => productTags.push({ id: t.id, value: t.value }));
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Organization</Heading>
      </div>

      <SectionRow
        title={"Tags"}
        value={
          productTags
            ? productTags.map((tag) => (
                <Badge key={tag.id} className="w-fit" size="2xsmall" asChild>
                  <Link to={`/products?tag_id=${tag.id}`}>{tag.value}</Link>
                </Badge>
              ))
            : undefined
        }
      />
      <SectionRow
        title={"Type"}
        value={
          type_name ? (
            <Badge size="2xsmall" className="w-fit" asChild>
              <Link to={`/products?type_id=${product.type_id}`}>
                {type_name}
              </Link>
            </Badge>
          ) : undefined
        }
      />

      <SectionRow
        title={"Collection"}
        value={
          collection_name ? (
            <Badge size="2xsmall" className="w-fit" asChild>
              <Link to={`/collections/${product.collection_id}`}>
                {collection_name}
              </Link>
            </Badge>
          ) : undefined
        }
      />

      <SectionRow
        title={"Category"}
        value={
          category_name ? (
            <Badge key={category_id} className="w-fit" size="2xsmall" asChild>
              <Link to={`/categories/${category_id}`}>{category_name}</Link>
            </Badge>
          ) : undefined
        }
      />
    </Container>
  );
};

const ProductAttributeInfo = ({ product }: { product: ProductDTO }) => {
  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Attributes</Heading>
      </div>
      <SectionRow title={"Height"} value={product.height} />
      <SectionRow title={"Width"} value={product.width} />
      <SectionRow title={"Length"} value={product.length} />
      <SectionRow title={"Weight"} value={product.weight} />
      <SectionRow title={"Mid code"} value={product.mid_code} />
      <SectionRow title={"Hs code"} value={product.hs_code} />
      <SectionRow title={"Country of origin"} value={product.origin_country} />
    </Container>
  );
};
