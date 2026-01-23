import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { IPaymentModuleService, MedusaContainer } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { createSellerUser } from "../../../helpers/create-seller-user"

jest.setTimeout(50000)

medusaIntegrationTestRunner({
    testSuite: ({ getContainer, api }) => {
        describe("Vendor - Refund Reasons", () => {
            let appContainer: MedusaContainer
            let sellerHeaders: any
            let paymentModuleService: IPaymentModuleService

            beforeAll(async () => {
                appContainer = getContainer()
                paymentModuleService = appContainer.resolve(Modules.PAYMENT)
            })

            beforeEach(async () => {
                const result = await createSellerUser(appContainer, {
                    email: "seller@test.com",
                    name: "Test Seller",
                })
                sellerHeaders = result.headers
            })

            describe("GET /vendor/refund-reasons", () => {
                it("should list refund reasons", async () => {
                    await paymentModuleService.createRefundReasons([
                        { label: "Damaged Item", code: "damaged_item" },
                        { label: "Wrong Item", code: "wrong_item" },
                    ])

                    const response = await api.get(
                        `/vendor/refund-reasons`,
                        sellerHeaders
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.refund_reasons).toBeDefined()
                    expect(response.data.refund_reasons.length).toBeGreaterThanOrEqual(2)

                    const labels = response.data.refund_reasons.map((r: any) => r.label)
                    expect(labels).toContain("Damaged Item")
                    expect(labels).toContain("Wrong Item")
                })

                it("should search refund reasons with q parameter", async () => {
                    await paymentModuleService.createRefundReasons([
                        { label: "Searchable Refund Reason", code: "searchable_reason" },
                    ])

                    const response = await api.get(
                        `/vendor/refund-reasons?q=searchable`,
                        sellerHeaders
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.refund_reasons.length).toBeGreaterThanOrEqual(1)
                    expect(
                        response.data.refund_reasons.some((r: any) =>
                            r.label.toLowerCase().includes("searchable")
                        )
                    ).toBe(true)
                })

                it("should support pagination", async () => {
                    await paymentModuleService.createRefundReasons([
                        { label: "Reason A", code: "reason_a" },
                        { label: "Reason B", code: "reason_b" },
                        { label: "Reason C", code: "reason_c" },
                    ])

                    const response = await api.get(
                        `/vendor/refund-reasons?limit=2&offset=0`,
                        sellerHeaders
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.refund_reasons.length).toBeLessThanOrEqual(2)
                    expect(response.data.limit).toEqual(2)
                    expect(response.data.offset).toEqual(0)
                })
            })

            describe("GET /vendor/refund-reasons/:id", () => {
                it("should get a refund reason by id", async () => {
                    const [refundReason] = await paymentModuleService.createRefundReasons([
                        { label: "Get By Id Reason", code: "get_by_id_reason" },
                    ])

                    const response = await api.get(
                        `/vendor/refund-reasons/${refundReason.id}`,
                        sellerHeaders
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.refund_reason).toBeDefined()
                    expect(response.data.refund_reason.id).toEqual(refundReason.id)
                    expect(response.data.refund_reason.label).toEqual("Get By Id Reason")
                })

                it("should return 404 for non-existent refund reason", async () => {
                    const response = await api
                        .get(`/vendor/refund-reasons/non-existent-id`, sellerHeaders)
                        .catch((e) => e.response)

                    expect(response.status).toEqual(404)
                })
            })
        })
    },
})
