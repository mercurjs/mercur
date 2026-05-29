import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

/**
 * SPEC-008 step 3 — drop Mercur product module override.
 *
 * Single idempotent, dry-runnable script that:
 *
 *  Pass A — pre-link `ALTER TABLE` on three legacy pivots so the new
 *           `product-attribute` Module Links can attach to them with
 *           Medusa's standard link metadata (`id` PK + timestamps +
 *           partial UNIQUE on the FK pair).
 *  Pass B — `ProductBrand` rows → category-scoped `ProductAttribute`
 *           (`handle = "brand"`, `type = SINGLE_SELECT`) +
 *           `ProductAttributeValue` rows + `product_attribute_value_link`
 *           rows for every product that had a `brand_id` set.
 *  Pass C — `ProductAttribute WHERE product_id IS NOT NULL` (custom
 *           attributes) → stock Medusa `ProductOption` /
 *           `ProductOptionValue` rows on the owning product. Guarded
 *           by an `IF EXISTS (product_option)` check so the pass is
 *           a no-op until the stock product module is registered
 *           (step 5 of SPEC-008's "Order of operations").
 *  Pass D — `Product.status = 'requires_action'` → `status = 'proposed'`
 *           plus a `ProductChange` row with `status = 'REQUIRES_ACTION'`,
 *           so the computed `Product.requires_action` boolean lights up
 *           post-cutover.
 *
 * Run via `medusa exec ./src/migration-scripts/migrate-product-module-split.ts`.
 * Pass `--check` to perform a dry run that only reports row counts.
 */

type LoggerLike = {
  info: (message: string) => void
  warn: (message: string) => void
  error: (message: string) => void
}

type RawResult<TRow = Record<string, unknown>> = {
  rows: TRow[]
}

type KnexLike = {
  raw: <TRow = Record<string, unknown>>(
    sql: string,
    bindings?: unknown[],
  ) => Promise<RawResult<TRow>>
}

type PivotShape = {
  table: string
  fkA: string
  fkB: string
}

const LEGACY_PIVOTS: PivotShape[] = [
  {
    table: "product_attribute_value_link",
    fkA: "product_id",
    fkB: "product_attribute_value_id",
  },
  {
    table: "product_variant_attribute_value",
    fkA: "product_attribute_value_id",
    fkB: "product_variant_id",
  },
  {
    table: "product_variant_attribute",
    fkA: "product_attribute_id",
    fkB: "product_id",
  },
]

const BRAND_ATTRIBUTE_ID = "pattr_brand"
const BRAND_ATTRIBUTE_HANDLE = "brand"
const BRAND_ATTRIBUTE_NAME = "Brand"
const BRAND_ATTRIBUTE_TYPE = "single_select"

export default async function migrateProductModuleSplit({
  container,
  args,
}: ExecArgs) {
  const logger = container.resolve(
    ContainerRegistrationKeys.LOGGER,
  ) as LoggerLike
  const knex = container.resolve(
    ContainerRegistrationKeys.PG_CONNECTION,
  ) as KnexLike
  const dryRun = (args ?? []).includes("--check")

  logger.info(
    dryRun
      ? "[migrate-product-module-split] --check (dry-run): no writes will be issued"
      : "[migrate-product-module-split] applying SPEC-008 step 3 (pre-link ALTERs + data migration)",
  )

  await applyPreLinkPivotShape({ knex, logger, dryRun })
  await migrateBrandsToAttributes({ knex, logger, dryRun })
  await migrateCustomAttributesToOptions({ knex, logger, dryRun })
  await restampRequiresActionProducts({ knex, logger, dryRun })

  logger.info("[migrate-product-module-split] complete")
}

// ---------------------------------------------------------------------------
// Pass A: pre-link ALTER TABLE on the three composite-PK legacy pivots
// ---------------------------------------------------------------------------

type PassArgs = {
  knex: KnexLike
  logger: LoggerLike
  dryRun: boolean
}

