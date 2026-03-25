import meilisearchProductEventsBridgeHandler from '../subscribers/meilisearch-product-events-bridge'
import meilisearchProductsChangedHandler from '../subscribers/meilisearch-products-changed'
import meilisearchProductsDeletedHandler from '../subscribers/meilisearch-products-deleted'
import meilisearchSellerSuspendedHandler from '../subscribers/meilisearch-seller-suspended'
import meilisearchSellerUnsuspendedHandler from '../subscribers/meilisearch-seller-unsuspended'
import { MeilisearchEvents } from '../modules/meilisearch/types'
import { ContainerRegistrationKeys, Modules } from '@medusajs/framework/utils'

// ─── Container mock factory ───────────────────────────────────────────────────

type MockServices = {
  logger?: Partial<{ debug: jest.Mock; error: jest.Mock }>
  eventBus?: Partial<{ emit: jest.Mock }>
  meilisearch?: Partial<{ batchUpsert: jest.Mock; batchDelete: jest.Mock }>
  query?: Partial<{ graph: jest.Mock }>
}

function makeContainer(services: MockServices = {}) {
  const logger = {
    debug: jest.fn(),
    error: jest.fn(),
    ...services.logger,
  }
  const eventBus = {
    emit: jest.fn().mockResolvedValue(undefined),
    ...services.eventBus,
  }
  const meilisearch = {
    batchUpsert: jest.fn().mockResolvedValue(undefined),
    batchDelete: jest.fn().mockResolvedValue(undefined),
    ...services.meilisearch,
  }
  const query = {
    graph: jest.fn().mockResolvedValue({ data: [] }),
    ...services.query,
  }

  const serviceMap: Record<string, any> = {
    [ContainerRegistrationKeys.LOGGER]: logger,
    [ContainerRegistrationKeys.QUERY]: query,
    [Modules.EVENT_BUS]: eventBus,
    meilisearch,
  }

  return {
    resolve: (key: string) => serviceMap[key],
    logger,
    eventBus,
    meilisearch,
    query,
  }
}

// ─── meilisearch-product-events-bridge ───────────────────────────────────────

describe('meilisearchProductEventsBridgeHandler', () => {
  it('emits PRODUCTS_CHANGED for product.created', async () => {
    const container = makeContainer()
    await meilisearchProductEventsBridgeHandler({
      event: { name: 'product.created', data: { id: 'prod_1' } },
      container,
    } as any)

    expect(container.eventBus.emit).toHaveBeenCalledWith({
      name: MeilisearchEvents.PRODUCTS_CHANGED,
      data: { ids: ['prod_1'] },
    })
  })

  it('emits PRODUCTS_CHANGED for product.updated', async () => {
    const container = makeContainer()
    await meilisearchProductEventsBridgeHandler({
      event: { name: 'product.updated', data: { id: 'prod_1' } },
      container,
    } as any)

    expect(container.eventBus.emit).toHaveBeenCalledWith(
      expect.objectContaining({ name: MeilisearchEvents.PRODUCTS_CHANGED })
    )
  })

  it('emits PRODUCTS_DELETED for product.deleted', async () => {
    const container = makeContainer()
    await meilisearchProductEventsBridgeHandler({
      event: { name: 'product.deleted', data: { id: 'prod_1' } },
      container,
    } as any)

    expect(container.eventBus.emit).toHaveBeenCalledWith({
      name: MeilisearchEvents.PRODUCTS_DELETED,
      data: { ids: ['prod_1'] },
    })
  })

  it('emits PRODUCTS_CHANGED for product.product.created', async () => {
    const container = makeContainer()
    await meilisearchProductEventsBridgeHandler({
      event: { name: 'product.product.created', data: { id: 'prod_1' } },
      container,
    } as any)

    expect(container.eventBus.emit).toHaveBeenCalledWith(
      expect.objectContaining({ name: MeilisearchEvents.PRODUCTS_CHANGED })
    )
  })

  it('emits PRODUCTS_CHANGED for product.product.updated', async () => {
    const container = makeContainer()
    await meilisearchProductEventsBridgeHandler({
      event: { name: 'product.product.updated', data: { id: 'prod_1' } },
      container,
    } as any)

    expect(container.eventBus.emit).toHaveBeenCalledWith(
      expect.objectContaining({ name: MeilisearchEvents.PRODUCTS_CHANGED })
    )
  })

  it('emits PRODUCTS_DELETED for product.product.deleted', async () => {
    const container = makeContainer()
    await meilisearchProductEventsBridgeHandler({
      event: { name: 'product.product.deleted', data: { id: 'prod_1' } },
      container,
    } as any)

    expect(container.eventBus.emit).toHaveBeenCalledWith(
      expect.objectContaining({ name: MeilisearchEvents.PRODUCTS_DELETED })
    )
  })

  it('logs error and rethrows when eventBus.emit fails (FR-012)', async () => {
    const error = new Error('Event bus down')
    const container = makeContainer({
      eventBus: { emit: jest.fn().mockRejectedValue(error) },
    })

    await expect(
      meilisearchProductEventsBridgeHandler({
        event: { name: 'product.created', data: { id: 'prod_1' } },
        container,
      } as any)
    ).rejects.toThrow('Event bus down')

    expect(container.logger.error).toHaveBeenCalledWith(
      expect.stringContaining('prod_1'),
      error
    )
  })
})

