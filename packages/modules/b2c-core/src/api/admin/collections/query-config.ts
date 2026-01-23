import { defaultAdminCollectionFields } from "@medusajs/medusa/api/admin/collections/query-config";

export const defaultAdminCollectionDetailFields = [
    'id',
    'media',
    'media.id',
    'media.url',
    'media.alt_text',
    'thumbnail_id',
    'icon_id',
    'banner_id',
    'rank',
];

export const collectionsQueryConfig = {
    list: {
        defaults: defaultAdminCollectionFields,
        isList: true,
    },
    retrieve: {
        defaults: defaultAdminCollectionFields,
        isList: false,
    }
}