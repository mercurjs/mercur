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