async function applyPreLinkPivotShape({ knex, logger, dryRun }: PassArgs) {
  logger.info("[A] pre-link pivot shape")

  for (const pivot of LEGACY_PIVOTS) {
    const present = await tableExists(knex, pivot.table)
    if (!present) {
      logger.info(`  - ${pivot.table}: missing, skipping`)
      continue
    }

    const hasId = await columnExists(knex, pivot.table, "id")
    const hasCreatedAt = await columnExists(knex, pivot.table, "created_at")
    const hasUpdatedAt = await columnExists(knex, pivot.table, "updated_at")
    const hasDeletedAt = await columnExists(knex, pivot.table, "deleted_at")
    const pkIsOnId = await primaryKeyMatches(knex, pivot.table, ["id"])
    const uniqueName = `${pivot.table}_pair_unique`
    const hasUniqueIndex = await indexExists(knex, uniqueName)

    logger.info(
      `  - ${pivot.table}: id=${hasId}, created_at=${hasCreatedAt}, updated_at=${hasUpdatedAt}, deleted_at=${hasDeletedAt}, pk_on_id=${pkIsOnId}, pair_unique=${hasUniqueIndex}`,
    )

    if (dryRun) {
      continue
    }

    // 1. Add columns if missing. The id column needs special handling
    //    because we have to backfill before adding NOT NULL.
    if (!hasId) {
      await knex.raw(`ALTER TABLE "${pivot.table}" ADD COLUMN "id" text`)
      await knex.raw(
        `UPDATE "${pivot.table}" SET "id" = gen_random_uuid()::text WHERE "id" IS NULL`,
      )
      await knex.raw(
        `ALTER TABLE "${pivot.table}" ALTER COLUMN "id" SET NOT NULL`,
      )
      await knex.raw(
        `ALTER TABLE "${pivot.table}" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text`,
      )
    }

    if (!hasCreatedAt) {
      await knex.raw(
        `ALTER TABLE "${pivot.table}" ADD COLUMN "created_at" timestamptz NOT NULL DEFAULT now()`,
      )
    }
    if (!hasUpdatedAt) {
      await knex.raw(
        `ALTER TABLE "${pivot.table}" ADD COLUMN "updated_at" timestamptz NOT NULL DEFAULT now()`,
      )
    }
    if (!hasDeletedAt) {
      await knex.raw(
        `ALTER TABLE "${pivot.table}" ADD COLUMN "deleted_at" timestamptz NULL`,
      )
    }

    // 2. Swap composite PK for an id PK if not already on id.
    if (!pkIsOnId) {
      await knex.raw(`
        DO $$
        BEGIN
          IF EXISTS (
            SELECT 1 FROM pg_constraint
            WHERE conrelid = '"${pivot.table}"'::regclass AND contype = 'p'
          ) THEN
            EXECUTE 'ALTER TABLE "${pivot.table}" DROP CONSTRAINT ' ||
              quote_ident((
                SELECT conname FROM pg_constraint
                WHERE conrelid = '"${pivot.table}"'::regclass AND contype = 'p'
                LIMIT 1
              ));
          END IF;
        END $$;
      `)
      await knex.raw(
        `ALTER TABLE "${pivot.table}" ADD PRIMARY KEY ("id")`,
      )
    }

    // 3. Partial UNIQUE on the FK pair preserves the legacy dedup
    //    invariant while allowing soft-delete + recreate.
    if (!hasUniqueIndex) {
      await knex.raw(
        `CREATE UNIQUE INDEX IF NOT EXISTS "${uniqueName}" ON "${pivot.table}" ("${pivot.fkA}", "${pivot.fkB}") WHERE "deleted_at" IS NULL`,
      )
    }
  }
}

// ---------------------------------------------------------------------------
// Pass B: ProductBrand → category-scoped ProductAttribute
// ---------------------------------------------------------------------------

