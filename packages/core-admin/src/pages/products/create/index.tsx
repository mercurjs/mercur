import { ProductCreatePage } from "./_components/product-create-page"

// Re-export compound component for user overrides
export { ProductCreatePage }
export type { ProductCreatePageProps } from "./_components/product-create-page"
export type { ProductCreateContextValue } from "./_components/product-create-context"

export const Component = () => <ProductCreatePage />
