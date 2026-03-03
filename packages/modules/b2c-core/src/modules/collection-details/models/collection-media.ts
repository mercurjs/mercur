import { model } from '@medusajs/framework/utils'
import { CollectionDetail } from './collection-detail'

export const CollectionMedia = model.define('collection_media', {
    id: model.id({ prefix: 'coll_med' }).primaryKey(),
    collection_detail: model.belongsTo(() => CollectionDetail, { mappedBy: 'media' }).nullable(),
    url: model.text(),
    alt_text: model.text().nullable(),
})
