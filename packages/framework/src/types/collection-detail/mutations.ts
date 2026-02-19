export type CollectionMediaInput = {
    url: string;
    alt_text: string | null;
}

export type CreateCollectionDetailDTO = {
    media: CollectionMediaInput[];
    thumbnail_id: string | null;
    icon_id: string | null;
    banner_id: string | null;
    rank: number;
}

export type UpdateCollectionDetailDTO = {
    media: {
        create: CollectionMediaInput[];
        delete: string[];
    },
    thumbnail?: CollectionMediaInput | string | null;
    icon?: CollectionMediaInput | string | null;
    banner?: CollectionMediaInput | string | null;
    rank?: number;
}