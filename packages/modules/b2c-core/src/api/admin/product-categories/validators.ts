import { createFindParams } from "@medusajs/medusa/api/utils/validators";
import { z } from "zod";

const MediaSchema = z.union([
    z.object({
        url: z.string(),
        alt_text: z.string().optional(),
    }),
    z.string().startsWith('cat_med'),
]);

export type UpdateCategoryDetailType = z.infer<typeof UpdateCategoryDetail>;
export const UpdateCategoryDetail = z.object({
    media: z.object({
        create: z.array(MediaSchema).default([]),
        delete: z.array(z.string()).default([]),
    }),
    thumbnail: MediaSchema.optional(),
    icon: MediaSchema.optional(),
    banner: MediaSchema.optional(),
});

export type GetCategoriesParams = z.infer<typeof GetCategoriesParams>;
export const GetCategoriesParams = createFindParams();

