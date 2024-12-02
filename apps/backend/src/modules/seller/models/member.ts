import { model } from '@medusajs/framework/utils'

import { MemberRole } from '@mercurjs/types'

import { Seller } from './seller'

export const Member = model.define('member', {
  id: model.id({ prefix: 'mem' }).primaryKey(),
  email: model.text().searchable().unique(),
  role: model.enum(MemberRole).default(MemberRole.OWNER),
  name: model.text().searchable(),
  bio: model.text().searchable().nullable(),
  phone: model.text().searchable().nullable(),
  photo: model.text().nullable(),
  seller: model.belongsTo(() => Seller, { mappedBy: 'members' })
})
