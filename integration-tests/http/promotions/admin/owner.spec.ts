import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { MedusaContainer } from "@medusajs/framework/types"
import { createAdminUser, adminHeaders } from "../../../helpers/create-admin-user"
import { createSellerUser } from "../../../helpers/create-seller-user"

jest.setTimeout(60000)

medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api, dbConnection }) => {
    describe("Admin - Promotion owner (seller)", () => {
      let appContainer: MedusaContainer

      beforeAll(async () => {
        appContainer = getContainer()
        await createAdminUser(dbConnection, adminHeaders, appContainer)
      })

      it("exposes the owning seller on a vendor promotion", async () => {
        const { seller, headers } = await createSellerUser(appContainer, {
          email: "owner-seller@test.com",
          name: "Owner Store",
        })

        const promotion = (
          await api.post(
            `/vendor/promotions`,
            {
              code: "OWNED10",
              type: "standard",
              status: "active",
              application_method: {
                type: "percentage",
                target_type: "order",
                allocation: "across",
                value: 10,
              },
            },
            headers
          )
        ).data.promotion

        const detail = await api.get(
          `/admin/promotions/${promotion.id}?fields=%2Bseller.id,%2Bseller.name`,
          adminHeaders
        )

        expect(detail.status).toEqual(200)
        expect(detail.data.promotion.seller?.id).toEqual(seller.id)
        expect(detail.data.promotion.seller?.name).toEqual("Owner Store")
      })

      it("has no seller on a platform (admin) promotion", async () => {
        const promotion = (
          await api.post(
            `/admin/promotions`,
            {
              code: "PLATFORM10",
              type: "standard",
              status: "active",
              application_method: {
                type: "percentage",
                target_type: "order",
                allocation: "across",
                value: 10,
              },
            },
            adminHeaders
          )
        ).data.promotion

        const detail = await api.get(
          `/admin/promotions/${promotion.id}?fields=%2Bseller.id,%2Bseller.name`,
          adminHeaders
        )

        expect(detail.status).toEqual(200)
        expect(detail.data.promotion.seller ?? null).toBeNull()
      })

      it("upserts and exposes the coverage (cost_bearer) via the cost endpoint", async () => {
        const promotion = (
          await api.post(
            `/admin/promotions`,
            {
              code: "COVERAGE10",
              type: "standard",
              status: "active",
              application_method: {
                type: "percentage",
                target_type: "order",
                allocation: "across",
                value: 10,
              },
            },
            adminHeaders
          )
        ).data.promotion

        const created = await api.post(
          `/admin/promotions/${promotion.id}/cost`,
          { cost_bearer: "marketplace" },
          adminHeaders
        )
        expect(created.status).toEqual(200)
        expect(created.data.promotion_cost.cost_bearer).toEqual("marketplace")

        const afterCreate = await api.get(
          `/admin/promotions/${promotion.id}?fields=%2Bpromotion_cost.cost_bearer`,
          adminHeaders
        )
        expect(afterCreate.data.promotion.promotion_cost?.cost_bearer).toEqual(
          "marketplace"
        )

        // Upsert again — the one-per-promotion record is updated, not duplicated.
        const updated = await api.post(
          `/admin/promotions/${promotion.id}/cost`,
          { cost_bearer: "shared", shared_marketplace_percentage: 40 },
          adminHeaders
        )
        expect(updated.status).toEqual(200)
        expect(updated.data.promotion_cost.cost_bearer).toEqual("shared")

        const afterUpdate = await api.get(
          `/admin/promotions/${promotion.id}?fields=%2Bpromotion_cost.cost_bearer,%2Bpromotion_cost.shared_marketplace_percentage`,
          adminHeaders
        )
        expect(afterUpdate.data.promotion.promotion_cost?.cost_bearer).toEqual(
          "shared"
        )
        expect(
          afterUpdate.data.promotion.promotion_cost?.shared_marketplace_percentage
        ).toEqual(40)
      })

      it("filters the promotion list by owning seller", async () => {
        const { seller, headers } = await createSellerUser(appContainer, {
          email: "filter-seller@test.com",
          name: "Filter Store",
        })

        const vendorPromotion = (
          await api.post(
            `/vendor/promotions`,
            {
              code: "FILTERVENDOR10",
              type: "standard",
              status: "active",
              application_method: {
                type: "percentage",
                target_type: "order",
                allocation: "across",
                value: 10,
              },
            },
            headers
          )
        ).data.promotion

        await api.post(
          `/admin/promotions`,
          {
            code: "FILTERPLATFORM10",
            type: "standard",
            status: "active",
            application_method: {
              type: "percentage",
              target_type: "order",
              allocation: "across",
              value: 10,
            },
          },
          adminHeaders
        )

        const bySeller = await api.get(
          `/admin/promotions?seller_id=${seller.id}&fields=%2Bseller.id`,
          adminHeaders
        )

        expect(bySeller.status).toEqual(200)
        expect(bySeller.data.promotions).toHaveLength(1)
        expect(bySeller.data.promotions[0].id).toEqual(vendorPromotion.id)
      })

      it("filters the promotion list to platform-owned promotions", async () => {
        const { headers } = await createSellerUser(appContainer, {
          email: "platform-filter-seller@test.com",
          name: "Platform Filter Store",
        })

        const platformPromotion = (
          await api.post(
            `/admin/promotions`,
            {
              code: "PLATFORMONLY10",
              type: "standard",
              status: "active",
              application_method: {
                type: "percentage",
                target_type: "order",
                allocation: "across",
                value: 10,
              },
            },
            adminHeaders
          )
        ).data.promotion

        const vendorPromotion = (
          await api.post(
            `/vendor/promotions`,
            {
              code: "PLATFORMFILTERVENDOR10",
              type: "standard",
              status: "active",
              application_method: {
                type: "percentage",
                target_type: "order",
                allocation: "across",
                value: 10,
              },
            },
            headers
          )
        ).data.promotion

        const platformOnly = await api.get(
          `/admin/promotions?seller_id=platform`,
          adminHeaders
        )

        expect(platformOnly.status).toEqual(200)
        const ids = platformOnly.data.promotions.map(
          (p: { id: string }) => p.id
        )
        expect(ids).toContain(platformPromotion.id)
        expect(ids).not.toContain(vendorPromotion.id)
      })
    })
  },
})
