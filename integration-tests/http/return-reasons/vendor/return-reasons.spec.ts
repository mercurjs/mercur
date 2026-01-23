import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { IOrderModuleService, MedusaContainer } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { createSellerUser } from "../../../helpers/create-seller-user"

jest.setTimeout(50000)

medusaIntegrationTestRunner({
    testSuite: ({ getContainer, api }) => {
        describe("Vendor - Return Reasons", () => {
            let appContainer: MedusaContainer
            let sellerHeaders: any
            let orderModuleService: IOrderModuleService

            beforeAll(async () => {
                appContainer = getContainer()
                orderModuleService = appContainer.resolve(Modules.ORDER)
            })

            beforeEach(async () => {
                const result = await createSellerUser(appContainer, {
                    email: "seller@test.com",
                    name: "Test Seller",
                })
                sellerHeaders = result.headers
            })

            describe("GET /vendor/return-reasons", () => {
                it("should list return reasons", async () => {
                    await orderModuleService.createReturnReasons([
                        { value: "damaged", label: "Damaged Item" },
                        { value: "wrong_item", label: "Wrong Item" },
                    ])

                    const response = await api.get(
                        `/vendor/return-reasons`,
                        sellerHeaders
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.return_reasons).toBeDefined()
                    expect(response.data.return_reasons.length).toBeGreaterThanOrEqual(2)

                    const labels = response.data.return_reasons.map((r: any) => r.label)
                    expect(labels).toContain("Damaged Item")
                    expect(labels).toContain("Wrong Item")
                })

                it("should filter return reasons by value", async () => {
                    await orderModuleService.createReturnReasons([
                        { value: "unique_value_123", label: "Unique Reason" },
                    ])

                    const response = await api.get(
                        `/vendor/return-reasons?value=unique_value_123`,
                        sellerHeaders
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.return_reasons).toHaveLength(1)
                    expect(response.data.return_reasons[0].value).toEqual("unique_value_123")
                })

                it("should filter return reasons by label", async () => {
                    await orderModuleService.createReturnReasons([
                        { value: "label_filter", label: "Label Filter Test" },
                    ])

                    const response = await api.get(
                        `/vendor/return-reasons?label=Label Filter Test`,
                        sellerHeaders
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.return_reasons).toHaveLength(1)
                    expect(response.data.return_reasons[0].label).toEqual("Label Filter Test")
                })

                it("should search return reasons with q parameter", async () => {
                    await orderModuleService.createReturnReasons([
                        { value: "searchable", label: "Searchable Return Reason" },
                    ])

                    const response = await api.get(
                        `/vendor/return-reasons?q=searchable`,
                        sellerHeaders
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.return_reasons.length).toBeGreaterThanOrEqual(1)
                    expect(
                        response.data.return_reasons.some(
                            (r: any) =>
                                r.label.toLowerCase().includes("searchable") ||
                                r.value.includes("searchable")
                        )
                    ).toBe(true)
                })

                it("should filter by parent_return_reason_id", async () => {
                    const [parentReason] = await orderModuleService.createReturnReasons([
                        { value: "parent_reason", label: "Parent Reason" },
                    ])

                    await orderModuleService.createReturnReasons([
                        {
                            value: "child_reason",
                            label: "Child Reason",
                            parent_return_reason_id: parentReason.id,
                        },
                    ])

                    const response = await api.get(
                        `/vendor/return-reasons?parent_return_reason_id=${parentReason.id}`,
                        sellerHeaders
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.return_reasons).toHaveLength(1)
                    expect(response.data.return_reasons[0].label).toEqual("Child Reason")
                })

                it("should support pagination", async () => {
                    await orderModuleService.createReturnReasons([
                        { value: "reason_a", label: "Reason A" },
                        { value: "reason_b", label: "Reason B" },
                        { value: "reason_c", label: "Reason C" },
                    ])

                    const response = await api.get(
                        `/vendor/return-reasons?limit=2&offset=0`,
                        sellerHeaders
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.return_reasons.length).toBeLessThanOrEqual(2)
                    expect(response.data.limit).toEqual(2)
                    expect(response.data.offset).toEqual(0)
                })
            })

            describe("GET /vendor/return-reasons/:id", () => {
                it("should get a return reason by id", async () => {
                    const [returnReason] = await orderModuleService.createReturnReasons([
                        { value: "get_by_id", label: "Get By Id Reason" },
                    ])

                    const response = await api.get(
                        `/vendor/return-reasons/${returnReason.id}`,
                        sellerHeaders
                    )

                    expect(response.status).toEqual(200)
                    expect(response.data.return_reason).toBeDefined()
                    expect(response.data.return_reason.id).toEqual(returnReason.id)
                    expect(response.data.return_reason.label).toEqual("Get By Id Reason")
                    expect(response.data.return_reason.value).toEqual("get_by_id")
                })

                it("should return 404 for non-existent return reason", async () => {
                    const response = await api
                        .get(`/vendor/return-reasons/non-existent-id`, sellerHeaders)
                        .catch((e) => e.response)

                    expect(response.status).toEqual(404)
                })
            })
        })
    },
})
