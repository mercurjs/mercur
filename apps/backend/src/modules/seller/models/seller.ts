import { model } from '@medusajs/framework/utils'

import { MemberInvite } from './invite'
import { Member } from './member'
import { Onboarding } from './onboarding'

export const Seller = model.define('seller', {
  id: model.id({ prefix: 'sel' }).primaryKey(),
  name: model.text().searchable(),
  handle: model.text().unique(),
  description: model.text().searchable().nullable(),
  photo: model.text().nullable(),
  email: model.text().nullable(),
  phone: model.text().nullable(),
  address_line: model.text().nullable(),
  city: model.text().nullable(),
  state: model.text().nullable(),
  postal_code: model.text().nullable(),
  country_code: model.text().nullable(),
  tax_id: model.text().nullable(),
  members: model.hasMany(() => Member),
  invites: model.hasMany(() => MemberInvite),
  onboarding: model.hasOne(() => Onboarding)
})
