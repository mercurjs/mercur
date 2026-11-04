import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { MedusaContainer } from "@medusajs/framework/types"

import { createSellerUser } from "../../../helpers/create-seller-user"

jest.setTimeout(50000)

const multipart = (
  files: { name: string; type: string; content: string }[]
) => {
  const boundary = `----mercur-${Date.now()}`
  const body = files
    .map(
      (file) =>
        `--${boundary}\r\nContent-Disposition: form-data; name="files"; filename="${file.name}"\r\nContent-Type: ${file.type}\r\n\r\n${file.content}\r\n`
    )
    .join("")

  return {
    body: `${body}--${boundary}--\r\n`,
    contentType: `multipart/form-data; boundary=${boundary}`,
  }
}

medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api }) => {
    describe("Vendor - Uploads", () => {
      let appContainer: MedusaContainer
      let headers: { headers: Record<string, string> }

      beforeAll(() => {
        appContainer = getContainer()
      })

      beforeEach(async () => {
        const result = await createSellerUser(appContainer, {
          email: "uploader@test.com",
          name: "Uploader",
        })
        headers = result.headers
      })

      const upload = (files: { name: string; type: string; content: string }[]) => {
        const { body, contentType } = multipart(files)
        return api
          .post("/vendor/uploads", body, {
            headers: { ...headers.headers, "content-type": contentType },
          })
          .catch((e: { response: unknown }) => e.response)
      }

      it("rejects html uploads", async () => {
        const response = await upload([
          { name: "page.html", type: "text/html", content: "<script>1</script>" },
        ])

        expect(response.status).toEqual(400)
        expect(response.data.message).toContain("page.html")
      })

      it("rejects svg uploads", async () => {
        const response = await upload([
          { name: "logo.svg", type: "image/svg+xml", content: "<svg/>" },
        ])

        expect(response.status).toEqual(400)
      })

      it("rejects an allowed mime type with a mismatched extension", async () => {
        const response = await upload([
          { name: "logo.html", type: "image/png", content: "png" },
        ])

        expect(response.status).toEqual(400)
      })

      it("rejects the whole batch when one file is not allowed", async () => {
        const response = await upload([
          { name: "logo.png", type: "image/png", content: "png" },
          { name: "page.html", type: "text/html", content: "<html/>" },
        ])

        expect(response.status).toEqual(400)
      })

      it("accepts image uploads", async () => {
        const response = await upload([
          { name: "logo.png", type: "image/png", content: "png" },
          { name: "photo.JPG", type: "image/jpeg", content: "jpg" },
        ])

        expect(response.status).toEqual(200)
        expect(response.data.files).toHaveLength(2)
      })
    })
  },
})
