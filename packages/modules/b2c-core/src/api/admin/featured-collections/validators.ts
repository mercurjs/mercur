import { z } from 'zod'

export const AdminFeaturedCollectionProduct = z.object({
    product_id: z.string(),
    position: z.number(),
});

export const AdminCreateFeaturedCollection = z.object({
    name: z.string(),
    handle: z.string().optional(),
    min_items: z.number().optional().default(4),
    max_items: z.number().optional().default(8),
    is_active: z.boolean(),
    products: z.array(AdminFeaturedCollectionProduct)
}).refine((data) => data.products.length >= data.min_items && data.products.length <= data.max_items, {
    message: "Products must be between min_items and max_items values",
    path: ["products"],
});

export type AdminCreateFeaturedCollectionType = z.infer<typeof AdminCreateFeaturedCollection>;
export type AdminUpdateFeaturedCollection = z.infer<typeof AdminCreateFeaturedCollection>;