import { ProductCreateVariantsForm } from "./product-create-variants-form"
import { useProductCreateContext } from "./product-create-context"

export function VariantsTab() {
  const { form, store, regions, pricePreferences } = useProductCreateContext()
  return (
    <ProductCreateVariantsForm
      form={form}
      store={store}
      regions={regions}
      pricePreferences={pricePreferences}
    />
  )
}
