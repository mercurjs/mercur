import { model } from '@medusajs/framework/utils'

import { Invite } from './invite'
import { Member } from './member'
import { Onboarding } from './onboarding'

export const Seller = model.define('seller', {
  id: model.id({ prefix: 'sel' }).primaryKey(),
  name: model.text().searchable(),
  handle: model.text().unique(),
  description: model.text().searchable().nullable(),
  photo: model.text().nullable(),
  members: model.hasMany(() => Member),
  invites: model.hasMany(() => Invite),
  onboarding: model.hasOne(() => Onboarding)
})