async function migrateBrandsToAttributes({ knex, logger, dryRun }: PassArgs) {
  logger.info("[B] brand → attribute")

  if (!(await tableExists(knex, "product_brand"))) {
    logger.info("  product_brand table missing, skipping")
    return
  }

  const { rows: brandRows } = await knex.raw<{
    id: string
    name: string
    handle: string
  }>(
    `SELECT id, name, handle FROM product_brand WHERE deleted_at IS NULL`,
  )
  const { rows: linkedProductsRow } = await knex.raw<{ count: string }>(
    `SELECT count(*)::text AS count FROM product WHERE brand_id IS NOT NULL AND deleted_at IS NULL`,
  )
  const linkedProducts = Number(linkedProductsRow[0]?.count ?? 0)

  logger.info(
    `  ${brandRows.length} brand rows; ${linkedProducts} product.brand_id assignments to migrate`,
  )

  if (dryRun || brandRows.length === 0) {
    return
  }

  // 1. Ensure the canonical `brand` ProductAttribute row exists. We use
  //    a fixed id so re-runs converge on the same attribute regardless
  //    of whether one already existed at the spec's reserved handle.
  await knex.raw(
    `
    INSERT INTO product_attribute
      (id, handle, name, type, is_required, is_filterable, is_variant_axis, rank, is_active, created_at, updated_at)
    SELECT $1, $2, $3, $4, false, true, false, 0, true, now(), now()
    WHERE NOT EXISTS (
      SELECT 1 FROM product_attribute
      WHERE handle = $2 AND deleted_at IS NULL
    )
  `,
    [
      BRAND_ATTRIBUTE_ID,
      BRAND_ATTRIBUTE_HANDLE,
      BRAND_ATTRIBUTE_NAME,
      BRAND_ATTRIBUTE_TYPE,
    ],
  )

  const { rows: attrIdRows } = await knex.raw<{ id: string }>(
    `SELECT id FROM product_attribute WHERE handle = $1 AND deleted_at IS NULL LIMIT 1`,
    [BRAND_ATTRIBUTE_HANDLE],
  )
  const brandAttributeId = attrIdRows[0]?.id
  if (!brandAttributeId) {
    logger.warn("  could not resolve brand ProductAttribute id; aborting Pass B")
    return
  }

  // 2. Create a ProductAttributeValue per legacy ProductBrand (idempotent
  //    by `(attribute_id, handle)` — covered by the partial unique index
  //    `IDX_product_attribute_value_handle_unique`).
  await knex.raw(
    `
    INSERT INTO product_attribute_value
      (id, handle, name, rank, is_active, attribute_id, created_at, updated_at)
    SELECT
      'pattrval_brand_' || replace(gen_random_uuid()::text, '-', ''),
      pb.handle,
      pb.name,
      0,
      true,
      $1,
      now(),
      now()
    FROM product_brand pb
    WHERE pb.deleted_at IS NULL
      AND NOT EXISTS (
        SELECT 1 FROM product_attribute_value pav
        WHERE pav.attribute_id = $1
          AND pav.handle = pb.handle
          AND pav.deleted_at IS NULL
      )
  `,
    [brandAttributeId],
  )

  // 3. Link every product.brand_id to the corresponding ProductAttributeValue.
  //    The partial unique on `(product_id, product_attribute_value_id)` (added
  //    by Pass A) prevents duplicate live rows on re-run.
  const linkResult = await knex.raw<{ inserted: string }>(
    `
    WITH inserted AS (
      INSERT INTO product_attribute_value_link
        (id, product_id, product_attribute_value_id, created_at, updated_at)
      SELECT
        gen_random_uuid()::text,
        p.id,
        pav.id,
        now(),
        now()
      FROM product p
      JOIN product_brand pb ON pb.id = p.brand_id AND pb.deleted_at IS NULL
      JOIN product_attribute_value pav
        ON pav.attribute_id = $1
        AND pav.handle = pb.handle
        AND pav.deleted_at IS NULL
      WHERE p.brand_id IS NOT NULL
        AND p.deleted_at IS NULL
        AND NOT EXISTS (
          SELECT 1 FROM product_attribute_value_link existing
          WHERE existing.product_id = p.id
            AND existing.product_attribute_value_id = pav.id
            AND existing.deleted_at IS NULL
        )
      RETURNING 1
    )
    SELECT count(*)::text AS inserted FROM inserted
  `,
    [brandAttributeId],
  )

  logger.info(
    `  inserted ${linkResult.rows[0]?.inserted ?? "0"} product_attribute_value_link rows (brand)`,
  )
}

// ---------------------------------------------------------------------------
// Pass C: custom_attributes → stock ProductOption / ProductOptionValue
// ---------------------------------------------------------------------------

