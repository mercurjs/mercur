export const vendorRequestsFields = [
  'id',
  'type',
  'data',
  'submitter_id',
  'reviewer_id',
  'reviewer_note',
  'status',
  'created_at',
  'updated_at'
]

export const vendorRequestsConfig = {
  list: {
    defaults: vendorRequestsFields,
    isList: true
  },
  retrieve: {
    defaults: vendorRequestsFields,
    isList: false
  }
}
