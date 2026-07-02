import { Carousel } from "@/components/cells"
import { CategoryCard } from "@/components/organisms"
import { listCategories } from "@/lib/data/categories"

export const HomeCategories = async ({ heading }: { heading: string }) => {
  const { parentCategories } = await listCategories()

  if (!parentCategories?.length) {
    return null
  }

  return (
    <section className="bg-primary py-8 w-full">
      <div className="mb-6">
        <h2 className="heading-lg text-primary uppercase">{heading}</h2>
      </div>
      <Carousel
        items={parentCategories.map((category) => (
          <CategoryCard key={category.id} category={category} />
        ))}
      />
    </section>
  )
}
