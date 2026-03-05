import { model } from '@medusajs/framework/utils'

import { CollectionMedia } from './collection-media';

export const CollectionDetail = model.define('collection_detail', {
    id: model.id({ prefix: 'coll_det' }).primaryKey(),
    media: model.hasMany(() => CollectionMedia, { mappedBy: 'collection_detail' }),
    thumbnail_id: model.text().nullable(),
    icon_id: model.text().nullable(),
    banner_id: model.text().nullable(),
    rank: model.number().default(0),
}).cascades({
    delete: ['media']
})
