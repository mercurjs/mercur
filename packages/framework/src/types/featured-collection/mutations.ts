export interface CreateFeaturedCollectionDTO {
    name: string;
    handle?: string;
    min_items: number;
    max_items: number;
    is_active: boolean;
    products: FeaturedCollectionProductDTO[];
}

export interface FeaturedCollectionProductDTO {
    product_id: string;
    position: number;
}

export interface UpdateFeaturedCollectionDTO extends CreateFeaturedCollectionDTO {
    id: string;
}