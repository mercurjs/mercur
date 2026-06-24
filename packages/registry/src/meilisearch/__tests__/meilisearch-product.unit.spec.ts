import {
  filterProductsByStatus,
  findAndTransformMeilisearchProducts,
} from '../subscribers/utils/meilisearch-product'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

// ─── Container factory ────────────────────────────────────────────────────────

function makeContainer(queryGraphResult: any[]) {
  const mockGraph = jest.fn().mockResolvedValue({ data: queryGraphResult })
  return {
    resolve: jest.fn().mockReturnValue({ graph: mockGraph }),
    _graph: mockGraph,
  }
}

// ─── filterProductsByStatus ───────────────────────────────────────────────────

describe('filterProductsByStatus', () => {
  it('splits ids into published and other (draft)', async () => {
    const container = makeContainer([
      { id: 'prod_1', status: 'published' },
      { id: 'prod_2', status: 'draft' },
    ]) as any

    const result = await filterProductsByStatus(container, ['prod_1', 'prod_2'])

    expect(result.published).toEqual(['prod_1'])
    expect(result.other).toContain('prod_2')
  })

  it('puts proposed and rejected statuses in other', async () => {
    const container = makeContainer([
      { id: 'prod_1', status: 'proposed' },
      { id: 'prod_2', status: 'rejected' },
    ]) as any

    const result = await filterProductsByStatus(container, ['prod_1', 'prod_2'])

    expect(result.published).toHaveLength(0)
    expect(result.other).toEqual(expect.arrayContaining(['prod_1', 'prod_2']))
  })

  it('includes ids not found in DB in other (soft-deleted / removed)', async () => {
    const container = makeContainer([
      { id: 'prod_1', status: 'published' },
      // prod_ghost is missing from DB response
    ]) as any

    const result = await filterProductsByStatus(container, ['prod_1', 'prod_ghost'])

    expect(result.published).toEqual(['prod_1'])
    expect(result.other).toContain('prod_ghost')
  })

  it('returns empty arrays when given an empty id list', async () => {
    const container = makeContainer([]) as any
    const result = await filterProductsByStatus(container, [])

    expect(result.published).toHaveLength(0)
    expect(result.other).toHaveLength(0)
  })

  it('resolves the QUERY key from the container', async () => {
    const container = makeContainer([]) as any
    await filterProductsByStatus(container, [])

    expect(container.resolve).toHaveBeenCalledWith(ContainerRegistrationKeys.QUERY)
  })
})

// ─── findAndTransformMeilisearchProducts ─────────────────────────────────────

const baseVariant = {
  id: 'var_1',
  title: 'Default',
  sku: null,
  barcode: null,
  ean: null,
  allow_backorder: false,
  manage_inventory: true,
  weight: null,
  length: null,
  height: null,
  width: null,
  variant_rank: 0,
  options: [
    {
      id: 'opt_val_1',
      value: 'S',
      option: { id: 'opt_1', title: 'Size' },
    },
  ],
  prices: [
    {
      id: 'price_1',
      currency_code: 'usd',
      amount: 49.99,
      min_quantity: null,
      max_quantity: null,
      rules_count: 0,
    },
  ],
}

const baseProduct = {
  id: 'prod_1',
  title: 'Running Shoes',
  handle: 'running-shoes',
  subtitle: null,
  description: 'Great shoes',
  thumbnail: null,
  status: 'published',
  categories: [{ id: 'cat_1', name: 'Footwear' }],
  tags: [{ value: 'sports' }],
  collection: null,
  type: null,
  images: [],
  options: [
    {
      title: 'Size',
      values: [{ value: 'S' }, { value: 'M' }],
    },
  ],
  variants: [baseVariant],
  sellers: [
    {
      id: 'sel_1',
      handle: 'acme-store',
      name: 'ACME',
      status: 'open',
    },
  ],
}

describe('findAndTransformMeilisearchProducts', () => {
  it('makes exactly ONE query.graph call (no N+1)', async () => {
    const container = makeContainer([baseProduct]) as any

    await findAndTransformMeilisearchProducts(container, ['prod_1'])

    expect(container._graph).toHaveBeenCalledTimes(1)
  })

  it('includes seller fields in the single query.graph call', async () => {
    const container = makeContainer([baseProduct]) as any

    await findAndTransformMeilisearchProducts(container, ['prod_1'])

    const callArgs = container._graph.mock.calls[0][0]
    expect(callArgs.fields).toEqual(
      expect.arrayContaining(['sellers.id', 'sellers.handle', 'sellers.name', 'sellers.status'])
    )
  })

  it('returns valid MeilisearchProduct-shaped documents', async () => {
    const container = makeContainer([baseProduct]) as any

    const result = await findAndTransformMeilisearchProducts(container, ['prod_1'])

    expect(result).toHaveLength(1)
    const doc = result[0]!
    expect(doc.id).toBe('prod_1')
    expect(doc.title).toBe('Running Shoes')
    expect(doc.seller).toMatchObject({ id: 'sel_1', handle: 'acme-store', status: 'open' })
  })

  it('flattens the sellers array (many-to-many link) to a single seller object', async () => {
    const container = makeContainer([
      {
        ...baseProduct,
        sellers: [
          { id: 'sel_1', handle: 'acme-store', name: 'ACME', status: 'open' },
        ],
      },
    ]) as any

    const result = await findAndTransformMeilisearchProducts(container, ['prod_1'])

    const doc = result[0]!
    expect(Array.isArray(doc.seller)).toBe(false)
    expect(doc.seller).toMatchObject({ id: 'sel_1', status: 'open' })
  })

  it('sets seller to null when the sellers array is empty', async () => {
    const container = makeContainer([{ ...baseProduct, sellers: [] }]) as any

    const result = await findAndTransformMeilisearchProducts(container, ['prod_1'])

    expect(result[0]!.seller).toBeNull()
  })

  it('flattens options into key/value records', async () => {
    const container = makeContainer([{ ...baseProduct }]) as any

    const result = await findAndTransformMeilisearchProducts(container, ['prod_1'])
    const doc = result[0]!

    expect(Array.isArray(doc.options)).toBe(true)
    // Each option entry is a record like { size: "S" }
    const optionValues = (doc.options as any[]).map((o: any) => Object.values(o)[0])
    expect(optionValues).toContain('S')
    expect(optionValues).toContain('M')
  })

  it('adds variant option key/values onto the variant object', async () => {
    const container = makeContainer([{ ...baseProduct }]) as any

    const result = await findAndTransformMeilisearchProducts(container, ['prod_1'])
    const variant = result[0]!.variants![0] as any

    expect(variant['size']).toBe('S')
  })

  it('throws Zod error when a required product field is missing', async () => {
    const bad = { ...baseProduct, title: undefined }
    const container = makeContainer([bad]) as any

    await expect(
      findAndTransformMeilisearchProducts(container, ['prod_1'])
    ).rejects.toThrow()
  })

  it('applies status:published filter in the query', async () => {
    const container = makeContainer([]) as any

    await findAndTransformMeilisearchProducts(container, ['prod_1'])

    const callArgs = container._graph.mock.calls[0][0]
    expect(callArgs.filters).toMatchObject({ status: 'published' })
  })
})
