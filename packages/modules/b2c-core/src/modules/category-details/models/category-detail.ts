import { model } from '@medusajs/framework/utils'

import { CategoryMedia } from './category-media';

export const CategoryDetail = model.define('category_detail', {
    id: model.id({ prefix: 'cat_det' }).primaryKey(),
    media: model.hasMany(() => CategoryMedia, { mappedBy: 'category_detail' }),
    thumbnail_id: model.text().nullable(),
    icon_id: model.text().nullable(),
    banner_id: model.text().nullable(),
}).cascades({
    delete: ['media']
})

