import { model } from '@medusajs/framework/utils'

import { CategoryDetail } from './category-detail'

export const CategoryMedia = model.define('category_media', {
    id: model.id({ prefix: 'cat_med' }).primaryKey(),
    category_detail: model.belongsTo(() => CategoryDetail, { mappedBy: 'media' }).nullable(),
    url: model.text(),
    alt_text: model.text().nullable(),
})

