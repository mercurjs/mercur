
export const defaultAdminCategoryDetailFields = [
    'id',
    'media',
    'media.id',
    'media.url',
    'media.alt_text',
    'thumbnail_id',
    'icon_id',
    'banner_id',
];

export const categoriesQueryConfig = {
    list: {
        defaults: defaultAdminCategoryDetailFields,
        isList: true,
    },
    retrieve: {
        defaults: defaultAdminCategoryDetailFields,
        isList: false,
    }
}

