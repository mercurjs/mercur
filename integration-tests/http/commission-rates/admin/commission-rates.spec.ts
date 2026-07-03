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
          await api.post(
            `/admin/commission-rates`,
            {
              name: "Test Rate",
              code: "TEST_RATE",
              type: "percentage",
              value: 10,
              is_enabled: true,
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

        it("should expose and filter by the seeded default rate", async () => {
          const response = await api.get(
            `/admin/commission-rates?is_default=true`,
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.commission_rates.length).toEqual(1)
          expect(response.data.commission_rates[0].is_default).toBe(true)
        })

        it("should filter commission rates by is_enabled", async () => {
          await api.post(
            `/admin/commission-rates`,
            {
              name: "Disabled Rate",
              code: "DISABLED_TEST",
              type: "percentage",
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

        it("should filter commission rates by scope_type", async () => {
          const storeRate = await api.post(
            `/admin/commission-rates`,
            {
              name: "Store Scoped Rate",
              code: "SCOPE_STORE",
              type: "percentage",
              value: 5,
              rules: [{ reference: "seller", reference_id: seller.id }],
            },
            adminHeaders
          )

          await api.post(
            `/admin/commission-rates`,
            {
              name: "Product Type Scoped Rate",
              code: "SCOPE_PRODUCT_TYPE",
              type: "percentage",
              value: 6,
              rules: [
                { reference: "product_type", reference_id: "ptyp_test123" },
              ],
            },
            adminHeaders
          )

          const comboRate = await api.post(
            `/admin/commission-rates`,
            {
              name: "Store Product Type Scoped Rate",
              code: "SCOPE_STORE_PRODUCT_TYPE",
              type: "percentage",
              value: 7,
              rules: [
                { reference: "seller", reference_id: seller.id },
                { reference: "product_type", reference_id: "ptyp_test456" },
              ],
            },
            adminHeaders
          )

          const storeOnly = await api.get(
            `/admin/commission-rates?scope_type=store`,
            adminHeaders
          )

          expect(storeOnly.status).toEqual(200)
          const storeIds = storeOnly.data.commission_rates.map(
            (r: any) => r.id
          )
          expect(storeIds).toContain(storeRate.data.commission_rate.id)
          // The store + product_type combo must NOT match the plain "store" scope.
          expect(storeIds).not.toContain(comboRate.data.commission_rate.id)

          const combo = await api.get(
            `/admin/commission-rates?scope_type=store_product_type`,
            adminHeaders
          )

          expect(combo.status).toEqual(200)
          const comboIds = combo.data.commission_rates.map((r: any) => r.id)
          expect(comboIds).toContain(comboRate.data.commission_rate.id)
          expect(comboIds).not.toContain(storeRate.data.commission_rate.id)
        })

        it("should filter by multiple scope_type values (comma-joined and array)", async () => {
          const storeRate = await api.post(
            `/admin/commission-rates`,
            {
              name: "Multi Store Rate",
              code: "MULTI_STORE",
              type: "percentage",
              value: 5,
              rules: [{ reference: "seller", reference_id: seller.id }],
            },
            adminHeaders
          )

          const categoryRate = await api.post(
            `/admin/commission-rates`,
            {
              name: "Multi Category Rate",
              code: "MULTI_CATEGORY",
              type: "percentage",
              value: 6,
              rules: [
                { reference: "product_category", reference_id: "pcat_multi" },
              ],
            },
            adminHeaders
          )

          const productTypeRate = await api.post(
            `/admin/commission-rates`,
            {
              name: "Multi Product Type Rate",
              code: "MULTI_PRODUCT_TYPE",
              type: "percentage",
              value: 7,
              rules: [
                { reference: "product_type", reference_id: "ptyp_multi" },
              ],
            },
            adminHeaders
          )

          const comma = await api.get(
            `/admin/commission-rates?scope_type=store,category`,
            adminHeaders
          )

          expect(comma.status).toEqual(200)
          const commaIds = comma.data.commission_rates.map((r: any) => r.id)
          expect(commaIds).toContain(storeRate.data.commission_rate.id)
          expect(commaIds).toContain(categoryRate.data.commission_rate.id)
          expect(commaIds).not.toContain(
            productTypeRate.data.commission_rate.id
          )

          const array = await api.get(
            `/admin/commission-rates?scope_type[0]=store&scope_type[1]=category`,
            adminHeaders
          )

          expect(array.status).toEqual(200)
          const arrayIds = array.data.commission_rates.map((r: any) => r.id)
          expect(arrayIds).toContain(storeRate.data.commission_rate.id)
          expect(arrayIds).toContain(categoryRate.data.commission_rate.id)
          expect(arrayIds).not.toContain(
            productTypeRate.data.commission_rate.id
          )
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
              value: 10,
              is_enabled: true,
            },
            adminHeaders
          )

          expect(response.status).toEqual(201)
          expect(response.data.commission_rate).toEqual(
            expect.objectContaining({
              name: "Standard Commission",
              code: "STANDARD_PCT",
              type: "percentage",
              value: 10,
              is_enabled: true,
            })
          )
        })

        it("should create a fixed commission rate with per-currency values", async () => {
          const response = await api.post(
            `/admin/commission-rates`,
            {
              name: "Fixed Commission",
              code: "FIXED_RATE",
              type: "fixed",
              value: 0,
              values: [
                { currency_code: "usd", amount: 500 },
                { currency_code: "eur", amount: 450 },
              ],
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
            })
          )

          const detail = await api.get(
            `/admin/commission-rates/${response.data.commission_rate.id}?fields=*values`,
            adminHeaders
          )
          expect(detail.data.commission_rate.values).toHaveLength(2)
        })

        it("should create a commission rate with include_tax + include_shipping", async () => {
          const response = await api.post(
            `/admin/commission-rates`,
            {
              name: "Tax And Shipping Rate",
              code: "TAX_SHIP_INCL",
              type: "percentage",
              value: 10,
              include_tax: true,
              include_shipping: true,
              is_enabled: true,
            },
            adminHeaders
          )

          expect(response.status).toEqual(201)
          expect(response.data.commission_rate).toEqual(
            expect.objectContaining({
              code: "TAX_SHIP_INCL",
              include_tax: true,
              include_shipping: true,
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
              value: 8,
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

          expect(response.status).toEqual(201)
          expect(response.data.commission_rate).toEqual(
            expect.objectContaining({
              name: "Seller Specific Rate",
              code: "SELLER_RATE",
              value: 8,
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

        it("should update the include_shipping flag", async () => {
          const createResponse = await api.post(
            `/admin/commission-rates`,
            {
              name: "Shipping Toggle Rate",
              code: "SHIP_TOGGLE",
              type: "percentage",
              value: 10,
              is_enabled: true,
            },
            adminHeaders
          )

          const rateId = createResponse.data.commission_rate.id

          const response = await api.post(
            `/admin/commission-rates/${rateId}`,
            {
              include_shipping: true,
            },
            adminHeaders
          )

          expect(response.status).toEqual(200)
          expect(response.data.commission_rate.include_shipping).toEqual(true)
        })

        it("should disable a commission rate", async () => {
          const createResponse = await api.post(
            `/admin/commission-rates`,
            {
              name: "Disable Test Rate",
              code: "DISABLE_TEST",
              type: "percentage",
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
      })

      describe("DELETE /admin/commission-rates/:id", () => {
        it("should delete a non-default commission rate", async () => {
          const createResponse = await api.post(
            `/admin/commission-rates`,
            {
              name: "Delete Test Rate",
              code: "DELETE_TEST",
              type: "percentage",
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

          const getResponse = await api.get(
            `/admin/commission-rates/${rateId}`,
            adminHeaders
          ).catch((e) => e.response)

          expect(getResponse.status).toEqual(404)
        })

        it("should reject deleting the default commission rate", async () => {
          const listResponse = await api.get(
            `/admin/commission-rates?is_default=true`,
            adminHeaders
          )
          const defaultRate = listResponse.data.commission_rates[0]
          expect(defaultRate).toBeDefined()

          const deleteResponse = await api.delete(
            `/admin/commission-rates/${defaultRate.id}`,
            adminHeaders
          ).catch((e) => e.response)

          expect(deleteResponse.status).toBeGreaterThanOrEqual(400)

          // The default rate must still be present.
          const stillThere = await api.get(
            `/admin/commission-rates/${defaultRate.id}`,
            adminHeaders
          )
          expect(stillThere.status).toEqual(200)
          expect(stillThere.data.commission_rate.is_default).toBe(true)
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

        it("should batch create, update, and delete rules", async () => {
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

          const getResponse = await api.get(
            `/admin/commission-rates/${rateId}?fields=*rules`,
            adminHeaders
          )

          const rules = getResponse.data.commission_rate.rules
          const ruleToUpdate = rules[0]
          const ruleToDelete = rules[1]

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
