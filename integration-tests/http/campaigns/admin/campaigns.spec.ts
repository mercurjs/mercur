import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { MedusaContainer } from "@medusajs/framework/types"
import {
  createAdminUser,
  adminHeaders,
} from "../../../helpers/create-admin-user"
import { createSellerUser } from "../../../helpers/create-seller-user"

jest.setTimeout(60000)

const DAY = 24 * 60 * 60 * 1000

medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api, dbConnection }) => {
    describe("Admin - Campaigns", () => {
      let appContainer: MedusaContainer

      beforeAll(async () => {
        appContainer = getContainer()
        await createAdminUser(dbConnection, adminHeaders, appContainer)
      })

      it("exposes the owning seller on a store campaign and none on a platform campaign", async () => {
        const { seller, headers } = await createSellerUser(appContainer, {
          email: "campaign-owner-seller@test.com",
          name: "Owner Store",
        })

        const storeCampaign = (
          await api.post(
            `/vendor/campaigns`,
            { name: "Store Campaign", campaign_identifier: "store-owner-1" },
            headers
          )
        ).data.campaign

        const platformCampaign = (
          await api.post(
            `/admin/campaigns`,
            { name: "Platform Campaign", campaign_identifier: "platform-owner-1" },
            adminHeaders
          )
        ).data.campaign

        const storeDetail = await api.get(
          `/admin/campaigns/${storeCampaign.id}?fields=%2Bseller.id,%2Bseller.name`,
          adminHeaders
        )
        expect(storeDetail.status).toEqual(200)
        expect(storeDetail.data.campaign.seller?.id).toEqual(seller.id)
        expect(storeDetail.data.campaign.seller?.name).toEqual("Owner Store")

        const platformDetail = await api.get(
          `/admin/campaigns/${platformCampaign.id}?fields=%2Bseller.id,%2Bseller.name`,
          adminHeaders
        )
        expect(platformDetail.status).toEqual(200)
        expect(platformDetail.data.campaign.seller ?? null).toBeNull()
      })

      it("filters campaigns by owning seller and by platform owner", async () => {
        const { seller, headers } = await createSellerUser(appContainer, {
          email: "campaign-filter-seller@test.com",
          name: "Filter Store",
        })

        const storeCampaign = (
          await api.post(
            `/vendor/campaigns`,
            { name: "Store Filter", campaign_identifier: "store-filter-1" },
            headers
          )
        ).data.campaign

        const platformCampaign = (
          await api.post(
            `/admin/campaigns`,
            { name: "Platform Filter", campaign_identifier: "platform-filter-1" },
            adminHeaders
          )
        ).data.campaign

        const bySeller = await api.get(
          `/admin/campaigns?seller_id=${seller.id}`,
          adminHeaders
        )
        expect(bySeller.status).toEqual(200)
        const sellerIds = bySeller.data.campaigns.map((c: { id: string }) => c.id)
        expect(sellerIds).toContain(storeCampaign.id)
        expect(sellerIds).not.toContain(platformCampaign.id)

        const byPlatform = await api.get(
          `/admin/campaigns?seller_id=platform`,
          adminHeaders
        )
        expect(byPlatform.status).toEqual(200)
        const platformIds = byPlatform.data.campaigns.map(
          (c: { id: string }) => c.id
        )
        expect(platformIds).toContain(platformCampaign.id)
        expect(platformIds).not.toContain(storeCampaign.id)
      })

      it("filters campaigns by budget type", async () => {
        const usageCampaign = (
          await api.post(
            `/admin/campaigns`,
            {
              name: "Usage Budget",
              campaign_identifier: "budget-usage-1",
              budget: { type: "usage", limit: 100 },
            },
            adminHeaders
          )
        ).data.campaign

        const spendCampaign = (
          await api.post(
            `/admin/campaigns`,
            {
              name: "Spend Budget",
              campaign_identifier: "budget-spend-1",
              budget: { type: "spend", limit: 1000, currency_code: "usd" },
            },
            adminHeaders
          )
        ).data.campaign

        const usageOnly = await api.get(
          `/admin/campaigns?budget_type=usage`,
          adminHeaders
        )
        expect(usageOnly.status).toEqual(200)
        const usageIds = usageOnly.data.campaigns.map((c: { id: string }) => c.id)
        expect(usageIds).toContain(usageCampaign.id)
        expect(usageIds).not.toContain(spendCampaign.id)
      })

      it("filters campaigns by computed status", async () => {
        const expiredCampaign = (
          await api.post(
            `/admin/campaigns`,
            {
              name: "Expired",
              campaign_identifier: "status-expired-1",
              starts_at: new Date(Date.now() - 10 * DAY).toISOString(),
              ends_at: new Date(Date.now() - 5 * DAY).toISOString(),
            },
            adminHeaders
          )
        ).data.campaign

        const scheduledCampaign = (
          await api.post(
            `/admin/campaigns`,
            {
              name: "Scheduled",
              campaign_identifier: "status-scheduled-1",
              starts_at: new Date(Date.now() + 5 * DAY).toISOString(),
              ends_at: new Date(Date.now() + 10 * DAY).toISOString(),
            },
            adminHeaders
          )
        ).data.campaign

        const activeCampaign = (
          await api.post(
            `/admin/campaigns`,
            {
              name: "Active",
              campaign_identifier: "status-active-1",
              starts_at: new Date(Date.now() - 5 * DAY).toISOString(),
              ends_at: new Date(Date.now() + 5 * DAY).toISOString(),
            },
            adminHeaders
          )
        ).data.campaign

        const expired = await api.get(
          `/admin/campaigns?status=expired`,
          adminHeaders
        )
        const expiredIds = expired.data.campaigns.map((c: { id: string }) => c.id)
        expect(expiredIds).toContain(expiredCampaign.id)
        expect(expiredIds).not.toContain(scheduledCampaign.id)
        expect(expiredIds).not.toContain(activeCampaign.id)

        const scheduled = await api.get(
          `/admin/campaigns?status=scheduled`,
          adminHeaders
        )
        const scheduledIds = scheduled.data.campaigns.map(
          (c: { id: string }) => c.id
        )
        expect(scheduledIds).toContain(scheduledCampaign.id)
        expect(scheduledIds).not.toContain(expiredCampaign.id)

        const active = await api.get(
          `/admin/campaigns?status=active`,
          adminHeaders
        )
        const activeIds = active.data.campaigns.map((c: { id: string }) => c.id)
        expect(activeIds).toContain(activeCampaign.id)
        expect(activeIds).not.toContain(expiredCampaign.id)
        expect(activeIds).not.toContain(scheduledCampaign.id)
      })
    })
  },
})