// ─── meilisearch-products-changed ────────────────────────────────────────────

// Mock the transformer to keep these tests focused on the subscriber logic
jest.mock('../subscribers/utils/meilisearch-product', () => ({
  filterProductsByStatus: jest.fn(),
  findAndTransformMeilisearchProducts: jest.fn(),
}))

import {
  filterProductsByStatus,
  findAndTransformMeilisearchProducts,
} from '../subscribers/utils/meilisearch-product'

const mockFilterProducts = filterProductsByStatus as jest.Mock
const mockTransformProducts = findAndTransformMeilisearchProducts as jest.Mock

describe('meilisearchProductsChangedHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockFilterProducts.mockResolvedValue({ published: ['prod_1'], other: [] })
    mockTransformProducts.mockResolvedValue([{ id: 'prod_1', title: 'Shoes' }])
  })

  it('calls batchUpsert for published products', async () => {
    const container = makeContainer()
    await meilisearchProductsChangedHandler({
      event: { data: { ids: ['prod_1'] } },
      container,
    } as any)

    expect(container.meilisearch.batchUpsert).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ id: 'prod_1' })])
    )
  })

  it('calls batchDelete for non-published products', async () => {
    mockFilterProducts.mockResolvedValue({ published: [], other: ['prod_draft'] })
    mockTransformProducts.mockResolvedValue([])

    const container = makeContainer()
    await meilisearchProductsChangedHandler({
      event: { data: { ids: ['prod_draft'] } },
      container,
    } as any)

    expect(container.meilisearch.batchDelete).toHaveBeenCalledWith(['prod_draft'])
  })

  it('logs error and rethrows on failure (FR-012)', async () => {
    const error = new Error('Meilisearch down')
    const container = makeContainer({
      meilisearch: { batchUpsert: jest.fn().mockRejectedValue(error) },
    })

    await expect(
      meilisearchProductsChangedHandler({
        event: { data: { ids: ['prod_1'] } },
        container,
      } as any)
    ).rejects.toThrow('Meilisearch down')

    expect(container.logger.error).toHaveBeenCalledWith(
      expect.stringContaining('prod_1'),
      error
    )
  })

  it('skips batchUpsert when no published products', async () => {
    mockFilterProducts.mockResolvedValue({ published: [], other: [] })

    const container = makeContainer()
    await meilisearchProductsChangedHandler({
      event: { data: { ids: ['prod_1'] } },
      container,
    } as any)

    expect(container.meilisearch.batchUpsert).not.toHaveBeenCalled()
  })
})

// ─── meilisearch-products-deleted ────────────────────────────────────────────

describe('meilisearchProductsDeletedHandler', () => {
  it('calls batchDelete with the provided ids', async () => {
    const container = makeContainer()
    await meilisearchProductsDeletedHandler({
      event: { data: { ids: ['prod_1', 'prod_2'] } },
      container,
    } as any)

    expect(container.meilisearch.batchDelete).toHaveBeenCalledWith(['prod_1', 'prod_2'])
  })

  it('logs error and rethrows on failure (FR-012)', async () => {
    const error = new Error('Network error')
    const container = makeContainer({
      meilisearch: { batchDelete: jest.fn().mockRejectedValue(error) },
    })

    await expect(
      meilisearchProductsDeletedHandler({
        event: { data: { ids: ['prod_1'] } },
        container,
      } as any)
    ).rejects.toThrow('Network error')

    expect(container.logger.error).toHaveBeenCalledWith(
      expect.stringContaining('prod_1'),
      error
    )
  })
})

