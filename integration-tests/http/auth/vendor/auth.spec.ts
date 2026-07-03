import { medusaIntegrationTestRunner } from "@medusajs/test-utils"

jest.setTimeout(50000)

medusaIntegrationTestRunner({
    testSuite: ({ api }) => {
        describe("Vendor - Auth", () => {
            it("should create a seller", async () => {
                const email = "seller@test.com"
                const password = "somepassword"

                // Register auth identity via /auth/member/emailpass/register
                // (vendor routes authenticate the "member" actor type).
                const registerResponse = await api.post(
                    `/auth/member/emailpass/register`,
                    {
                        email,
                        password,
                    }
                )

                expect(registerResponse.status).toEqual(200)
                const { token } = registerResponse.data

                // Create seller using the token
                const response = await api.post(
                    `/vendor/sellers`,
                    {
                        name: "Test Seller",
                        email: email,
                        member_email: email,
                        currency_code: "usd",
                    },
                    {
                        headers: {
                            authorization: `Bearer ${token}`,
                        },
                    }
                )

                expect(response.status).toEqual(201)
                expect(response.data.seller).toEqual(
                    expect.objectContaining({
                        name: "Test Seller",
                        handle: "test-seller",
                        email: email,
                    })
                )
            })
        })
    },
})