import { ProductCreatePage, ProductCreateBaseSchema } from "@mercurjs/vendor/pages"
import { Container, Heading, Text, Input, Label } from "@medusajs/ui"
import { z } from "zod"
import { useTabbedForm } from "@mercurjs/vendor"

const ExtendedSchema = ProductCreateBaseSchema.extend({
  vendor_note: z.string().optional(),
})
type ExtendedFormType = z.infer<typeof ExtendedSchema>

export default function CustomProductCreate() {
  return (
    <ProductCreatePage>
      <ProductCreatePage.Form
        schema={ExtendedSchema}
        defaultValues={{ vendor_note: "" }}
      >
        <ProductCreatePage.DetailsForm>
          <ProductCreatePage.DetailsForm.MediaSection />
          <ProductCreatePage.DetailsForm.GeneralSection />
          <ProductCreatePage.DetailsForm.VariantsSection />
        </ProductCreatePage.DetailsForm>
        <ProductCreatePage.OrganizeForm />
        <ProductCreatePage.Tab id="custom-info" label="Custom Info">
          <CustomInfoSection />
        </ProductCreatePage.Tab>
        <ProductCreatePage.VariantsForm />
      </ProductCreatePage.Form>
    </ProductCreatePage>
  )
}

function CustomInfoSection() {
  const form = useTabbedForm<ExtendedFormType>()
  const title = form.watch("title")

  return (
    <Container>
      <Heading level="h2">Custom Section</Heading>
      <Text>
        {title
          ? `Creating: "${title}"`
          : "Enter a title in the Details tab"}
      </Text>
      <div className="mt-4">
        <Label htmlFor="vendor_note">Vendor Note</Label>
        <Input id="vendor_note" {...form.register("vendor_note")} />
      </div>
    </Container>
  )
}
