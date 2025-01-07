import { model } from '@medusajs/framework/utils'

import { Invite } from './invite'
import { Member } from './member'

export const Seller = model.define('seller', {
  id: model.id({ prefix: 'sel' }).primaryKey(),
  email: model.text(),
  name: model.text().searchable(),
  lastName: model.text(),
  shopName: model.text(),
  address1: model.text(),
  address2: model.text(),
  zip: model.text(),
  city: model.text(),
  country: model.text(),
  phone: model.text(),
  status: model.text(),
  handle: model.text().unique(),
  description: model.text().searchable().nullable(),
  photo: model.text().nullable(),
  members: model.hasMany(() => Member),
  invites: model.hasMany(() => Invite)
})