async function migrateCustomAttributesToOptions({
  knex,
  logger,
  dryRun,
}: PassArgs) {
  logger.info("[C] custom_attributes → stock options")

  const stockOptionTable = await tableExists(knex, "product_option")
  const stockOptionValueTable = await tableExists(knex, "product_option_value")
  if (!stockOptionTable || !stockOptionValueTable) {
    logger.info(
      "  product_option / product_option_value tables not present yet — pass skipped (re-run after the SPEC-008 step-5 module-registration swap so stock Medusa creates them)",
    )
    return
  }

  if (!(await columnExists(knex, "product_attribute", "product_id"))) {
    logger.info(
      "  product_attribute.product_id already dropped — Pass C has nothing to do",
    )
    return
  }

  const { rows: customAttrRows } = await knex.raw<{
    attr_id: string
    product_id: string
    name: string
    value_count: string
  }>(
    `
    SELECT
      pa.id           AS attr_id,
      pa.product_id   AS product_id,
      pa.name         AS name,
      (
        SELECT count(*)::text FROM product_attribute_value pav
        WHERE pav.attribute_id = pa.id AND pav.deleted_at IS NULL
      ) AS value_count
    FROM product_attribute pa
    WHERE pa.product_id IS NOT NULL
      AND pa.deleted_at IS NULL
    ORDER BY pa.product_id, pa.rank, pa.id
  `,
  )

  logger.info(
    `  ${customAttrRows.length} custom ProductAttribute rows to convert`,
  )

  if (dryRun) {
    const skipped = customAttrRows.filter((r) => Number(r.value_count) === 0)
    if (skipped.length) {
      logger.warn(
        `  ${skipped.length} attributes have no values and would be skipped (logged for operator review)`,
      )
    }
    return
  }

  let optionsCreated = 0
  let valuesCreated = 0
  let skippedNoValue = 0

  for (const row of customAttrRows) {
    if (Number(row.value_count) === 0) {
      logger.warn(
        `  skipping ProductAttribute ${row.attr_id} (product ${row.product_id}): no resolvable values`,
      )
      skippedNoValue++
      continue
    }

    const { rows: existing } = await knex.raw<{ id: string }>(
      `
      SELECT id FROM product_option
      WHERE product_id = $1 AND title = $2 AND deleted_at IS NULL
      LIMIT 1
    `,
      [row.product_id, row.name],
    )

    let optionId = existing[0]?.id
    if (!optionId) {
      const { rows: created } = await knex.raw<{ id: string }>(
        `
        INSERT INTO product_option (id, title, product_id, created_at, updated_at)
        VALUES (
          'opt_' || replace(gen_random_uuid()::text, '-', ''),
          $2,
          $1,
          now(),
          now()
        )
        RETURNING id
      `,
        [row.product_id, row.name],
      )
      optionId = created[0]?.id
      if (optionId) {
        optionsCreated++
      }
    }
    if (!optionId) {
      logger.error(
        `  failed to create/resolve ProductOption for attribute ${row.attr_id}`,
      )
      continue
    }

    const inserted = await knex.raw<{ inserted: string }>(
      `
      WITH inserted AS (
        INSERT INTO product_option_value (id, value, option_id, created_at, updated_at)
        SELECT
          'optval_' || replace(gen_random_uuid()::text, '-', ''),
          pav.name,
          $2,
          now(),
          now()
        FROM product_attribute_value pav
        WHERE pav.attribute_id = $1
          AND pav.deleted_at IS NULL
          AND NOT EXISTS (
            SELECT 1 FROM product_option_value existing
            WHERE existing.option_id = $2
              AND existing.value = pav.name
              AND existing.deleted_at IS NULL
          )
        RETURNING 1
      )
      SELECT count(*)::text AS inserted FROM inserted
    `,
      [row.attr_id, optionId],
    )
    valuesCreated += Number(inserted.rows[0]?.inserted ?? 0)
  }

  // Delete the converted legacy rows. We only delete attributes that have
  // a matching stock option, so partial completions can resume safely.
  await knex.raw(`
    DELETE FROM product_attribute_value pav
    USING product_attribute pa
    WHERE pav.attribute_id = pa.id
      AND pa.product_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM product_option po
        WHERE po.product_id = pa.product_id
          AND po.title = pa.name
          AND po.deleted_at IS NULL
      )
  `)
  await knex.raw(`
    DELETE FROM product_attribute pa
    WHERE pa.product_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM product_option po
        WHERE po.product_id = pa.product_id
          AND po.title = pa.name
          AND po.deleted_at IS NULL
      )
  `)

  // Finally, drop the legacy `product_id` column once every custom row is
  // gone. Guarded so a partial re-run doesn't leave behind an orphan column.
  const { rows: leftoverRows } = await knex.raw<{ count: string }>(
    `SELECT count(*)::text AS count FROM product_attribute WHERE product_id IS NOT NULL`,
  )
  if (Number(leftoverRows[0]?.count ?? 0) === 0) {
    await knex.raw(
      `ALTER TABLE product_attribute DROP COLUMN IF EXISTS product_id`,
    )
    logger.info("  dropped product_attribute.product_id column")
  } else {
    logger.warn(
      `  product_attribute.product_id still has ${leftoverRows[0]?.count} non-null rows (skipped attributes); leaving column in place`,
    )
  }

  logger.info(
    `  options created=${optionsCreated}, option_values created=${valuesCreated}, skipped=${skippedNoValue}`,
  )
}

