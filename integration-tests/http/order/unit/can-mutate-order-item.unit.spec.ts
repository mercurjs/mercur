import { getOrderItemMutationLimits as coreHelper } from "../../../../packages/core/src/api/admin/helpers/can-mutate-order-item"
import { getOrderItemMutationLimits as adminHelper } from "../../../../packages/admin/src/lib/order-item-mutation-limits"

describe.each([
    ["core", coreHelper],
    ["admin-mirror", adminHelper],
])("%s — getOrderItemMutationLimits", (_name, helper) => {
    it("allows remove and sets minQty=0 when fulfilled=0 and returned=0", () => {
        expect(
            helper({
                quantity: 3,
                detail: { fulfilled_quantity: 0, returned_quantity: 0 },
            }),
        ).toEqual({ canRemove: true, minQty: 0 })
    })

    it("blocks remove and sets minQty=fulfilled when fulfilled>0 and returned=0", () => {
        expect(
            helper({
                quantity: 3,
                detail: { fulfilled_quantity: 2, returned_quantity: 0 },
            }),
        ).toEqual({ canRemove: false, minQty: 2, reason: "fulfilled" })
    })

    it("blocks remove and sets minQty=returned when fulfilled=0 and returned>0", () => {
        expect(
            helper({
                quantity: 3,
                detail: { fulfilled_quantity: 0, returned_quantity: 1 },
            }),
        ).toEqual({ canRemove: false, minQty: 1, reason: "returned" })
    })

    it("blocks remove and sets minQty=fulfilled+returned when both >0", () => {
        expect(
            helper({
                quantity: 5,
                detail: { fulfilled_quantity: 2, returned_quantity: 1 },
            }),
        ).toEqual({
            canRemove: false,
            minQty: 3,
            reason: "fulfilled_and_returned",
        })
    })

    it("locks qty when fulfilled+returned === quantity", () => {
        expect(
            helper({
                quantity: 3,
                detail: { fulfilled_quantity: 2, returned_quantity: 1 },
            }),
        ).toEqual({
            canRemove: false,
            minQty: 3,
            reason: "fulfilled_and_returned",
        })
    })

    it("treats missing detail as all-zero (canRemove: true)", () => {
        expect(helper({ quantity: 1, detail: undefined })).toEqual({
            canRemove: true,
            minQty: 0,
        })
    })
})
