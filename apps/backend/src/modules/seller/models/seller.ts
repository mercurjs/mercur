import { model } from '@medusajs/framework/utils'

import { Invite } from './invite'
import { Member } from './member'

export const Seller = model.define('seller', {
  id: model.id({ prefix: 'sel' }).primaryKey(),
  name: model.text().searchable(),
  handle: model.text().unique(),
  description: model.text().searchable().nullable(),
  photo: model.text().nullable(),
  address_line: model.text().nullable(),
  city: model.text().nullable(),
  postal_code: model.text().nullable(),
  country_code: model.text().nullable(),
  tax_id: model.text().nullable(),
  members: model.hasMany(() => Member),
  invites: model.hasMany(() => Invite)
})