// ─── meilisearch-seller-suspended ────────────────────────────────────────────

describe('meilisearchSellerSuspendedHandler', () => {
  it('queries seller products via query.graph and emits PRODUCTS_CHANGED', async () => {
    const container = makeContainer({
      query: {
        graph: jest.fn().mockResolvedValue({
          data: [{ products: [{ id: 'prod_1' }, { id: 'prod_2' }] }],
        }),
      },
    })

    await meilisearchSellerSuspendedHandler({
      event: { data: { id: 'sel_1' } },
      container,
    } as any)

    expect(container.query.graph).toHaveBeenCalledWith(
      expect.objectContaining({ entity: 'seller', filters: { id: 'sel_1' } })
    )
    expect(container.eventBus.emit).toHaveBeenCalledWith({
      name: MeilisearchEvents.PRODUCTS_CHANGED,
      data: { ids: expect.arrayContaining(['prod_1', 'prod_2']) },
    })
  })

  it('emits in chunks of 100 when seller has many products', async () => {
    const productIds = Array.from({ length: 250 }, (_, i) => ({ id: `prod_${i}` }))
    const container = makeContainer({
      query: {
        graph: jest.fn().mockResolvedValue({
          data: [{ products: productIds }],
        }),
      },
    })

    await meilisearchSellerSuspendedHandler({
      event: { data: { id: 'sel_1' } },
      container,
    } as any)

    // 250 products = 3 chunks (100 + 100 + 50)
    expect(container.eventBus.emit).toHaveBeenCalledTimes(3)
    const firstChunkIds = container.eventBus.emit.mock.calls[0][0].data.ids
    const secondChunkIds = container.eventBus.emit.mock.calls[1][0].data.ids
    const thirdChunkIds = container.eventBus.emit.mock.calls[2][0].data.ids
    expect(firstChunkIds).toHaveLength(100)
    expect(secondChunkIds).toHaveLength(100)
    expect(thirdChunkIds).toHaveLength(50)
  })

  it('does nothing when the seller has no linked products', async () => {
    const container = makeContainer({
      query: {
        graph: jest.fn().mockResolvedValue({
          data: [{ products: [] }],
        }),
      },
    })

    await meilisearchSellerSuspendedHandler({
      event: { data: { id: 'sel_1' } },
      container,
    } as any)

    expect(container.eventBus.emit).not.toHaveBeenCalled()
  })

  it('logs error and rethrows on failure (FR-012)', async () => {
    const error = new Error('DB error')
    const container = makeContainer({
      query: {
        graph: jest.fn().mockRejectedValue(error),
      },
    })

    await expect(
      meilisearchSellerSuspendedHandler({
        event: { data: { id: 'sel_1' } },
        container,
      } as any)
    ).rejects.toThrow('DB error')

    expect(container.logger.error).toHaveBeenCalledWith(
      expect.stringContaining('sel_1'),
      error
    )
  })
})

// ─── meilisearch-seller-unsuspended ──────────────────────────────────────────

describe('meilisearchSellerUnsuspendedHandler', () => {
  it('emits PRODUCTS_CHANGED for seller products on reinstatement', async () => {
    const container = makeContainer({
      query: {
        graph: jest.fn().mockResolvedValue({
          data: [{ products: [{ id: 'prod_1' }] }],
        }),
      },
    })

    await meilisearchSellerUnsuspendedHandler({
      event: { data: { id: 'sel_1' } },
      container,
    } as any)

    expect(container.eventBus.emit).toHaveBeenCalledWith({
      name: MeilisearchEvents.PRODUCTS_CHANGED,
      data: { ids: ['prod_1'] },
    })
  })

  it('logs error and rethrows on failure (FR-012)', async () => {
    const error = new Error('Timeout')
    const container = makeContainer({
      query: {
        graph: jest.fn().mockRejectedValue(error),
      },
    })

    await expect(
      meilisearchSellerUnsuspendedHandler({
        event: { data: { id: 'sel_1' } },
        container,
      } as any)
    ).rejects.toThrow('Timeout')

    expect(container.logger.error).toHaveBeenCalledWith(
      expect.stringContaining('sel_1'),
      error
    )
  })
})
