import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { MedusaContainer } from "@medusajs/framework/types"
import { createSellerUser } from "../../../helpers/create-seller-user"

jest.setTimeout(50000)

medusaIntegrationTestRunner({
    testSuite: ({ getContainer, api }) => {
        describe("Vendor - Campaigns", () => {
            let appContainer: MedusaContainer
            let _seller1: any
            let seller1Headers: any
            let _seller2: any
            let seller2Headers: any

            beforeAll(async () => {
                appContainer = getContainer()
            })

            beforeEach(async () => {
                const result1 = await createSellerUser(appContainer, {
                    email: "seller1@test.com",
                    name: "Seller One",
                })
                _seller1 = result1.seller
                seller1Headers = result1.headers

                const result2 = await createSellerUser(appContainer, {
                    email: "seller2@test.com",
                    name: "Seller Two",
                })
                _seller2 = result2.seller
                seller2Headers = result2.headers
            })

            describe("POST /vendor/campaigns", () => {
                it("should create a campaign", async () => {
                    const response = await api.post(
                        `/vendor/campaigns`,
                        {
                            name: "Summer Sale",
                            campaign_identifier: "summer-sale-2024",
                        },
                        seller1Headers
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.campaign).toBeDefined()
                    expect(response.data.campaign.name).toEqual("Summer Sale")
                    expect(response.data.campaign.campaign_identifier).toEqual("summer-sale-2024")
                })

                it("should create a campaign with description", async () => {
                    const response = await api.post(
                        `/vendor/campaigns`,
                        {
                            name: "Winter Campaign",
                            campaign_identifier: "winter-2024",
                            description: "Special winter discounts",
                        },
                        seller1Headers
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.campaign.name).toEqual("Winter Campaign")
                    expect(response.data.campaign.description).toEqual("Special winter discounts")
                })

                it("should create a campaign with dates", async () => {
                    const startsAt = new Date()
                    const endsAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

                    const response = await api.post(
                        `/vendor/campaigns`,
                        {
                            name: "Limited Time Sale",
                            campaign_identifier: "limited-time-sale",
                            starts_at: startsAt.toISOString(),
                            ends_at: endsAt.toISOString(),
                        },
                        seller1Headers
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.campaign.name).toEqual("Limited Time Sale")
                    expect(response.data.campaign.starts_at).toBeDefined()
                    expect(response.data.campaign.ends_at).toBeDefined()
                })

                it("should create a campaign with spend budget", async () => {
                    const response = await api.post(
                        `/vendor/campaigns`,
                        {
                            name: "Budget Campaign",
                            campaign_identifier: "budget-campaign",
                            budget: {
                                type: "spend",
                                limit: 10000,
                                currency_code: "usd",
                            },
                        },
                        seller1Headers
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.campaign.budget).toBeDefined()
                    expect(response.data.campaign.budget.type).toEqual("spend")
                    expect(response.data.campaign.budget.limit).toEqual(10000)
                    expect(response.data.campaign.budget.currency_code).toEqual("usd")
                })

                it("should create a campaign with usage budget", async () => {
                    const response = await api.post(
                        `/vendor/campaigns`,
                        {
                            name: "Usage Campaign",
                            campaign_identifier: "usage-campaign",
                            budget: {
                                type: "usage",
                                limit: 100,
                            },
                        },
                        seller1Headers
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.campaign.budget).toBeDefined()
                    expect(response.data.campaign.budget.type).toEqual("usage")
                    expect(response.data.campaign.budget.limit).toEqual(100)
                })

                it("should create a use_by_attribute usage budget with an attribute", async () => {
                    const response = await api.post(
                        `/vendor/campaigns`,
                        {
                            name: "Per Customer Campaign",
                            campaign_identifier: "per-customer-campaign",
                            budget: {
                                type: "use_by_attribute",
                                attribute: "customer_id",
                                limit: 5,
                            },
                        },
                        seller1Headers
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.campaign.budget).toBeDefined()
                    expect(response.data.campaign.budget.type).toEqual("use_by_attribute")
                    expect(response.data.campaign.budget.limit).toEqual(5)
                })

                it("should fail to create campaign without name", async () => {
                    const response = await api
                        .post(
                            `/vendor/campaigns`,
                            {
                                campaign_identifier: "no-name-campaign",
                            },
                            seller1Headers
                        )
                        .catch((e) => e.response)

                    expect(response.status).toEqual(400)
                })

                it("should fail to create campaign without campaign_identifier", async () => {
                    const response = await api
                        .post(
                            `/vendor/campaigns`,
                            {
                                name: "No Identifier Campaign",
                            },
                            seller1Headers
                        )
                        .catch((e) => e.response)

                    expect(response.status).toEqual(400)
                })

                it("should fail to create spend budget without currency_code", async () => {
                    const response = await api
                        .post(
                            `/vendor/campaigns`,
                            {
                                name: "Invalid Budget Campaign",
                                campaign_identifier: "invalid-budget",
                                budget: {
                                    type: "spend",
                                    limit: 10000,
                                },
                            },
                            seller1Headers
                        )
                        .catch((e) => e.response)

                    expect(response.status).toEqual(400)
                })
            })

            describe("GET /vendor/campaigns", () => {
                it("should list campaigns", async () => {
                    await api.post(
                        `/vendor/campaigns`,
                        {
                            name: "Campaign A",
                            campaign_identifier: "campaign-a",
                        },
                        seller1Headers
                    )

                    await api.post(
                        `/vendor/campaigns`,
                        {
                            name: "Campaign B",
                            campaign_identifier: "campaign-b",
                        },
                        seller1Headers
                    )

                    const response = await api.get(
                        `/vendor/campaigns`,
                        seller1Headers
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.campaigns).toBeDefined()
                    expect(response.data.campaigns.length).toBeGreaterThanOrEqual(2)
                })

                it("should filter campaigns by campaign_identifier", async () => {
                    await api.post(
                        `/vendor/campaigns`,
                        {
                            name: "Unique Campaign",
                            campaign_identifier: "unique-identifier-123",
                        },
                        seller1Headers
                    )

                    const response = await api.get(
                        `/vendor/campaigns?campaign_identifier=unique-identifier-123`,
                        seller1Headers
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.campaigns.length).toBeGreaterThanOrEqual(1)
                    expect(
                        response.data.campaigns.some((c: any) => c.campaign_identifier === "unique-identifier-123")
                    ).toBe(true)
                })

                it("should search campaigns with q parameter", async () => {
                    await api.post(
                        `/vendor/campaigns`,
                        {
                            name: "Searchable Campaign",
                            campaign_identifier: "searchable-campaign",
                        },
                        seller1Headers
                    )

                    const response = await api.get(
                        `/vendor/campaigns?q=searchable`,
                        seller1Headers
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.campaigns.length).toBeGreaterThanOrEqual(1)
                    expect(
                        response.data.campaigns.some((c: any) =>
                            c.name.toLowerCase().includes("searchable") ||
                            c.campaign_identifier.toLowerCase().includes("searchable")
                        )
                    ).toBe(true)
                })

                it("should support pagination", async () => {
                    await api.post(
                        `/vendor/campaigns`,
                        {
                            name: "Page Campaign A",
                            campaign_identifier: "page-campaign-a",
                        },
                        seller1Headers
                    )

                    await api.post(
                        `/vendor/campaigns`,
                        {
                            name: "Page Campaign B",
                            campaign_identifier: "page-campaign-b",
                        },
                        seller1Headers
                    )

                    await api.post(
                        `/vendor/campaigns`,
                        {
                            name: "Page Campaign C",
                            campaign_identifier: "page-campaign-c",
                        },
                        seller1Headers
                    )

                    const response = await api.get(
                        `/vendor/campaigns?limit=2&offset=0`,
                        seller1Headers
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.campaigns.length).toBeLessThanOrEqual(2)
                    expect(response.data.limit).toEqual(2)
                    expect(response.data.offset).toEqual(0)
                })

                it("should not list another seller's campaigns", async () => {
                    await api.post(
                        `/vendor/campaigns`,
                        {
                            name: "Seller 1 Only Campaign",
                            campaign_identifier: "seller1-only-campaign",
                        },
                        seller1Headers
                    )

                    const response = await api.get(
                        `/vendor/campaigns`,
                        seller2Headers
                    )

                    expect(response.status).toEqual(200)
                    expect(
                        response.data.campaigns.every((c: any) => c.campaign_identifier !== "seller1-only-campaign")
                    ).toBe(true)
                })

                describe("filters (type & status)", () => {
                    it("should filter campaigns by budget_type=spend", async () => {
                        await api.post(
                            `/vendor/campaigns`,
                            {
                                name: "Spend Filter Campaign",
                                campaign_identifier: "spend-filter-campaign",
                                budget: { type: "spend", limit: 1000, currency_code: "usd" },
                            },
                            seller1Headers
                        )
                        await api.post(
                            `/vendor/campaigns`,
                            {
                                name: "Usage Filter Campaign",
                                campaign_identifier: "usage-filter-campaign",
                                budget: { type: "usage", limit: 50 },
                            },
                            seller1Headers
                        )

                        const response = await api.get(
                            `/vendor/campaigns?budget_type=spend`,
                            seller1Headers
                        )

                        expect(response.status).toEqual(200)
                        expect(response.data.campaigns.length).toBeGreaterThanOrEqual(1)
                        expect(
                            response.data.campaigns.every((c: any) => c.budget?.type === "spend")
                        ).toBe(true)
                        expect(
                            response.data.campaigns.some(
                                (c: any) => c.campaign_identifier === "spend-filter-campaign"
                            )
                        ).toBe(true)
                    })

                    it("should filter campaigns by budget_type=usage", async () => {
                        await api.post(
                            `/vendor/campaigns`,
                            {
                                name: "Usage Only Campaign",
                                campaign_identifier: "usage-only-filter-campaign",
                                budget: { type: "usage", limit: 25 },
                            },
                            seller1Headers
                        )

                        const response = await api.get(
                            `/vendor/campaigns?budget_type=usage`,
                            seller1Headers
                        )

                        expect(response.status).toEqual(200)
                        expect(
                            response.data.campaigns.every((c: any) => c.budget?.type === "usage")
                        ).toBe(true)
                        expect(
                            response.data.campaigns.some(
                                (c: any) => c.campaign_identifier === "usage-only-filter-campaign"
                            )
                        ).toBe(true)
                    })

                    it("should reject an invalid budget_type value", async () => {
                        const response = await api
                            .get(`/vendor/campaigns?budget_type=not-a-type`, seller1Headers)
                            .catch((e) => e.response)

                        expect(response.status).toEqual(400)
                    })

                    it("should filter campaigns by status=scheduled", async () => {
                        const future = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                        const laterFuture = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)

                        await api.post(
                            `/vendor/campaigns`,
                            {
                                name: "Scheduled Campaign",
                                campaign_identifier: "scheduled-status-campaign",
                                starts_at: future.toISOString(),
                                ends_at: laterFuture.toISOString(),
                            },
                            seller1Headers
                        )

                        const response = await api.get(
                            `/vendor/campaigns?status=scheduled`,
                            seller1Headers
                        )

                        expect(response.status).toEqual(200)
                        expect(
                            response.data.campaigns.every(
                                (c: any) => c.starts_at && new Date(c.starts_at) > new Date()
                            )
                        ).toBe(true)
                        expect(
                            response.data.campaigns.some(
                                (c: any) => c.campaign_identifier === "scheduled-status-campaign"
                            )
                        ).toBe(true)
                    })

                    it("should filter campaigns by status=expired", async () => {
                        const past = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
                        const recentPast = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

                        await api.post(
                            `/vendor/campaigns`,
                            {
                                name: "Expired Campaign",
                                campaign_identifier: "expired-status-campaign",
                                starts_at: past.toISOString(),
                                ends_at: recentPast.toISOString(),
                            },
                            seller1Headers
                        )

                        const response = await api.get(
                            `/vendor/campaigns?status=expired`,
                            seller1Headers
                        )

                        expect(response.status).toEqual(200)
                        expect(
                            response.data.campaigns.every(
                                (c: any) => c.ends_at && new Date(c.ends_at) < new Date()
                            )
                        ).toBe(true)
                        expect(
                            response.data.campaigns.some(
                                (c: any) => c.campaign_identifier === "expired-status-campaign"
                            )
                        ).toBe(true)
                    })

                    it("should filter campaigns by status=active", async () => {
                        const past = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                        const future = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

                        await api.post(
                            `/vendor/campaigns`,
                            {
                                name: "Active Dated Campaign",
                                campaign_identifier: "active-dated-campaign",
                                starts_at: past.toISOString(),
                                ends_at: future.toISOString(),
                            },
                            seller1Headers
                        )
                        // A campaign with no dates is also active (open-ended).
                        await api.post(
                            `/vendor/campaigns`,
                            {
                                name: "Active Open Campaign",
                                campaign_identifier: "active-open-campaign",
                            },
                            seller1Headers
                        )
                        // A scheduled campaign must be excluded.
                        await api.post(
                            `/vendor/campaigns`,
                            {
                                name: "Scheduled Excluded Campaign",
                                campaign_identifier: "scheduled-excluded-campaign",
                                starts_at: future.toISOString(),
                            },
                            seller1Headers
                        )

                        const response = await api.get(
                            `/vendor/campaigns?status=active`,
                            seller1Headers
                        )

                        expect(response.status).toEqual(200)
                        const identifiers = response.data.campaigns.map(
                            (c: any) => c.campaign_identifier
                        )
                        expect(identifiers).toContain("active-dated-campaign")
                        expect(identifiers).toContain("active-open-campaign")
                        expect(identifiers).not.toContain("scheduled-excluded-campaign")
                    })

                    it("should reject an invalid status value", async () => {
                        const response = await api
                            .get(`/vendor/campaigns?status=whenever`, seller1Headers)
                            .catch((e) => e.response)

                        expect(response.status).toEqual(400)
                    })

                    it("should keep seller scoping when filtering by budget_type", async () => {
                        await api.post(
                            `/vendor/campaigns`,
                            {
                                name: "Seller 1 Spend Campaign",
                                campaign_identifier: "seller1-spend-scoped",
                                budget: { type: "spend", limit: 1000, currency_code: "usd" },
                            },
                            seller1Headers
                        )

                        // seller2 filtering by the same budget type must not see seller1's campaign
                        const response = await api.get(
                            `/vendor/campaigns?budget_type=spend`,
                            seller2Headers
                        )

                        expect(response.status).toEqual(200)
                        expect(
                            response.data.campaigns.every(
                                (c: any) => c.campaign_identifier !== "seller1-spend-scoped"
                            )
                        ).toBe(true)
                    })

                    it("should combine budget_type and status filters", async () => {
                        const past = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                        const future = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

                        // active + spend -> should match
                        await api.post(
                            `/vendor/campaigns`,
                            {
                                name: "Active Spend Campaign",
                                campaign_identifier: "active-spend-combo",
                                starts_at: past.toISOString(),
                                ends_at: future.toISOString(),
                                budget: { type: "spend", limit: 1000, currency_code: "usd" },
                            },
                            seller1Headers
                        )
                        // active + usage -> excluded by budget_type
                        await api.post(
                            `/vendor/campaigns`,
                            {
                                name: "Active Usage Campaign",
                                campaign_identifier: "active-usage-combo",
                                starts_at: past.toISOString(),
                                ends_at: future.toISOString(),
                                budget: { type: "usage", limit: 10 },
                            },
                            seller1Headers
                        )
                        // scheduled + spend -> excluded by status
                        await api.post(
                            `/vendor/campaigns`,
                            {
                                name: "Scheduled Spend Campaign",
                                campaign_identifier: "scheduled-spend-combo",
                                starts_at: future.toISOString(),
                                budget: { type: "spend", limit: 1000, currency_code: "usd" },
                            },
                            seller1Headers
                        )

                        const response = await api.get(
                            `/vendor/campaigns?budget_type=spend&status=active`,
                            seller1Headers
                        )

                        expect(response.status).toEqual(200)
                        const identifiers = response.data.campaigns.map(
                            (c: any) => c.campaign_identifier
                        )
                        expect(identifiers).toContain("active-spend-combo")
                        expect(identifiers).not.toContain("active-usage-combo")
                        expect(identifiers).not.toContain("scheduled-spend-combo")
                        expect(
                            response.data.campaigns.every(
                                (c: any) => c.budget?.type === "spend"
                            )
                        ).toBe(true)
                    })
                })
            })

            describe("GET /vendor/campaigns/:id", () => {
                it("should get seller's own campaign", async () => {
                    const createResponse = await api.post(
                        `/vendor/campaigns`,
                        {
                            name: "Get By Id Campaign",
                            campaign_identifier: "get-by-id-campaign",
                        },
                        seller1Headers
                    )

                    const campaignId = createResponse.data.campaign.id

                    const response = await api.get(
                        `/vendor/campaigns/${campaignId}`,
                        seller1Headers
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.campaign).toBeDefined()
                    expect(response.data.campaign.id).toEqual(campaignId)
                    expect(response.data.campaign.name).toEqual("Get By Id Campaign")
                })

                it("should not allow seller to get another seller's campaign", async () => {
                    const createResponse = await api.post(
                        `/vendor/campaigns`,
                        {
                            name: "Seller 1 Campaign",
                            campaign_identifier: "seller1-campaign",
                        },
                        seller1Headers
                    )

                    const campaignId = createResponse.data.campaign.id

                    const response = await api
                        .get(`/vendor/campaigns/${campaignId}`, seller2Headers)
                        .catch((e) => e.response)

                    expect(response.status).toEqual(404)
                })

                it("should return 404 for non-existent campaign", async () => {
                    const response = await api
                        .get(`/vendor/campaigns/non-existent-id`, seller1Headers)
                        .catch((e) => e.response)

                    expect(response.status).toEqual(404)
                })

                it("should return campaign with all expected fields", async () => {
                    const startsAt = new Date()
                    const endsAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

                    const createResponse = await api.post(
                        `/vendor/campaigns`,
                        {
                            name: "Full Fields Campaign",
                            campaign_identifier: "full-fields-campaign",
                            description: "A campaign with all fields",
                            starts_at: startsAt.toISOString(),
                            ends_at: endsAt.toISOString(),
                            budget: {
                                type: "spend",
                                limit: 5000,
                                currency_code: "usd",
                            },
                        },
                        seller1Headers
                    )

                    const campaignId = createResponse.data.campaign.id

                    const response = await api.get(
                        `/vendor/campaigns/${campaignId}`,
                        seller1Headers
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.campaign.id).toBeDefined()
                    expect(response.data.campaign.name).toEqual("Full Fields Campaign")
                    expect(response.data.campaign.campaign_identifier).toEqual("full-fields-campaign")
                    expect(response.data.campaign.description).toEqual("A campaign with all fields")
                    expect(response.data.campaign.starts_at).toBeDefined()
                    expect(response.data.campaign.ends_at).toBeDefined()
                    expect(response.data.campaign.budget).toBeDefined()
                    expect(response.data.campaign.created_at).toBeDefined()
                    expect(response.data.campaign.updated_at).toBeDefined()
                })
            })

            describe("POST /vendor/campaigns/:id", () => {
                it("should update campaign name", async () => {
                    const createResponse = await api.post(
                        `/vendor/campaigns`,
                        {
                            name: "Original Name",
                            campaign_identifier: "original-name-campaign",
                        },
                        seller1Headers
                    )

                    const campaignId = createResponse.data.campaign.id

                    const response = await api.post(
                        `/vendor/campaigns/${campaignId}`,
                        {
                            name: "Updated Name",
                        },
                        seller1Headers
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.campaign.name).toEqual("Updated Name")
                })

                it("should update campaign identifier", async () => {
                    const createResponse = await api.post(
                        `/vendor/campaigns`,
                        {
                            name: "Identifier Update Campaign",
                            campaign_identifier: "original-identifier",
                        },
                        seller1Headers
                    )

                    const campaignId = createResponse.data.campaign.id

                    const response = await api.post(
                        `/vendor/campaigns/${campaignId}`,
                        {
                            campaign_identifier: "updated-identifier",
                        },
                        seller1Headers
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.campaign.campaign_identifier).toEqual("updated-identifier")
                })

                it("should update campaign description", async () => {
                    const createResponse = await api.post(
                        `/vendor/campaigns`,
                        {
                            name: "Description Update Campaign",
                            campaign_identifier: "description-update",
                        },
                        seller1Headers
                    )

                    const campaignId = createResponse.data.campaign.id

                    const response = await api.post(
                        `/vendor/campaigns/${campaignId}`,
                        {
                            description: "New description",
                        },
                        seller1Headers
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.campaign.description).toEqual("New description")
                })

                it("should update campaign dates", async () => {
                    const createResponse = await api.post(
                        `/vendor/campaigns`,
                        {
                            name: "Dates Update Campaign",
                            campaign_identifier: "dates-update",
                        },
                        seller1Headers
                    )

                    const campaignId = createResponse.data.campaign.id
                    const newStartsAt = new Date()
                    const newEndsAt = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)

                    const response = await api.post(
                        `/vendor/campaigns/${campaignId}`,
                        {
                            starts_at: newStartsAt.toISOString(),
                            ends_at: newEndsAt.toISOString(),
                        },
                        seller1Headers
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.campaign.starts_at).toBeDefined()
                    expect(response.data.campaign.ends_at).toBeDefined()
                })

                it("should update campaign budget limit", async () => {
                    const createResponse = await api.post(
                        `/vendor/campaigns`,
                        {
                            name: "Budget Update Campaign",
                            campaign_identifier: "budget-update",
                            budget: {
                                type: "spend",
                                limit: 5000,
                                currency_code: "usd",
                            },
                        },
                        seller1Headers
                    )

                    const campaignId = createResponse.data.campaign.id

                    const response = await api.post(
                        `/vendor/campaigns/${campaignId}`,
                        {
                            budget: {
                                limit: 10000,
                            },
                        },
                        seller1Headers
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.campaign.budget.limit).toEqual(10000)
                })

                it("should not allow seller to update another seller's campaign", async () => {
                    const createResponse = await api.post(
                        `/vendor/campaigns`,
                        {
                            name: "Seller 1 Update Campaign",
                            campaign_identifier: "seller1-update-campaign",
                        },
                        seller1Headers
                    )

                    const campaignId = createResponse.data.campaign.id

                    const response = await api
                        .post(
                            `/vendor/campaigns/${campaignId}`,
                            { name: "Hacked Name" },
                            seller2Headers
                        )
                        .catch((e) => e.response)

                    expect(response.status).toEqual(404)
                })
            })

            describe("DELETE /vendor/campaigns/:id", () => {
                it("should delete seller's own campaign", async () => {
                    const createResponse = await api.post(
                        `/vendor/campaigns`,
                        {
                            name: "Delete Campaign",
                            campaign_identifier: "delete-campaign",
                        },
                        seller1Headers
                    )

                    const campaignId = createResponse.data.campaign.id

                    const response = await api.delete(
                        `/vendor/campaigns/${campaignId}`,
                        seller1Headers
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data).toEqual({
                        id: campaignId,
                        object: "campaign",
                        deleted: true,
                    })

                    const getResponse = await api
                        .get(`/vendor/campaigns/${campaignId}`, seller1Headers)
                        .catch((e) => e.response)

                    expect(getResponse.status).toEqual(404)
                })

                it("should not allow seller to delete another seller's campaign", async () => {
                    const createResponse = await api.post(
                        `/vendor/campaigns`,
                        {
                            name: "Seller 1 Delete Campaign",
                            campaign_identifier: "seller1-delete-campaign",
                        },
                        seller1Headers
                    )

                    const campaignId = createResponse.data.campaign.id

                    const response = await api
                        .delete(`/vendor/campaigns/${campaignId}`, seller2Headers)
                        .catch((e) => e.response)

                    expect(response.status).toEqual(404)

                    const getResponse = await api.get(
                        `/vendor/campaigns/${campaignId}`,
                        seller1Headers
                    )

                    expect(getResponse.status).toEqual(200)
                })
            })

            describe("POST /vendor/campaigns/:id/promotions", () => {
                it("should add promotions to campaign", async () => {
                    const campaignResponse = await api.post(
                        `/vendor/campaigns`,
                        {
                            name: "Promotions Campaign",
                            campaign_identifier: "promotions-campaign",
                        },
                        seller1Headers
                    )

                    const campaignId = campaignResponse.data.campaign.id

                    const promotionResponse = await api.post(
                        `/vendor/promotions`,
                        {
                            code: "CAMPAIGN_PROMO_1",
                            type: "standard",
                            application_method: {
                                type: "percentage",
                                target_type: "order",
                                value: 10,
                            },
                        },
                        seller1Headers
                    )

                    const promotionId = promotionResponse.data.promotion.id

                    const response = await api.post(
                        `/vendor/campaigns/${campaignId}/promotions`,
                        {
                            add: [promotionId],
                        },
                        seller1Headers
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.campaign).toBeDefined()
                })

                it("should remove promotions from campaign", async () => {
                    const promotionResponse = await api.post(
                        `/vendor/promotions`,
                        {
                            code: "CAMPAIGN_PROMO_2",
                            type: "standard",
                            application_method: {
                                type: "percentage",
                                target_type: "order",
                                value: 15,
                            },
                        },
                        seller1Headers
                    )

                    const promotionId = promotionResponse.data.promotion.id

                    const campaignResponse = await api.post(
                        `/vendor/campaigns`,
                        {
                            name: "Remove Promotions Campaign",
                            campaign_identifier: "remove-promotions-campaign",
                        },
                        seller1Headers
                    )

                    const campaignId = campaignResponse.data.campaign.id

                    await api.post(
                        `/vendor/campaigns/${campaignId}/promotions`,
                        {
                            add: [promotionId],
                        },
                        seller1Headers
                    )

                    const response = await api.post(
                        `/vendor/campaigns/${campaignId}/promotions`,
                        {
                            remove: [promotionId],
                        },
                        seller1Headers
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.campaign).toBeDefined()
                })

                it("should not allow seller to add promotions to another seller's campaign", async () => {
                    const campaignResponse = await api.post(
                        `/vendor/campaigns`,
                        {
                            name: "Seller 1 Promotions Campaign",
                            campaign_identifier: "seller1-promotions-campaign",
                        },
                        seller1Headers
                    )

                    const campaignId = campaignResponse.data.campaign.id

                    const promotionResponse = await api.post(
                        `/vendor/promotions`,
                        {
                            code: "SELLER2_PROMO",
                            type: "standard",
                            application_method: {
                                type: "percentage",
                                target_type: "order",
                                value: 10,
                            },
                        },
                        seller2Headers
                    )

                    const promotionId = promotionResponse.data.promotion.id

                    const response = await api
                        .post(
                            `/vendor/campaigns/${campaignId}/promotions`,
                            {
                                add: [promotionId],
                            },
                            seller2Headers
                        )
                        .catch((e) => e.response)

                    expect(response.status).toEqual(404)
                })

                it("should not allow adding another seller's promotion to campaign", async () => {
                    const campaignResponse = await api.post(
                        `/vendor/campaigns`,
                        {
                            name: "Cross Seller Campaign",
                            campaign_identifier: "cross-seller-campaign",
                        },
                        seller1Headers
                    )

                    const campaignId = campaignResponse.data.campaign.id

                    const promotionResponse = await api.post(
                        `/vendor/promotions`,
                        {
                            code: "OTHER_SELLER_PROMO",
                            type: "standard",
                            application_method: {
                                type: "percentage",
                                target_type: "order",
                                value: 10,
                            },
                        },
                        seller2Headers
                    )

                    const promotionId = promotionResponse.data.promotion.id

                    const response = await api
                        .post(
                            `/vendor/campaigns/${campaignId}/promotions`,
                            {
                                add: [promotionId],
                            },
                            seller1Headers
                        )
                        .catch((e) => e.response)

                    expect(response.status).toEqual(404)
                })
            })
        })
    },
})
