import { POST } from '../api/store/meilisearch/products/search/route'
import { MEILISEARCH_MODULE } from '../modules/meilisearch'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

// ─── Mock helpers ─────────────────────────────────────────────────────────────

function makeSearchResult(hitIds: string[] = []) {
  return {
    hits: hitIds.map((id) => ({ id })),
    totalHits: hitIds.length,
    page: 1,
    totalPages: hitIds.length ? 1 : 0,
    hitsPerPage: 12,
    processingTimeMs: 5,
    query: 'test',
    facetDistribution: undefined,
  }
}

function makeRequest(body: Record<string, any> = {}, products: any[] = []) {
  const mockSearch = jest.fn().mockResolvedValue(makeSearchResult(products.map((p) => p.id)))
  const mockGraph = jest.fn().mockResolvedValue({ data: products })

  const scope = {
    resolve: jest.fn((key: string) => {
      if (key === MEILISEARCH_MODULE) return { search: mockSearch }
      if (key === ContainerRegistrationKeys.QUERY) return { graph: mockGraph }
      return {}
    }),
  }

  const req = {
    scope,
    validatedBody: {
      query: '',
      page: 1,
      hitsPerPage: 12,
      ...body,
    },
  } as any

  const res = {
    _data: null as any,
    json(data: any) {
      this._data = data
    },
  }

  return { req, res, mockSearch, mockGraph }
}

// ─── FR-003: seller.status = "active" is always enforced ─────────────────────

describe('POST /store/meilisearch/products/search — filter enforcement', () => {
  it('always sends seller.status = "active" in the filter string (FR-003)', async () => {
    const { req, res, mockSearch } = makeRequest({ query: 'shoes' })

    await POST(req, res as any)

    const searchOptions = mockSearch.mock.calls[0][1] as Record<string, unknown>
    expect(searchOptions.filter).toContain('seller.status = "active"')
  })

  it('cannot be bypassed even when no other filters are provided', async () => {
    const { req, res, mockSearch } = makeRequest({})

    await POST(req, res as any)

    const filter = mockSearch.mock.calls[0][1].filter as string
    expect(filter).toBe('seller.status = "active"')
  })

  it('appends category filter after the mandatory seller filter', async () => {
    const { req, res, mockSearch } = makeRequest({
      filters: { categories: ['cat_1', 'cat_2'] },
    })

    await POST(req, res as any)

    const filter = mockSearch.mock.calls[0][1].filter as string
    expect(filter).toMatch(/^seller\.status = "active"/)
    expect(filter).toContain('categories.id IN ["cat_1", "cat_2"]')
  })

  it('appends price_min filter', async () => {
    const { req, res, mockSearch } = makeRequest({
      filters: { price_min: 50 },
    })

    await POST(req, res as any)

    const filter = mockSearch.mock.calls[0][1].filter as string
    expect(filter).toContain('variants.prices.amount >= 50')
  })

  it('appends price_max filter', async () => {
    const { req, res, mockSearch } = makeRequest({
      filters: { price_max: 200 },
    })

    await POST(req, res as any)

    const filter = mockSearch.mock.calls[0][1].filter as string
    expect(filter).toContain('variants.prices.amount <= 200')
  })

  it('appends seller_handle filter', async () => {
    const { req, res, mockSearch } = makeRequest({
      filters: { seller_handle: 'acme-store' },
    })

    await POST(req, res as any)

    const filter = mockSearch.mock.calls[0][1].filter as string
    expect(filter).toContain('seller.handle = "acme-store"')
  })

  it('combines all filters with AND', async () => {
    const { req, res, mockSearch } = makeRequest({
      filters: {
        categories: ['cat_1'],
        price_min: 10,
        price_max: 100,
        seller_handle: 'acme',
      },
    })

    await POST(req, res as any)

    const filter = mockSearch.mock.calls[0][1].filter as string
    const parts = filter.split(' AND ')
    expect(parts.length).toBe(5) // seller.status + categories + price_min + price_max + seller_handle
  })
})

// ─── Response shape ───────────────────────────────────────────────────────────

describe('POST /store/meilisearch/products/search — response', () => {
  it('returns empty products array when meilisearch returns no hits', async () => {
    const { req, res } = makeRequest({ query: 'xyz_notfound' }, [])

    await POST(req, res as any)

    expect(res._data.products).toEqual([])
    expect(res._data.totalHits).toBe(0)
    expect(res._data).toHaveProperty('query')
    expect(res._data).toHaveProperty('processingTimeMs')
  })

  it('hydrates products from DB and returns them in hit order', async () => {
    // meilisearch hits come back in order prod_1, prod_2 (relevance order)
    const { req, res, mockSearch, mockGraph } = makeRequest({}, [
      { id: 'prod_1', title: 'A' },
      { id: 'prod_2', title: 'B' },
    ])
    mockSearch.mockResolvedValueOnce(makeSearchResult(['prod_1', 'prod_2']))
    mockGraph.mockResolvedValueOnce({
      data: [
        { id: 'prod_2', title: 'B' }, // DB may return in any order
        { id: 'prod_1', title: 'A' },
      ],
    })

    await POST(req, res as any)

    // Should be ordered by meilisearch relevance (prod_1 first)
    expect(res._data.products[0].id).toBe('prod_1')
    expect(res._data.products[1].id).toBe('prod_2')
  })

  it('passes pagination params to meilisearch', async () => {
    const { req, res, mockSearch } = makeRequest({ page: 2, hitsPerPage: 5 }, [])

    await POST(req, res as any)

    expect(mockSearch).toHaveBeenCalledWith(
      '',
      expect.objectContaining({ page: 2, hitsPerPage: 5 })
    )
  })

  it('passes attributesToRetrieve: ["id"] to avoid over-fetching from meilisearch', async () => {
    const { req, res, mockSearch } = makeRequest({}, [])

    await POST(req, res as any)

    expect(mockSearch).toHaveBeenCalledWith(
      '',
      expect.objectContaining({ attributesToRetrieve: ['id'] })
    )
  })

  it('does not call query.graph when meilisearch returns empty hits', async () => {
    const { req, res, mockSearch, mockGraph } = makeRequest({}, [])
    mockSearch.mockResolvedValueOnce(makeSearchResult([]))

    await POST(req, res as any)

    expect(mockGraph).not.toHaveBeenCalled()
  })
})
