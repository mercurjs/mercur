import { MathBN } from "@medusajs/framework/utils"

import { allocateCreditLines } from "../allocate-credit-lines"

const creditLine = (id: string, amount: number) => ({
    id,
    amount,
    reference: "store_credit",
    reference_id: `ref_${id}`,
    metadata: { source: "loyalty" },
})

const amounts = (lines: { amount: unknown }[]) =>
    lines.map((line) => MathBN.convert(line.amount as number).toNumber())

const totalOf = (lines: { amount: unknown }[]) =>
    amounts(lines).reduce((acc, amount) => acc + amount, 0)

describe("allocateCreditLines", () => {
    it("splits a credit line by each order's share of the total", () => {
        const [a, b] = allocateCreditLines({
            credit_lines: [creditLine("cl_1", 10)],
            order_totals: [40, 60],
            currency_code: "eur",
        })

        expect(amounts(a)).toEqual([4])
        expect(amounts(b)).toEqual([6])
    })

    it("keeps the source of the credit on every share", () => {
        const [a, b] = allocateCreditLines({
            credit_lines: [creditLine("cl_1", 10)],
            order_totals: [40, 60],
            currency_code: "eur",
        })

        for (const [line] of [a, b]) {
            expect(line).toEqual(
                expect.objectContaining({
                    reference: "store_credit",
                    reference_id: "ref_cl_1",
                    metadata: { source: "loyalty", cart_credit_line_id: "cl_1" },
                })
            )
        }
    })

    it("rounds to the currency precision and adds up to the credit line", () => {
        const shares = allocateCreditLines({
            credit_lines: [creditLine("cl_1", 10)],
            order_totals: [1, 1, 1],
            currency_code: "eur",
        })

        expect(shares.map(amounts)).toEqual([[3.34], [3.33], [3.33]])
    })

    it("respects currencies without minor units", () => {
        const shares = allocateCreditLines({
            credit_lines: [creditLine("cl_1", 100)],
            order_totals: [1, 2],
            currency_code: "jpy",
        })

        expect(shares.map(amounts)).toEqual([[33], [67]])
    })

    it("settles every order when several lines cover the whole cart", () => {
        const totals = [33.33, 33.33, 33.34]
        const shares = allocateCreditLines({
            credit_lines: [
                creditLine("cl_1", 0.01),
                creditLine("cl_2", 0.02),
                creditLine("cl_3", 99.97),
            ],
            order_totals: totals,
            currency_code: "usd",
        })

        shares.forEach((lines, index) => {
            expect(totalOf(lines)).toBeCloseTo(totals[index], 10)
        })
    })

    it("gives a single order the credit line unchanged", () => {
        const [only] = allocateCreditLines({
            credit_lines: [creditLine("cl_1", 12.34)],
            order_totals: [100],
            currency_code: "usd",
        })

        expect(amounts(only)).toEqual([12.34])
    })

    it("leaves out a share that rounds to nothing", () => {
        const [a, b] = allocateCreditLines({
            credit_lines: [creditLine("cl_1", 10)],
            order_totals: [0, 100],
            currency_code: "usd",
        })

        expect(a).toEqual([])
        expect(amounts(b)).toEqual([10])
    })

    it("allocates nothing for a cart without credit lines", () => {
        expect(
            allocateCreditLines({
                credit_lines: [],
                order_totals: [40, 60],
                currency_code: "usd",
            })
        ).toEqual([[], []])
    })
})
