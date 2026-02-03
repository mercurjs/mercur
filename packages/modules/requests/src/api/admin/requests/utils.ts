import type { MedusaContainer } from '@medusajs/framework';
import { ContainerRegistrationKeys } from '@medusajs/framework/utils';

const LINK_TABLE = 'seller_seller_requests_request' as const;

function escapeLikePattern(q: string): string {
  return `%${q.replace(/%/g, '\\%').replace(/_/g, '\\_')}%`;
}

/**
 * Returns request IDs to use as an id filter for the admin list:
 * - When only seller_id: requests linked to that vendor.
 * - When only q: requests whose vendor name or data title/name matches.
 * - When both: intersection (requests for that vendor matching the search).
 * Uses at most one raw SQL query to minimize DB round-trips.
 */
export async function getRequestIdsForAdminList(
  scope: MedusaContainer,
  opts: { seller_id?: string; q?: string }
): Promise<string[] | null> {
  const { seller_id, q } = opts;
  const hasSeller = !!seller_id?.trim();
  const hasSearch = !!q?.trim();

  if (!hasSeller && !hasSearch) return null;

  const knex = scope.resolve(ContainerRegistrationKeys.PG_CONNECTION);

  if (hasSeller && !hasSearch) {
    const result = await knex.raw(
      `SELECT request_id FROM ?? WHERE seller_id = ? AND deleted_at IS NULL`,
      [LINK_TABLE, seller_id]
    );
    const rows = result?.rows ?? [];
    return rows
      .map((r: { request_id: string }) => r.request_id)
      .filter(Boolean);
  }

  const pattern = hasSearch ? escapeLikePattern(q!) : null;

  if (!hasSeller && hasSearch) {
    const result = await knex.raw(
      `SELECT DISTINCT r.id
       FROM request r
       LEFT JOIN ?? sr ON sr.request_id = r.id AND sr.deleted_at IS NULL
       LEFT JOIN seller s ON s.id = sr.seller_id AND s.deleted_at IS NULL
       WHERE r.deleted_at IS NULL
         AND (r.data->>'title' ILIKE ? OR r.data->>'name' ILIKE ? OR s.name ILIKE ?)`,
      [LINK_TABLE, pattern, pattern, pattern]
    );
    const rows = result?.rows ?? [];
    return rows.map((r: { id: string }) => r.id).filter(Boolean);
  }

  const result = await knex.raw(
    `SELECT DISTINCT r.id
     FROM request r
     INNER JOIN ?? sr ON sr.request_id = r.id AND sr.deleted_at IS NULL AND sr.seller_id = ?
     LEFT JOIN seller s ON s.id = sr.seller_id AND s.deleted_at IS NULL
     WHERE r.deleted_at IS NULL
       AND (r.data->>'title' ILIKE ? OR r.data->>'name' ILIKE ? OR s.name ILIKE ?)`,
    [LINK_TABLE, seller_id, pattern, pattern, pattern]
  );
  const rows = result?.rows ?? [];
  return rows.map((r: { id: string }) => r.id).filter(Boolean);
}
