import { defineWidgetConfig } from "@medusajs/admin-sdk";
import { Button, Container, Heading, Label, Table, toast, Tooltip } from "@medusajs/ui";
import { useProduct, useProductAttributes, useUpdateProduct } from "../hooks/api/product";
import { ActionMenu } from "../components/action-menu/action-menu";
import { InformationCircleSolid, PencilSquare } from "@medusajs/icons";
import { useState, useEffect } from "react";
import { RouteDrawer } from "../components/route-drawer/RouteDrawer";
import { useForm, FormProvider } from "react-hook-form";
import { Components } from "../components/product-attributes-form/Components";


const ProductAttributeValuesWidget = (props: any) => {
  const [open, setOpen] = useState(false)
  const { product, isLoading: isProductLoading } = useProduct(props.data.id, {
    fields: 'attribute_values.*,attribute_values.attribute.*'
  });

  const { attributes, isLoading } = useProductAttributes(props.data.id!)

  const { mutate: updateProduct } = useUpdateProduct(props.data.id)

  const form = useForm<any>({
    defaultValues: {},
  })

  // Reset form when product data is loaded
  useEffect(() => {
    if (product?.attribute_values) {
      product.attribute_values.forEach((curr: any) => {
        form.setValue(curr.attribute_id, curr.value)
      })
    }
  }, [product?.attribute_values, form])

  const onSubmit = (data: any) => {
    const formattedData = Object.keys(data).map((key) => {
      const attribute = attributes.find(
        (a: any) => a.id === key && a.ui_component === "select"
      )
      const value = attribute?.possible_values.find(
        (pv: any) => pv.id === data[key]
      )?.value

      return (
        value && {
          [key]: value,
        }
      )
    })
    const payload = {
      ...data,
      ...Object.assign({}, ...formattedData.filter(Boolean)),
    }

    const values = Object.keys(payload).reduce(
      (acc: Array<Record<string, string>>, key) => {
        acc.push({ attribute_id: key, value: payload[key] })
        return acc
      },
      []
    )

    updateProduct({
      additional_data: {values}
    }, {
      onSuccess: () => {
        toast.success("Product updated successfully")
        setOpen(false)
      }
    })
  }

  if (isLoading || isProductLoading) return <div>Loading...</div>

  return (
    <>
      <div>
        <Container className="divide-y p-0 pb-2">
          <div className="flex items-center justify-between px-6 py-4">
          <Heading level="h2">Additional Attributes</Heading>
          <ActionMenu
            groups={[
              {
                actions: [
                  {
                    label: "Edit",
                    onClick: () => setOpen(true),
                    icon: <PencilSquare />,
                  },
                ],
              },
            ]}
          />
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
      {open && (
        <RouteDrawer onClose={() => setOpen(false)} header="Additional Attributes">
          <FormProvider {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="p-0">
              {attributes.map((a: any) => (
                <div key={`form-field-${a.handle}-${a.id}`} className="mb-4 -mx-4">
                  <Label className="flex items-center gap-x-2 mb-2">
                    {a.name}
                    {a.description && <Tooltip content={a.description}><InformationCircleSolid /></Tooltip>}
                  </Label>
                  <Components attribute={a} field={{ name: a.id, value: form.watch(a.id), defaultValue: form.getValues(a.id), onChange: (e: any) => {
                    form.setValue(a.id, e.target.value)
                  } }} />
                </div>
              ))}
              <div className="flex justify-end mt-4 -mx-4">
                <Button>Save</Button>
              </div>
            </form>
          </FormProvider>
        </RouteDrawer>
      )}
    </>
  )
};

export const config = defineWidgetConfig({
  zone: "product.details.side.after",
});

export default ProductAttributeValuesWidget;
