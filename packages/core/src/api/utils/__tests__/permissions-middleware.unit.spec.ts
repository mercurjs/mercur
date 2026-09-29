import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework"
import {
  IPermissionResolver,
  PERMISSIONS_MODULE,
  PermissionMap,
} from "@mercurjs/types"

import {
  requirePermission,
  resolvePermissionsMiddleware,
} from "../permissions-middleware"

const makeReq = (resolver?: IPermissionResolver) =>
  ({
    auth_context: { actor_id: "mem_1", actor_type: "member" },
    seller_context: { seller_id: "sel_1", seller_member: { id: "selmem_1" } },
    scope: {
      resolve: (key: string) =>
        key === PERMISSIONS_MODULE
          ? resolver
          : { modules: resolver ? { [PERMISSIONS_MODULE]: {} } : {} },
    },
  }) as unknown as AuthenticatedMedusaRequest

const makeRes = () => {
  const res = { statusCode: 200, body: undefined as unknown }
  const api = {
    status(code: number) {
      res.statusCode = code
      return api
    },
    json(body: unknown) {
      res.body = body
      return api
    },
  }
  return { res, api: api as unknown as MedusaResponse }
}

const run = async (req: AuthenticatedMedusaRequest, key: string, right: "view" | "edit") => {
  const next = jest.fn()
  await resolvePermissionsMiddleware("vendor")(req, makeRes().api, next)
  const { res, api } = makeRes()
  const allowed = jest.fn()
  requirePermission(key, right)(req, api, allowed)
  return { res, allowed }
}

describe("permissions middleware", () => {
  it("allows everything when the permissions module is not configured", async () => {
    const req = makeReq()
    const { allowed } = await run(req, "payouts", "edit")

    expect(allowed).toHaveBeenCalled()
    expect(req.permissions?.orders).toBe("manage")
  })

  it("passes the seller context to the resolver", async () => {
    const resolvePermissions = jest.fn(async (): Promise<PermissionMap> => ({}))
    await run(makeReq({ resolvePermissions }), "orders", "view")

    expect(resolvePermissions).toHaveBeenCalledWith(
      expect.objectContaining({
        actor_id: "mem_1",
        surface: "vendor",
        seller_id: "sel_1",
        seller_member_id: "selmem_1",
      }),
      expect.any(Array)
    )
  })

  it("enforces the resolved rights", async () => {
    const resolver = {
      resolvePermissions: async (): Promise<PermissionMap> => ({ orders: "edit" }),
    }

    expect((await run(makeReq(resolver), "orders", "view")).allowed).toHaveBeenCalled()

    const denied = await run(makeReq(resolver), "payouts", "view")
    expect(denied.allowed).not.toHaveBeenCalled()
    expect(denied.res.statusCode).toBe(403)
    expect(denied.res.body).toEqual(
      expect.objectContaining({
        code: "MISSING_PERMISSION",
        permission: "payouts",
        right: "view",
      })
    )
  })
})
