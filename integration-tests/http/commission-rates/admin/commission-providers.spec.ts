import path from "path"
import { moduleIntegrationTestRunner } from "@medusajs/test-utils"
import {
  CommissionCalculationContext,
  CreateCommissionLineDTO,
  ICommissionProvider,
  MercurModules,
} from "@mercurjs/types"

jest.setTimeout(60000)

const resolve = path.resolve(
  __dirname,
  "../../../../packages/core/.medusa/server/src/modules/commission"
)

class FixedCommissionProvider implements ICommissionProvider {
  static identifier = "fixed"

  async getCommissionLines(
    context: CommissionCalculationContext
  ): Promise<CreateCommissionLineDTO[]> {
    return (context.items ?? []).map((item) => ({
      item_id: item.id,
      shipping_method_id: null,
      code: "FIXED",
      rate: 7,
      amount: 7,
      data: { marker: context.additional_context?.marker ?? null },
    }))
  }
}

class OtherCommissionProvider implements ICommissionProvider {
  static identifier = "other"

  async getCommissionLines(): Promise<CreateCommissionLineDTO[]> {
    return []
  }
}

class BatchCommissionProvider implements ICommissionProvider {
  static identifier = "batch"
  static singleCalls = 0
  static batchCalls = 0

  async getCommissionLines(
    context: CommissionCalculationContext
  ): Promise<CreateCommissionLineDTO[]> {
    BatchCommissionProvider.singleCalls += 1
    return (context.items ?? []).map((item) => ({
      item_id: item.id,
      shipping_method_id: null,
      code: "SINGLE",
      rate: 1,
      amount: 1,
    }))
  }

  async getCommissionLinesBatch(
    contexts: CommissionCalculationContext[]
  ): Promise<CreateCommissionLineDTO[][]> {
    BatchCommissionProvider.batchCalls += 1
    return contexts.map((context) =>
      (context.items ?? []).map((item) => ({
        item_id: item.id,
        shipping_method_id: null,
        code: "BATCH",
        rate: 2,
        amount: 2,
      }))
    )
  }
}

const context: CommissionCalculationContext = {
  currency_code: "usd",
  items: [{ id: "item_1", subtotal: 100 }],
  shipping_methods: [],
}

moduleIntegrationTestRunner({
  moduleName: MercurModules.COMMISSION,
  dbName: "medusa-commission-providers-default",
  resolve,
  moduleOptions: {
    providers: [
      {
        resolve: { services: [FixedCommissionProvider] },
        id: "fixed",
        is_default: true,
      },
      {
        resolve: { services: [OtherCommissionProvider] },
        id: "other",
      },
    ],
  },
  testSuite: ({ service }) => {
    describe("Commission providers - is_default provider", () => {
      it("delegates getCommissionLines to the default provider", async () => {
        const lines = await service.getCommissionLines(context)

        expect(lines).toEqual([
          expect.objectContaining({
            item_id: "item_1",
            code: "FIXED",
            amount: 7,
            provider_id: "fixed",
            data: { marker: null },
          }),
        ])
      })

      it("persists provider_id and data without a commission rate", async () => {
        const lines = await service.getCommissionLines(context)
        const [persisted] = await service.upsertCommissionLines(lines)

        expect(persisted).toEqual(
          expect.objectContaining({
            item_id: "item_1",
            commission_rate_id: null,
            provider_id: "fixed",
            data: { marker: null },
          })
        )
      })

      it("falls back to per-context calls when the provider has no batch method", async () => {
        const batches = await service.getCommissionLinesBatch([
          context,
          { ...context, items: [{ id: "item_2", subtotal: 50 }] },
        ])

        expect(batches).toEqual([
          [expect.objectContaining({ item_id: "item_1", provider_id: "fixed" })],
          [expect.objectContaining({ item_id: "item_2", provider_id: "fixed" })],
        ])
      })
    })
  },
})

moduleIntegrationTestRunner({
  moduleName: MercurModules.COMMISSION,
  dbName: "medusa-commission-providers-batch",
  resolve,
  moduleOptions: {
    providers: [
      {
        resolve: { services: [BatchCommissionProvider] },
        id: "batch",
        is_default: true,
      },
    ],
  },
  testSuite: ({ service }) => {
    describe("Commission providers - batch-capable provider", () => {
      beforeEach(() => {
        BatchCommissionProvider.singleCalls = 0
        BatchCommissionProvider.batchCalls = 0
      })

      it("resolves a batch through getCommissionLinesBatch once", async () => {
        const batches = await service.getCommissionLinesBatch([
          context,
          { ...context, items: [{ id: "item_2", subtotal: 50 }] },
        ])

        expect(BatchCommissionProvider.batchCalls).toBe(1)
        expect(BatchCommissionProvider.singleCalls).toBe(0)
        expect(batches).toEqual([
          [
            expect.objectContaining({
              item_id: "item_1",
              code: "BATCH",
              provider_id: "batch",
            }),
          ],
          [
            expect.objectContaining({
              item_id: "item_2",
              code: "BATCH",
              provider_id: "batch",
            }),
          ],
        ])
      })

      it("skips the provider for an empty batch", async () => {
        await expect(service.getCommissionLinesBatch([])).resolves.toEqual([])
        expect(BatchCommissionProvider.batchCalls).toBe(0)
      })
    })
  },
})

moduleIntegrationTestRunner({
  moduleName: MercurModules.COMMISSION,
  dbName: "medusa-commission-providers-system",
  resolve,
  moduleOptions: {
    providers: [
      {
        resolve: { services: [FixedCommissionProvider] },
        id: "fixed",
      },
      {
        resolve: { services: [OtherCommissionProvider] },
        id: "other",
      },
    ],
  },
  testSuite: ({ service }) => {
    describe("Commission providers - no default flag", () => {
      it("keeps the system provider as default", async () => {
        const lines = await service.getCommissionLines(context)

        expect(lines).toEqual([
          expect.objectContaining({
            item_id: "item_1",
            provider_id: "system",
          }),
        ])
        expect(lines[0].commission_rate_id).toBeTruthy()
      })
    })
  },
})

moduleIntegrationTestRunner({
  moduleName: MercurModules.COMMISSION,
  dbName: "medusa-commission-providers-missing",
  resolve,
  moduleOptions: {
    default_provider: "missing",
  },
  testSuite: ({ service }) => {
    describe("Commission providers - unregistered default_provider", () => {
      it("fails at first calculation", async () => {
        await expect(service.getCommissionLines(context)).rejects.toThrow(
          "Unable to retrieve the commission provider with id: missing"
        )
      })
    })
  },
})
