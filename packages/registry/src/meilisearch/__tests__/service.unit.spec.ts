import MeilisearchModuleService from '../modules/meilisearch/service'
import { IndexType } from '../modules/meilisearch/types'

// ─── Mock the meilisearch npm client ────────────────────────────────────────

const mockAddDocuments = jest.fn().mockResolvedValue({ taskUid: 1 })
const mockDeleteDocuments = jest.fn().mockResolvedValue({ taskUid: 2 })
const mockSearch = jest.fn()
const mockGetStats = jest.fn()
const mockUpdateSettings = jest.fn().mockResolvedValue({ taskUid: 3 })
const mockIndex = jest.fn().mockReturnValue({
  addDocuments: mockAddDocuments,
  deleteDocuments: mockDeleteDocuments,
  search: mockSearch,
  getStats: mockGetStats,
  updateSettings: mockUpdateSettings,
})

jest.mock('meilisearch', () => ({
  MeiliSearch: jest.fn().mockImplementation(() => ({
    index: mockIndex,
    config: { host: 'http://localhost:7700' },
  })),
}))

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeService(options: { host?: string; apiKey?: string } = {}) {
  return new MeilisearchModuleService(null, {
    host: options.host ?? 'http://localhost:7700',
    apiKey: options.apiKey ?? 'masterKey',
  })
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('MeilisearchModuleService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSearch.mockResolvedValue({
      hits: [{ id: 'prod_1' }],
      totalHits: 1,
      page: 1,
      totalPages: 1,
      hitsPerPage: 10,
      processingTimeMs: 5,
      query: 'shoes',
    })
    mockGetStats.mockResolvedValue({ numberOfDocuments: 42 })
  })

  // ─── Constructor ───────────────────────────────────────────────────────────

  describe('constructor', () => {
    it('throws when host is missing', () => {
      expect(() =>
        new MeilisearchModuleService(null, { host: '', apiKey: 'key' } as any)
      ).toThrow('[meilisearch block] Missing required environment variables: MEILISEARCH_HOST')
    })

    it('throws when apiKey is missing', () => {
      expect(() =>
        new MeilisearchModuleService(null, { host: 'http://localhost:7700', apiKey: '' } as any)
      ).toThrow('[meilisearch block] Missing required environment variables: MEILISEARCH_API_KEY')
    })

    it('throws listing both when both are missing', () => {
      expect(() =>
        new MeilisearchModuleService(null, {} as any)
      ).toThrow('MEILISEARCH_HOST, MEILISEARCH_API_KEY')
    })

    it('creates service when both options are provided', () => {
      expect(() => makeService()).not.toThrow()
    })
  })

  // ─── getHost ───────────────────────────────────────────────────────────────

  describe('getHost', () => {
    it('returns the configured host string', () => {
      const service = makeService()
      expect(service.getHost()).toBe('http://localhost:7700')
    })
  })

  // ─── batchUpsert ──────────────────────────────────────────────────────────

  describe('batchUpsert', () => {
    it('calls addDocuments on the products index', async () => {
      const service = makeService()
      const docs = [{ id: 'prod_1', title: 'Shoes' }] as any[]
      await service.batchUpsert(docs)

      expect(mockIndex).toHaveBeenCalledWith(IndexType.PRODUCT)
      expect(mockAddDocuments).toHaveBeenCalledWith(docs, { primaryKey: 'id' })
    })

    it('is a no-op for an empty array', async () => {
      const service = makeService()
      await service.batchUpsert([])

      expect(mockIndex).not.toHaveBeenCalled()
      expect(mockAddDocuments).not.toHaveBeenCalled()
    })
  })

  // ─── batchDelete ──────────────────────────────────────────────────────────

  describe('batchDelete', () => {
    it('calls deleteDocuments on the products index', async () => {
      const service = makeService()
      await service.batchDelete(['prod_1', 'prod_2'])

      expect(mockIndex).toHaveBeenCalledWith(IndexType.PRODUCT)
      expect(mockDeleteDocuments).toHaveBeenCalledWith(['prod_1', 'prod_2'])
    })

    it('is a no-op for an empty array', async () => {
      const service = makeService()
      await service.batchDelete([])

      expect(mockIndex).not.toHaveBeenCalled()
      expect(mockDeleteDocuments).not.toHaveBeenCalled()
    })
  })

  // ─── search ───────────────────────────────────────────────────────────────

  describe('search', () => {
    it('returns structured result from meilisearch hit list', async () => {
      const service = makeService()
      const result = await service.search('shoes', { filter: 'seller.status = "active"' })

      expect(mockIndex).toHaveBeenCalledWith(IndexType.PRODUCT)
      expect(mockSearch).toHaveBeenCalledWith('shoes', { filter: 'seller.status = "active"' })
      expect(result).toEqual({
        hits: [{ id: 'prod_1' }],
        totalHits: 1,
        page: 1,
        totalPages: 1,
        hitsPerPage: 10,
        processingTimeMs: 5,
        query: 'shoes',
        facetDistribution: undefined,
      })
    })

    it('falls back to estimatedTotalHits when totalHits is absent', async () => {
      const service = makeService()
      mockSearch.mockResolvedValueOnce({
        hits: [],
        estimatedTotalHits: 99,
        page: 1,
        totalPages: 0,
        hitsPerPage: 10,
        processingTimeMs: 3,
        query: 'test',
      })

      const result = await service.search('test', {})
      expect(result.totalHits).toBe(99)
    })
  })

  // ─── getStatus ────────────────────────────────────────────────────────────

  describe('getStatus', () => {
    it('returns documentCount and isHealthy:true on success', async () => {
      const service = makeService()
      const status = await service.getStatus()

      expect(status).toEqual({ documentCount: 42, isHealthy: true })
    })

    it('returns isHealthy:false when meilisearch is unreachable', async () => {
      const service = makeService()
      mockGetStats.mockRejectedValueOnce(new Error('Connection refused'))

      const status = await service.getStatus()
      expect(status).toEqual({ documentCount: 0, isHealthy: false })
    })
  })

  // ─── ensureSettings ───────────────────────────────────────────────────────

  describe('ensureSettings', () => {
    it('applies searchable, filterable, and sortable attributes to the index', async () => {
      const service = makeService()
      await service.ensureSettings()

      expect(mockIndex).toHaveBeenCalledWith(IndexType.PRODUCT)
      expect(mockUpdateSettings).toHaveBeenCalledWith(
        expect.objectContaining({
          searchableAttributes: expect.arrayContaining(['title', 'seller.name', 'seller.handle']),
          filterableAttributes: expect.arrayContaining(['seller.status', 'seller.handle', 'categories.id']),
          sortableAttributes: expect.arrayContaining(['title']),
        })
      )
    })
  })
})
