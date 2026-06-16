export const COMMISSIONS_PAGE_SIZE = 20;

export const COMMISSION_RATE_FIELDS = [
  "id",
  "name",
  "code",
  "type",
  "value",
  "currency_code",
  "include_tax",
  "include_shipping",
  "is_enabled",
  "is_default",
  "created_at",
  "updated_at",
  "*rules",
  "*values",
].join(",");
