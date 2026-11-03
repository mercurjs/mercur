import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import {
  IProductModuleService,
  ISalesChannelModuleService,
  MedusaContainer,
} from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import {
  adminHeaders,
  createAdminUser,
  generatePublishableKey,
  generateStoreHeaders,
} from "../../../helpers/create-admin-user"
import { createVendorProduct } from "../../../helpers/create-product"
import { createSellerUser } from "../../../helpers/create-seller-user"

jest.setTimeout(120000)

medusaIntegrationTestRunner({
  testSuite: ({ getContainer, api, dbConnection }) => {
    describe("Store - Product field exposure", () => {
      let appContainer: MedusaContainer
      let storeHeaders: ReturnType<typeof generateStoreHeaders>
      let seller: any
      let sellerHeaders: any
      let productModuleService: IProductModuleService

      beforeAll(async () => {
        appContainer = getContainer()
        productModuleService = appContainer.resolve(Modules.PRODUCT)
      })

      beforeEach(async () => {
        await createAdminUser(dbConnection, adminHeaders, appContainer)

        const salesChannelModule =
          appContainer.resolve<ISalesChannelModuleService>(Modules.SALES_CHANNEL)
        const salesChannel = await salesChannelModule.createSalesChannels({
          name: "Test Store",
        })

        const publishableKey = await generatePublishableKey(appContainer)
        storeHeaders = generateStoreHeaders({ publishableKey })

        const link = appContainer.resolve(ContainerRegistrationKeys.LINK)
        await link.create({
          [Modules.API_KEY]: { publishable_key_id: publishableKey.id },
          [Modules.SALES_CHANNEL]: { sales_channel_id: salesChannel.id },
        })

        const result = await createSellerUser(appContainer, {
          email: "fields-seller@test.com",
          name: "Fields Store",
        })
        seller = result.seller
        sellerHeaders = result.headers
        await api.post(`/admin/sellers/${seller.id}/approve`, {}, adminHeaders)

        await api.post(
          `/vendor/sellers/${seller.id}/payment-details`,
          { holder_name: "Secret Holder", iban: "DE89370400440532013000" },
          sellerHeaders
        )
      })

      it("rejects a publishable key without a sales channel", async () => {
        const bareKey = await generatePublishableKey(appContainer)
        const response = await api
          .get(`/store/products`, generateStoreHeaders({ publishableKey: bareKey }))
          .catch((e: any) => e.response)

        expect(response.status).toEqual(400)
      })

      it("drops seller private relations requested through product offers", async () => {
        const product = await createVendorProduct(api, sellerHeaders, {
          title: "Public Product",
        })

        const response = await api.get(
          `/store/products/${product.id}?fields=${encodeURIComponent(
            "id,title,*variants,*variants.offers,*variants.offers.seller,variants.offers.seller.payment_details.iban,*variants.offers.seller.member_invites"
          )}`,
          storeHeaders
        )

        expect(response.status).toEqual(200)
        expect(response.data.product.id).toEqual(product.id)
        const body = JSON.stringify(response.data)
        expect(body).not.toContain("payment_details")
        expect(body).not.toContain("member_invites")
        expect(body).not.toContain("Secret")
      })

      it("keeps the default product shape intact", async () => {
        const product = await createVendorProduct(api, sellerHeaders, {
          title: "Default Shape",
        })

        const response = await api.get(`/store/products/${product.id}`, storeHeaders)

        expect(response.status).toEqual(200)
        expect(response.data.product.variants).toHaveLength(1)
        expect(response.data.product.options).toBeDefined()
      })

      it("only shows published products through a category", async () => {
        const [category] = await productModuleService.createProductCategories([
          { name: "Mixed Category", is_active: true },
        ])

        const published = await createVendorProduct(api, sellerHeaders, {
          title: "Published In Category",
        })
        const draft = await createVendorProduct(api, sellerHeaders, {
          title: "Draft In Category",
          status: "draft",
        })

        await productModuleService.updateProducts(published.id, {
          category_ids: [category.id],
        })
        await productModuleService.updateProducts(draft.id, {
          category_ids: [category.id],
        })

        const detail = await api.get(
          `/store/product-categories/${category.id}?fields=id,*products`,
          storeHeaders
        )
        expect(detail.status).toEqual(200)
        const detailIds = detail.data.product_category.products.map((p: any) => p.id)
        expect(detailIds).toContain(published.id)
        expect(detailIds).not.toContain(draft.id)

        const list = await api.get(
          `/store/product-categories?id=${category.id}&fields=id,*products`,
          storeHeaders
        )
        expect(list.status).toEqual(200)
        const listIds = list.data.product_categories[0].products.map((p: any) => p.id)
        expect(listIds).toContain(published.id)
        expect(listIds).not.toContain(draft.id)
      })
    })
  },
})
