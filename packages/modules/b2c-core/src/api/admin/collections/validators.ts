import { createFindParams } from "@medusajs/medusa/api/utils/validators";
import { z } from "zod";

const MediaSchema = z.union([
    z.object({
        url: z.string(),
        alt_text: z.string().optional(),
    }),
    z.string(),
]);

export type UpdateCollectionDetailType = z.infer<typeof UpdateCollectionDetail>;
export const UpdateCollectionDetail = z.object({
    media: z.object({
        create: z.array(MediaSchema).default([]),
        delete: z.array(z.string()).default([]),
    }),
    thumbnail: MediaSchema.optional(),
    icon: MediaSchema.optional(),
    banner: MediaSchema.optional(),
    rank: z.number().optional(),
});

export type GetCollectionsParams = z.infer<typeof GetCollectionsParams>;
export const GetCollectionsParams = createFindParams();
