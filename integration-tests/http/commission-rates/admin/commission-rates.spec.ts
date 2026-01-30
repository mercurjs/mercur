import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { MedusaContainer } from "@medusajs/framework/types"
import { adminHeaders, createAdminUser } from "../../../helpers/create-admin-user"
import { createSellerUser } from "../../../helpers/create-seller-user"

jest.setTimeout(50000)

medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api, dbConnection }) => {
    describe("Admin - Commission Rates", () => {
      let appContainer: MedusaContainer
      let seller: any

      beforeAll(async () => {
        appContainer = getContainer()
      })

      beforeEach(async () => {
        await createAdminUser(dbConnection, adminHeaders, appContainer)
        const result = await createSellerUser(appContainer)
        seller = result.seller
      })

      describe("GET /admin/commission-rates", () => {
        it("should list commission rates", async () => {
          // Create a commission rate first
          await api.post(
            `/admin/commission-rates`,
            {
              name: "Test Rate",
              code: "TEST_RATE",
              type: "percentage",
              target: "item",
              value: 10,
              is_enabled: true,
              priority: 0,
            },
            adminHeaders
          )

          const response = await api.get(
            `/admin/commission-rates`,
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.commission_rates).toBeDefined()
          expect(Array.isArray(response.data.commission_rates)).toBe(true)
          expect(response.data.count).toBeGreaterThanOrEqual(1)
        })

        it("should filter commission rates by code", async () => {
          await api.post(
            `/admin/commission-rates`,
            {
              name: "Filter Test Rate",
              code: "FILTER_TEST",
              type: "percentage",
              target: "item",
              value: 15,
              is_enabled: true,
            },
            adminHeaders
          )

          const response = await api.get(
            `/admin/commission-rates?code=FILTER_TEST`,
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.commission_rates).toHaveLength(1)
          expect(response.data.commission_rates[0].code).toEqual("FILTER_TEST")
        })

        it("should filter commission rates by type", async () => {
          await api.post(
            `/admin/commission-rates`,
            {
              name: "Fixed Rate",
              code: "FIXED_TYPE_TEST",
              type: "fixed",
              target: "item",
              value: 500,
              is_enabled: true,
            },
            adminHeaders
          )

          const response = await api.get(
            `/admin/commission-rates?type=fixed`,
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.commission_rates.length).toBeGreaterThanOrEqual(1)
          response.data.commission_rates.forEach((rate: any) => {
            expect(rate.type).toEqual("fixed")
          })
        })

        it("should filter commission rates by target", async () => {
          await api.post(
            `/admin/commission-rates`,
            {
              name: "Shipping Rate",
              code: "SHIPPING_TARGET_TEST",
              type: "percentage",
              target: "shipping",
              value: 5,
              is_enabled: true,
            },
            adminHeaders
          )

          const response = await api.get(
            `/admin/commission-rates?target=shipping`,
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.commission_rates.length).toBeGreaterThanOrEqual(1)
          response.data.commission_rates.forEach((rate: any) => {
            expect(rate.target).toEqual("shipping")
          })
        })

        it("should filter commission rates by is_enabled", async () => {
          await api.post(
            `/admin/commission-rates`,
            {
              name: "Disabled Rate",
              code: "DISABLED_TEST",
              type: "percentage",
              target: "item",
              value: 10,
              is_enabled: false,
            },
            adminHeaders
          )

          const response = await api.get(
            `/admin/commission-rates?is_enabled=false`,
            adminHeaders
          )

          expect(response.status).toEqual(200)
          response.data.commission_rates.forEach((rate: any) => {
            expect(rate.is_enabled).toEqual(false)
          })
        })
      })

      describe("POST /admin/commission-rates", () => {
        it("should create a percentage commission rate", async () => {
          const response = await api.post(
            `/admin/commission-rates`,
            {
              name: "Standard Commission",
              code: "STANDARD_PCT",
              type: "percentage",
              target: "item",
              value: 10,
              is_enabled: true,
              priority: 0,
            },
            adminHeaders
          )

          expect(response.status).toEqual(201)
          expect(response.data.commission_rate).toEqual(
            expect.objectContaining({
              name: "Standard Commission",
              code: "STANDARD_PCT",
              type: "percentage",
              target: "item",
              value: 10,
              is_enabled: true,
              priority: 0,
            })
          )
        })

        it("should create a fixed commission rate", async () => {
          const response = await api.post(
            `/admin/commission-rates`,
            {
              name: "Fixed Commission",
              code: "FIXED_RATE",
              type: "fixed",
              target: "item",
              value: 500,
              currency_code: "usd",
              is_enabled: true,
            },
            adminHeaders
          )

          expect(response.status).toEqual(201)
          expect(response.data.commission_rate).toEqual(
            expect.objectContaining({
              name: "Fixed Commission",
              code: "FIXED_RATE",
              type: "fixed",
              value: 500,
              currency_code: "usd",
            })
          )
        })

        it("should create a commission rate with min_amount", async () => {
          const response = await api.post(
            `/admin/commission-rates`,
            {
              name: "Rate With Minimum",
              code: "MIN_AMOUNT_RATE",
              type: "percentage",
              target: "item",
              value: 5,
              min_amount: 100,
              is_enabled: true,
            },
            adminHeaders
          )

          expect(response.status).toEqual(201)
          expect(response.data.commission_rate).toEqual(
            expect.objectContaining({
              name: "Rate With Minimum",
              code: "MIN_AMOUNT_RATE",
              value: 5,
              min_amount: 100,
            })
          )
        })

        it("should create a commission rate with include_tax enabled", async () => {
          const response = await api.post(
            `/admin/commission-rates`,
            {
              name: "Tax Inclusive Rate",
              code: "TAX_INCLUSIVE",
              type: "percentage",
              target: "item",
              value: 10,
              include_tax: true,
              is_enabled: true,
            },
            adminHeaders
          )

          expect(response.status).toEqual(201)
          expect(response.data.commission_rate).toEqual(
            expect.objectContaining({
              name: "Tax Inclusive Rate",
              code: "TAX_INCLUSIVE",
              include_tax: true,
            })
          )
        })

        it("should create a shipping commission rate", async () => {
          const response = await api.post(
            `/admin/commission-rates`,
            {
              name: "Shipping Commission",
              code: "SHIPPING_COMM",
              type: "percentage",
              target: "shipping",
              value: 15,
              is_enabled: true,
            },
            adminHeaders
          )

          expect(response.status).toEqual(201)
          expect(response.data.commission_rate).toEqual(
            expect.objectContaining({
              name: "Shipping Commission",
              code: "SHIPPING_COMM",
              target: "shipping",
              value: 15,
            })
          )
        })

        it("should create a commission rate with rules", async () => {
          const response = await api.post(
            `/admin/commission-rates`,
            {
              name: "Seller Specific Rate",
              code: "SELLER_RATE",
              type: "percentage",
              target: "item",
              value: 8,
              is_enabled: true,
              priority: 10,
              rules: [
                {
                  reference: "seller",
                  reference_id: seller.id,
                },
              ],
            },
            adminHeaders
          )

          expect(response.status).toEqual(201)
          expect(response.data.commission_rate).toEqual(
            expect.objectContaining({
              name: "Seller Specific Rate",
              code: "SELLER_RATE",
              value: 8,
              priority: 10,
            })
          )
        })
      })

      describe("GET /admin/commission-rates/:id", () => {
        it("should get a commission rate by id", async () => {
          const createResponse = await api.post(
            `/admin/commission-rates`,
            {
              name: "Get Test Rate",
              code: "GET_TEST",
              type: "percentage",
              target: "item",
              value: 12,
              is_enabled: true,
            },
            adminHeaders
          )

          const rateId = createResponse.data.commission_rate.id

          const response = await api.get(
            `/admin/commission-rates/${rateId}`,
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.commission_rate).toEqual(
            expect.objectContaining({
              id: rateId,
              name: "Get Test Rate",
              code: "GET_TEST",
              type: "percentage",
              value: 12,
            })
          )
        })

        it("should return 404 for non-existent commission rate", async () => {
          const response = await api.get(
            `/admin/commission-rates/non_existent_id`,
            adminHeaders
          ).catch((e) => e.response)

          expect(response.status).toEqual(404)
        })
      })

      describe("POST /admin/commission-rates/:id", () => {
        it("should update a commission rate", async () => {
          const createResponse = await api.post(
            `/admin/commission-rates`,
            {
              name: "Update Test Rate",
              code: "UPDATE_TEST",
              type: "percentage",
              target: "item",
              value: 10,
              is_enabled: true,
            },
            adminHeaders
          )

          const rateId = createResponse.data.commission_rate.id

          const response = await api.post(
            `/admin/commission-rates/${rateId}`,
            {
              name: "Updated Rate Name",
              value: 15,
            },
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.commission_rate).toEqual(
            expect.objectContaining({
              id: rateId,
              name: "Updated Rate Name",
              value: 15,
            })
          )
        })

        it("should update commission rate type", async () => {
          const createResponse = await api.post(
            `/admin/commission-rates`,
            {
              name: "Type Change Rate",
              code: "TYPE_CHANGE",
              type: "percentage",
              target: "item",
              value: 10,
              is_enabled: true,
            },
            adminHeaders
          )

          const rateId = createResponse.data.commission_rate.id

          const response = await api.post(
            `/admin/commission-rates/${rateId}`,
            {
              type: "fixed",
              value: 500,
              currency_code: "usd",
            },
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.commission_rate).toEqual(
            expect.objectContaining({
              type: "fixed",
              value: 500,
              currency_code: "usd",
            })
          )
        })

        it("should disable a commission rate", async () => {
          const createResponse = await api.post(
            `/admin/commission-rates`,
            {
              name: "Disable Test Rate",
              code: "DISABLE_TEST",
              type: "percentage",
              target: "item",
              value: 10,
              is_enabled: true,
            },
            adminHeaders
          )

          const rateId = createResponse.data.commission_rate.id

          const response = await api.post(
            `/admin/commission-rates/${rateId}`,
            {
              is_enabled: false,
            },
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.commission_rate.is_enabled).toEqual(false)
        })

        it("should update commission rate priority", async () => {
          const createResponse = await api.post(
            `/admin/commission-rates`,
            {
              name: "Priority Test Rate",
              code: "PRIORITY_TEST",
              type: "percentage",
              target: "item",
              value: 10,
              is_enabled: true,
              priority: 0,
            },
            adminHeaders
          )

          const rateId = createResponse.data.commission_rate.id

          const response = await api.post(
            `/admin/commission-rates/${rateId}`,
            {
              priority: 100,
            },
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.commission_rate.priority).toEqual(100)
        })
      })

      describe("DELETE /admin/commission-rates/:id", () => {
        it("should delete a commission rate", async () => {
          const createResponse = await api.post(
            `/admin/commission-rates`,
            {
              name: "Delete Test Rate",
              code: "DELETE_TEST",
              type: "percentage",
              target: "item",
              value: 10,
              is_enabled: true,
            },
            adminHeaders
          )

          const rateId = createResponse.data.commission_rate.id

          const deleteResponse = await api.delete(
            `/admin/commission-rates/${rateId}`,
            adminHeaders
          )

          expect(deleteResponse.status).toEqual(200)
          expect(deleteResponse.data).toEqual({
            id: rateId,
            object: "commission_rate",
            deleted: true,
          })

          // Verify it's deleted
          const getResponse = await api.get(
            `/admin/commission-rates/${rateId}`,
            adminHeaders
          ).catch((e) => e.response)

          expect(getResponse.status).toEqual(404)
        })
      })

      describe("POST /admin/commission-rates/:id/rules", () => {
        it("should add rules to a commission rate", async () => {
          const createResponse = await api.post(
            `/admin/commission-rates`,
            {
              name: "Rules Test Rate",
              code: "RULES_TEST",
              type: "percentage",
              target: "item",
              value: 10,
              is_enabled: true,
            },
            adminHeaders
          )

          const rateId = createResponse.data.commission_rate.id

          const response = await api.post(
            `/admin/commission-rates/${rateId}/rules`,
            {
              create: [
                {
                  reference: "seller",
                  reference_id: seller.id,
                },
              ],
            },
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.created).toBeDefined()
          expect(response.data.created.length).toEqual(1)
          expect(response.data.created[0]).toEqual(
            expect.objectContaining({
              reference: "seller",
              reference_id: seller.id,
            })
          )
        })

        it("should update rules of a commission rate", async () => {
          const createResponse = await api.post(
            `/admin/commission-rates`,
            {
              name: "Update Rules Rate",
              code: "UPDATE_RULES",
              type: "percentage",
              target: "item",
              value: 10,
              is_enabled: true,
              rules: [
                {
                  reference: "seller",
                  reference_id: seller.id,
                },
              ],
            },
            adminHeaders
          )

          const rateId = createResponse.data.commission_rate.id

          // Get the rate to find the rule ID
          const getResponse = await api.get(
            `/admin/commission-rates/${rateId}?fields=*rules`,
            adminHeaders
          )

          const ruleId = getResponse.data.commission_rate.rules[0].id

          // Create another seller to update the rule reference
          const seller2Result = await createSellerUser(appContainer, {
            email: "seller2@test.com",
            name: "Test Seller 2",
          })

          const response = await api.post(
            `/admin/commission-rates/${rateId}/rules`,
            {
              update: [
                {
                  id: ruleId,
                  reference_id: seller2Result.seller.id,
                },
              ],
            },
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.updated).toBeDefined()
          expect(response.data.updated.length).toEqual(1)
        })

        it("should delete rules from a commission rate", async () => {
          const createResponse = await api.post(
            `/admin/commission-rates`,
            {
              name: "Delete Rules Rate",
              code: "DELETE_RULES",
              type: "percentage",
              target: "item",
              value: 10,
              is_enabled: true,
              rules: [
                {
                  reference: "seller",
                  reference_id: seller.id,
                },
              ],
            },
            adminHeaders
          )

          const rateId = createResponse.data.commission_rate.id

          // Get the rate to find the rule ID
          const getResponse = await api.get(
            `/admin/commission-rates/${rateId}?fields=*rules`,
            adminHeaders
          )

          const ruleId = getResponse.data.commission_rate.rules[0].id

          const response = await api.post(
            `/admin/commission-rates/${rateId}/rules`,
            {
              delete: [ruleId],
            },
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.deleted).toBeDefined()
          expect(response.data.deleted.length).toEqual(1)
          expect(response.data.deleted[0]).toEqual(ruleId)
        })

        it("should batch create, update, and delete rules", async () => {
          // Create a rate with two rules
          const seller2Result = await createSellerUser(appContainer, {
            email: "seller3@test.com",
            name: "Test Seller 3",
          })

          const createResponse = await api.post(
            `/admin/commission-rates`,
            {
              name: "Batch Rules Rate",
              code: "BATCH_RULES",
              type: "percentage",
              target: "item",
              value: 10,
              is_enabled: true,
              rules: [
                {
                  reference: "seller",
                  reference_id: seller.id,
                },
                {
                  reference: "seller",
                  reference_id: seller2Result.seller.id,
                },
              ],
            },
            adminHeaders
          )

          const rateId = createResponse.data.commission_rate.id

          // Get the rate to find the rule IDs
          const getResponse = await api.get(
            `/admin/commission-rates/${rateId}?fields=*rules`,
            adminHeaders
          )

          const rules = getResponse.data.commission_rate.rules
          const ruleToUpdate = rules[0]
          const ruleToDelete = rules[1]

          // Create a third seller for new rule
          const seller3Result = await createSellerUser(appContainer, {
            email: "seller4@test.com",
            name: "Test Seller 4",
          })

          const response = await api.post(
            `/admin/commission-rates/${rateId}/rules`,
            {
              create: [
                {
                  reference: "product",
                  reference_id: "prod_test123",
                },
              ],
              update: [
                {
                  id: ruleToUpdate.id,
                  reference_id: seller3Result.seller.id,
                },
              ],
              delete: [ruleToDelete.id],
            },
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.created.length).toEqual(1)
          expect(response.data.updated.length).toEqual(1)
          expect(response.data.deleted.length).toEqual(1)
        })
      })

      describe("Commission rate validation", () => {
        it("should require name field", async () => {
          const response = await api.post(
            `/admin/commission-rates`,
            {
              code: "NO_NAME",
              type: "percentage",
              target: "item",
              value: 10,
            },
            adminHeaders
          ).catch((e) => e.response)

          expect(response.status).toEqual(400)
        })

        it("should require code field", async () => {
          const response = await api.post(
            `/admin/commission-rates`,
            {
              name: "No Code Rate",
              type: "percentage",
              target: "item",
              value: 10,
            },
            adminHeaders
          ).catch((e) => e.response)

          expect(response.status).toEqual(400)
        })

        it("should require type field", async () => {
          const response = await api.post(
            `/admin/commission-rates`,
            {
              name: "No Type Rate",
              code: "NO_TYPE",
              target: "item",
              value: 10,
            },
            adminHeaders
          ).catch((e) => e.response)

          expect(response.status).toEqual(400)
        })

        it("should require value field", async () => {
          const response = await api.post(
            `/admin/commission-rates`,
            {
              name: "No Value Rate",
              code: "NO_VALUE",
              type: "percentage",
              target: "item",
            },
            adminHeaders
          ).catch((e) => e.response)

          expect(response.status).toEqual(400)
        })

        it("should reject invalid type", async () => {
          const response = await api.post(
            `/admin/commission-rates`,
            {
              name: "Invalid Type Rate",
              code: "INVALID_TYPE",
              type: "invalid",
              target: "item",
              value: 10,
            },
            adminHeaders
          ).catch((e) => e.response)

          expect(response.status).toEqual(400)
        })

        it("should reject invalid target", async () => {
          const response = await api.post(
            `/admin/commission-rates`,
            {
              name: "Invalid Target Rate",
              code: "INVALID_TARGET",
              type: "percentage",
              target: "invalid",
              value: 10,
            },
            adminHeaders
          ).catch((e) => e.response)

          expect(response.status).toEqual(400)
        })
      })
    })
  },
})