// ---------------------------------------------------------------------------
// Pass D: Product.status='requires_action' re-stamp
// ---------------------------------------------------------------------------

async function restampRequiresActionProducts({
  knex,
  logger,
  dryRun,
}: PassArgs) {
  logger.info("[D] requires_action re-stamp")

  if (!(await tableExists(knex, "product_change"))) {
    logger.info("  product_change table missing, skipping")
    return
  }

  const { rows: productRows } = await knex.raw<{ id: string }>(
    `SELECT id FROM product WHERE status = 'requires_action' AND deleted_at IS NULL`,
  )

  logger.info(
    `  ${productRows.length} product rows with status='requires_action'`,
  )

  if (dryRun || productRows.length === 0) {
    return
  }

  // Insert a REQUIRES_ACTION ProductChange row per product, idempotent on
  // (product_id) so re-runs don't pile up duplicate REQUIRES_ACTION rows.
  await knex.raw(
    `
    INSERT INTO product_change
      (id, product_id, status, requires_action_at, created_at, updated_at)
    SELECT
      'prodch_' || replace(gen_random_uuid()::text, '-', ''),
      p.id,
      'requires_action',
      now(),
      now(),
      now()
    FROM product p
    WHERE p.status = 'requires_action'
      AND p.deleted_at IS NULL
      AND NOT EXISTS (
        SELECT 1 FROM product_change pc
        WHERE pc.product_id = p.id
          AND pc.status = 'requires_action'
          AND pc.deleted_at IS NULL
      )
  `,
  )

  // Re-stamp the product status to 'proposed' so the stock product enum
  // shape (without the marketplace-only value) holds post-cutover.
  const updated = await knex.raw<{ updated: string }>(
    `
    WITH updated AS (
      UPDATE product
      SET status = 'proposed', updated_at = now()
      WHERE status = 'requires_action' AND deleted_at IS NULL
      RETURNING 1
    )
    SELECT count(*)::text AS updated FROM updated
  `,
  )

  logger.info(
    `  re-stamped ${updated.rows[0]?.updated ?? "0"} product rows; inserted matching ProductChange rows`,
  )
}

// ---------------------------------------------------------------------------
// Information-schema helpers (idempotency probes)
// ---------------------------------------------------------------------------

async function tableExists(knex: KnexLike, table: string): Promise<boolean> {
  const { rows } = await knex.raw<{ exists: boolean }>(
    `
    SELECT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_name = $1
    ) AS exists
  `,
    [table],
  )
  return Boolean(rows[0]?.exists)
}

async function columnExists(
  knex: KnexLike,
  table: string,
  column: string,
): Promise<boolean> {
  const { rows } = await knex.raw<{ exists: boolean }>(
    `
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = $1 AND column_name = $2
    ) AS exists
  `,
    [table, column],
  )
  return Boolean(rows[0]?.exists)
}

async function indexExists(knex: KnexLike, indexName: string): Promise<boolean> {
  const { rows } = await knex.raw<{ exists: boolean }>(
    `
    SELECT EXISTS (
      SELECT 1 FROM pg_indexes WHERE indexname = $1
    ) AS exists
  `,
    [indexName],
  )
  return Boolean(rows[0]?.exists)
}

async function primaryKeyMatches(
  knex: KnexLike,
  table: string,
  columns: string[],
): Promise<boolean> {
  const { rows } = await knex.raw<{ columns: string[] }>(
    `
    SELECT array_agg(a.attname ORDER BY a.attnum) AS columns
    FROM pg_index i
    JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
    WHERE i.indrelid = $1::regclass AND i.indisprimary
  `,
    [`"${table}"`],
  )
  const actual = rows[0]?.columns ?? []
  if (actual.length !== columns.length) {
    return false
  }
  return actual.every((col, idx) => col === columns[idx])
}
