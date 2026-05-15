import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { MedusaContainer } from "@medusajs/framework/types"
import {
  adminHeaders,
  createAdminUser,
} from "../../../helpers/create-admin-user"

jest.setTimeout(50000)

medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api, dbConnection }) => {
    describe("Admin - Subscription Plans", () => {
      let appContainer: MedusaContainer

      beforeAll(async () => {
        appContainer = getContainer()
      })

      beforeEach(async () => {
        await createAdminUser(dbConnection, adminHeaders, appContainer)
      })

      describe("POST /admin/subscription-plans", () => {
        it("should create a plan with required fields", async () => {
          const response = await api.post(
            `/admin/subscription-plans`,
            {
              currency_code: "usd",
              monthly_amount: 29.99,
            },
            adminHeaders
          )

          expect(response.status).toEqual(201)
          expect(response.data.subscription_plan).toEqual(
            expect.objectContaining({
              currency_code: "usd",
              monthly_amount: 29.99,
            })
          )
        })

        it("should create a plan with all optional fields", async () => {
          const response = await api.post(
            `/admin/subscription-plans`,
            {
              currency_code: "eur",
              monthly_amount: 49.99,
              free_months: 3,
              requires_orders: true,
              metadata: { tier: "premium" },
            },
            adminHeaders
          )

          expect(response.status).toEqual(201)
          expect(response.data.subscription_plan).toEqual(
            expect.objectContaining({
              currency_code: "eur",
              monthly_amount: 49.99,
              free_months: 3,
              requires_orders: true,
            })
          )
        })

        it("should default free_months when not provided", async () => {
          const response = await api.post(
            `/admin/subscription-plans`,
            {
              currency_code: "gbp",
              monthly_amount: 19.99,
            },
            adminHeaders
          )

          expect(response.status).toEqual(201)
          expect(response.data.subscription_plan.free_months).toEqual(0)
        })

        it("should fail with 400 for missing currency_code", async () => {
          const response = await api
            .post(
              `/admin/subscription-plans`,
              { monthly_amount: 29.99 },
              adminHeaders
            )
            .catch((e) => e.response)

          expect(response.status).toEqual(400)
        })

        it("should fail with 400 for missing monthly_amount", async () => {
          const response = await api
            .post(
              `/admin/subscription-plans`,
              { currency_code: "usd" },
              adminHeaders
            )
            .catch((e) => e.response)

          expect(response.status).toEqual(400)
        })

        it("should fail with 400 for free_months > 120", async () => {
          const response = await api
            .post(
              `/admin/subscription-plans`,
              {
                currency_code: "usd",
                monthly_amount: 29.99,
                free_months: 121,
              },
              adminHeaders
            )
            .catch((e) => e.response)

          expect(response.status).toEqual(400)
        })

        it("should fail with 400 for free_months < 0", async () => {
          const response = await api
            .post(
              `/admin/subscription-plans`,
              {
                currency_code: "usd",
                monthly_amount: 29.99,
                free_months: -1,
              },
              adminHeaders
            )
            .catch((e) => e.response)

          expect(response.status).toEqual(400)
        })

        it("should fail with 400 for non-integer free_months", async () => {
          const response = await api
            .post(
              `/admin/subscription-plans`,
              {
                currency_code: "usd",
                monthly_amount: 29.99,
                free_months: 2.5,
              },
              adminHeaders
            )
            .catch((e) => e.response)

          expect(response.status).toEqual(400)
        })
      })

      describe("GET /admin/subscription-plans", () => {
        let _planA: any
        let _planB: any

        beforeEach(async () => {
          const responseA = await api.post(
            `/admin/subscription-plans`,
            {
              currency_code: "usd",
              monthly_amount: 29.99,
            },
            adminHeaders
          )
          _planA = responseA.data.subscription_plan

          const responseB = await api.post(
            `/admin/subscription-plans`,
            {
              currency_code: "eur",
              monthly_amount: 49.99,
            },
            adminHeaders
          )
          _planB = responseB.data.subscription_plan
        })

        it("should list all subscription plans", async () => {
          const response = await api.get(
            `/admin/subscription-plans`,
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.subscription_plans).toBeDefined()
          expect(response.data.subscription_plans.length).toBeGreaterThanOrEqual(
            2
          )
        })

        it("should return count, offset, limit", async () => {
          const response = await api.get(
            `/admin/subscription-plans`,
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.count).toBeDefined()
          expect(response.data.offset).toBeDefined()
          expect(response.data.limit).toBeDefined()
        })

        it("should filter by currency_code", async () => {
          const response = await api.get(
            `/admin/subscription-plans?currency_code=usd`,
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.subscription_plans.length).toBeGreaterThanOrEqual(
            1
          )
          response.data.subscription_plans.forEach((plan: any) => {
            expect(plan.currency_code).toEqual("usd")
          })
        })

        it("should return empty for non-matching currency_code", async () => {
          const response = await api.get(
            `/admin/subscription-plans?currency_code=jpy`,
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.subscription_plans).toHaveLength(0)
        })

        it("should support limit pagination", async () => {
          const response = await api.get(
            `/admin/subscription-plans?limit=1`,
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.subscription_plans).toHaveLength(1)
          expect(response.data.limit).toEqual(1)
        })

        it("should support offset pagination", async () => {
          const response = await api.get(
            `/admin/subscription-plans?offset=1&limit=1`,
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.subscription_plans).toHaveLength(1)
          expect(response.data.offset).toEqual(1)
        })
      })

      describe("GET /admin/subscription-plans/:id", () => {
        let plan: any

        beforeEach(async () => {
          const response = await api.post(
            `/admin/subscription-plans`,
            {
              currency_code: "usd",
              monthly_amount: 29.99,
              free_months: 1,
            },
            adminHeaders
          )
          plan = response.data.subscription_plan
        })

        it("should retrieve a subscription plan by id", async () => {
          const response = await api.get(
            `/admin/subscription-plans/${plan.id}`,
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.subscription_plan).toEqual(
            expect.objectContaining({
              id: plan.id,
              currency_code: "usd",
              monthly_amount: 29.99,
              free_months: 1,
            })
          )
        })

        it("should return plan with overrides array", async () => {
          const response = await api.get(
            `/admin/subscription-plans/${plan.id}`,
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.subscription_plan.overrides).toBeDefined()
          expect(
            Array.isArray(response.data.subscription_plan.overrides)
          ).toBe(true)
        })

        it("should return 404 for non-existent id", async () => {
          const response = await api
            .get(
              `/admin/subscription-plans/subplan_nonexistent`,
              adminHeaders
            )
            .catch((e) => e.response)

          expect(response.status).toEqual(404)
        })
      })

      describe("POST /admin/subscription-plans/:id", () => {
        let plan: any

        beforeEach(async () => {
          const response = await api.post(
            `/admin/subscription-plans`,
            {
              currency_code: "usd",
              monthly_amount: 29.99,
              free_months: 1,
            },
            adminHeaders
          )
          plan = response.data.subscription_plan
        })

        it("should update monthly_amount", async () => {
          const response = await api.post(
            `/admin/subscription-plans/${plan.id}`,
            { monthly_amount: 39.99 },
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.subscription_plan.monthly_amount).toEqual(39.99)
        })

        it("should update free_months", async () => {
          const response = await api.post(
            `/admin/subscription-plans/${plan.id}`,
            { free_months: 6 },
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.subscription_plan.free_months).toEqual(6)
        })

        it("should update requires_orders", async () => {
          const response = await api.post(
            `/admin/subscription-plans/${plan.id}`,
            { requires_orders: true },
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.subscription_plan.requires_orders).toBe(true)
        })

        it("should update metadata", async () => {
          const response = await api.post(
            `/admin/subscription-plans/${plan.id}`,
            { metadata: { promo: "summer2024" } },
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.subscription_plan.metadata).toEqual({
            promo: "summer2024",
          })
        })
      })

      describe("DELETE /admin/subscription-plans/:id", () => {
        let plan: any

        beforeEach(async () => {
          const response = await api.post(
            `/admin/subscription-plans`,
            {
              currency_code: "usd",
              monthly_amount: 29.99,
            },
            adminHeaders
          )
          plan = response.data.subscription_plan
        })

        it("should delete a subscription plan", async () => {
          const response = await api.delete(
            `/admin/subscription-plans/${plan.id}`,
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data).toEqual(
            expect.objectContaining({
              id: plan.id,
              object: "subscription_plan",
              deleted: true,
            })
          )
        })

        it("should return 404 when retrieving deleted plan", async () => {
          await api.delete(
            `/admin/subscription-plans/${plan.id}`,
            adminHeaders
          )

          const response = await api
            .get(`/admin/subscription-plans/${plan.id}`, adminHeaders)
            .catch((e) => e.response)

          expect(response.status).toEqual(404)
        })
      })

      describe("POST /admin/subscription-plans/:id/overrides", () => {
        let plan: any

        beforeEach(async () => {
          const response = await api.post(
            `/admin/subscription-plans`,
            {
              currency_code: "usd",
              monthly_amount: 29.99,
            },
            adminHeaders
          )
          plan = response.data.subscription_plan
        })

        it("should create an override with all fields", async () => {
          const response = await api.post(
            `/admin/subscription-plans/${plan.id}/overrides`,
            {
              reference: "seller",
              reference_id: "sel_123",
              monthly_amount: 19.99,
              free_months: 2,
              free_from: "2024-01-01T00:00:00.000Z",
              free_to: "2024-06-01T00:00:00.000Z",
            },
            adminHeaders
          )

          expect(response.status).toEqual(201)
          expect(response.data.subscription_plan).toBeDefined()
          expect(
            response.data.subscription_plan.overrides.length
          ).toBeGreaterThanOrEqual(1)

          const override = response.data.subscription_plan.overrides.find(
            (o: any) => o.reference_id === "sel_123"
          )
          expect(override).toEqual(
            expect.objectContaining({
              reference: "seller",
              reference_id: "sel_123",
              monthly_amount: 19.99,
              free_months: 2,
            })
          )
        })

        it("should return updated plan with overrides included", async () => {
          const response = await api.post(
            `/admin/subscription-plans/${plan.id}/overrides`,
            {
              reference: "seller",
              reference_id: "sel_456",
              monthly_amount: 9.99,
            },
            adminHeaders
          )

          expect(response.status).toEqual(201)
          expect(response.data.subscription_plan.id).toEqual(plan.id)
          expect(response.data.subscription_plan.overrides).toBeDefined()
        })

        it("should create override with just reference and reference_id (minimal)", async () => {
          const response = await api.post(
            `/admin/subscription-plans/${plan.id}/overrides`,
            {
              reference: "region",
              reference_id: "reg_789",
            },
            adminHeaders
          )

          expect(response.status).toEqual(201)
          const override = response.data.subscription_plan.overrides.find(
            (o: any) => o.reference_id === "reg_789"
          )
          expect(override).toBeDefined()
          expect(override.reference).toEqual("region")
        })
      })

      describe("GET /admin/subscription-plans/:id/overrides/:override_id", () => {
        let plan: any
        let override: any

        beforeEach(async () => {
          const planResponse = await api.post(
            `/admin/subscription-plans`,
            {
              currency_code: "usd",
              monthly_amount: 29.99,
            },
            adminHeaders
          )
          plan = planResponse.data.subscription_plan

          const overrideResponse = await api.post(
            `/admin/subscription-plans/${plan.id}/overrides`,
            {
              reference: "seller",
              reference_id: "sel_test",
              monthly_amount: 14.99,
            },
            adminHeaders
          )
          override = overrideResponse.data.subscription_plan.overrides.find(
            (o: any) => o.reference_id === "sel_test"
          )
        })

        it("should retrieve an override by id", async () => {
          const response = await api.get(
            `/admin/subscription-plans/${plan.id}/overrides/${override.id}`,
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.subscription_override).toEqual(
            expect.objectContaining({
              id: override.id,
              reference: "seller",
              reference_id: "sel_test",
              monthly_amount: 14.99,
            })
          )
        })

        it("should return 404 for non-existent override", async () => {
          const response = await api
            .get(
              `/admin/subscription-plans/${plan.id}/overrides/subovr_nonexistent`,
              adminHeaders
            )
            .catch((e) => e.response)

          expect(response.status).toEqual(404)
        })
      })

      describe("POST /admin/subscription-plans/:id/overrides/:override_id", () => {
        let plan: any
        let override: any

        beforeEach(async () => {
          const planResponse = await api.post(
            `/admin/subscription-plans`,
            {
              currency_code: "usd",
              monthly_amount: 29.99,
            },
            adminHeaders
          )
          plan = planResponse.data.subscription_plan

          const overrideResponse = await api.post(
            `/admin/subscription-plans/${plan.id}/overrides`,
            {
              reference: "seller",
              reference_id: "sel_update",
              monthly_amount: 14.99,
              free_months: 1,
            },
            adminHeaders
          )
          override = overrideResponse.data.subscription_plan.overrides.find(
            (o: any) => o.reference_id === "sel_update"
          )
        })

        it("should update override monthly_amount", async () => {
          const response = await api.post(
            `/admin/subscription-plans/${plan.id}/overrides/${override.id}`,
            { monthly_amount: 24.99 },
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.subscription_override.monthly_amount).toEqual(
            24.99
          )
        })

        it("should update override free_from/free_to dates", async () => {
          const response = await api.post(
            `/admin/subscription-plans/${plan.id}/overrides/${override.id}`,
            {
              free_from: "2024-01-01T00:00:00.000Z",
              free_to: "2024-12-31T00:00:00.000Z",
            },
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(
            response.data.subscription_override.free_from
          ).toBeDefined()
          expect(response.data.subscription_override.free_to).toBeDefined()
        })

        it("should update override free_months", async () => {
          const response = await api.post(
            `/admin/subscription-plans/${plan.id}/overrides/${override.id}`,
            { free_months: 6 },
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.subscription_override.free_months).toEqual(6)
        })

        it("should update override metadata", async () => {
          const response = await api.post(
            `/admin/subscription-plans/${plan.id}/overrides/${override.id}`,
            { metadata: { note: "special discount" } },
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.subscription_override.metadata).toEqual({
            note: "special discount",
          })
        })
      })

      describe("DELETE /admin/subscription-plans/:id/overrides/:override_id", () => {
        let plan: any
        let override: any

        beforeEach(async () => {
          const planResponse = await api.post(
            `/admin/subscription-plans`,
            {
              currency_code: "usd",
              monthly_amount: 29.99,
            },
            adminHeaders
          )
          plan = planResponse.data.subscription_plan

          const overrideResponse = await api.post(
            `/admin/subscription-plans/${plan.id}/overrides`,
            {
              reference: "seller",
              reference_id: "sel_delete",
              monthly_amount: 14.99,
            },
            adminHeaders
          )
          override = overrideResponse.data.subscription_plan.overrides.find(
            (o: any) => o.reference_id === "sel_delete"
          )
        })

        it("should delete an override", async () => {
          const response = await api.delete(
            `/admin/subscription-plans/${plan.id}/overrides/${override.id}`,
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data).toEqual(
            expect.objectContaining({
              id: override.id,
              object: "subscription_override",
              deleted: true,
            })
          )
        })
      })

      describe("Override Lifecycle", () => {
        it("should create plan → add override → update override → delete override → plan still exists without override", async () => {
          // Create plan
          const planResponse = await api.post(
            `/admin/subscription-plans`,
            {
              currency_code: "usd",
              monthly_amount: 29.99,
            },
            adminHeaders
          )
          const plan = planResponse.data.subscription_plan
          expect(plan).toBeDefined()

          // Add override
          const overrideResponse = await api.post(
            `/admin/subscription-plans/${plan.id}/overrides`,
            {
              reference: "seller",
              reference_id: "sel_lifecycle",
              monthly_amount: 9.99,
            },
            adminHeaders
          )
          expect(overrideResponse.status).toEqual(201)
          const override =
            overrideResponse.data.subscription_plan.overrides.find(
              (o: any) => o.reference_id === "sel_lifecycle"
            )
          expect(override).toBeDefined()

          // Update override
          const updateResponse = await api.post(
            `/admin/subscription-plans/${plan.id}/overrides/${override.id}`,
            { monthly_amount: 14.99 },
            adminHeaders
          )
          expect(updateResponse.status).toEqual(200)
          expect(
            updateResponse.data.subscription_override.monthly_amount
          ).toEqual(14.99)

          // Delete override
          const deleteResponse = await api.delete(
            `/admin/subscription-plans/${plan.id}/overrides/${override.id}`,
            adminHeaders
          )
          expect(deleteResponse.status).toEqual(200)
          expect(deleteResponse.data.deleted).toBe(true)

          // Plan still exists without override
          const getResponse = await api.get(
            `/admin/subscription-plans/${plan.id}`,
            adminHeaders
          )
          expect(getResponse.status).toEqual(200)
          expect(getResponse.data.subscription_plan.id).toEqual(plan.id)
          expect(getResponse.data.subscription_plan.overrides).toHaveLength(0)
        })
      })
    })
  },
})
