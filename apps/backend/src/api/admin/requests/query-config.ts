export const adminRequestsFields = [
  'id',
  'type',
  'data',
  'submitter_id',
  'reviewer_id',
  'reviewer_note',
  'status',
  'seller.*',
  'created_at',
  'updated_at'
]

export const adminRequestsConfig = {
  list: {
    defaults: adminRequestsFields,
    isList: true
  },
  retrieve: {
    defaults: adminRequestsFields,
    isList: false
  }
}
