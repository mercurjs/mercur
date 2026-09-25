import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { GET } from "../api/vendor/notifications/route"

type RouteRequest = Parameters<typeof GET>[0]
type RouteResponse = Parameters<typeof GET>[1]

function setup() {
  const graph = jest.fn().mockResolvedValue({
    data: [{ id: "noti_1" }],
    metadata: { count: 1, skip: 0, take: 50 },
  })

  const req = {
    auth_context: { actor_id: "mem_1", actor_type: "seller" },
    seller_context: { seller_id: "sel_1" },
    scope: {
      resolve: jest.fn((key: string) =>
        key === ContainerRegistrationKeys.QUERY ? { graph } : undefined
      ),
    },
    queryConfig: {
      fields: ["id", "data", "created_at"],
      pagination: { skip: 0, take: 50 },
    },
  } as unknown as RouteRequest

  const json = jest.fn()
  const res = { json } as unknown as RouteResponse

  return { req, res, graph, json }
}

describe("GET /vendor/notifications", () => {
  it("scopes the feed to the current seller, not the member actor", async () => {
    const { req, res, graph } = setup()

    await GET(req, res)

    expect(graph).toHaveBeenCalledWith(
      expect.objectContaining({
        entity: "notification",
        filters: { channel: "seller_feed", to: "sel_1" },
      })
    )
  })

  it("returns the paginated list", async () => {
    const { req, res, json } = setup()

    await GET(req, res)

    expect(json).toHaveBeenCalledWith({
      notifications: [{ id: "noti_1" }],
      count: 1,
      offset: 0,
      limit: 50,
    })
  })
})
