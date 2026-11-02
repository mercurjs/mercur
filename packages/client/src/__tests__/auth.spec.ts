import { afterEach, describe, expect, it, vi } from "vitest";

import {
    adminTokenStore,
    apiKeyAuth,
    bearerAuth,
    createClient,
    createTokenStore,
    headerAuth,
    publishableKeyAuth,
    resolveAuthHeaders,
} from "..";

const memory = () => {
    const map = new Map<string, string>();
    return {
        getItem: (k: string) => map.get(k) ?? null,
        setItem: (k: string, v: string) => void map.set(k, v),
        removeItem: (k: string) => void map.delete(k),
    };
};

describe("createTokenStore", () => {
    it("reads, writes, clears and notifies subscribers", () => {
        const store = createTokenStore("t", memory());
        const seen: (string | null)[] = [];
        const unsubscribe = store.subscribe((t) => seen.push(t));

        expect(store.get()).toBeNull();
        store.set("abc");
        expect(store.get()).toBe("abc");
        store.clear();
        expect(store.get()).toBeNull();
        unsubscribe();
        store.set("ignored");

        expect(seen).toEqual(["abc", null]);
    });

    it("survives a storage that throws", () => {
        const store = createTokenStore("t", {
            getItem: () => {
                throw new Error("blocked");
            },
            setItem: () => {
                throw new Error("blocked");
            },
            removeItem: () => {
                throw new Error("blocked");
            },
        });
        expect(() => store.set("x")).not.toThrow();
        expect(store.get()).toBeNull();
    });
});

describe("resolveAuthHeaders", () => {
    it("turns a bare token store into a bearer header", async () => {
        const store = createTokenStore("t", memory());
        store.set("tok");
        expect(await resolveAuthHeaders(store)).toEqual({ Authorization: "Bearer tok" });
    });

    it("sends secret keys as basic auth and publishable keys as their header", async () => {
        expect(await resolveAuthHeaders(apiKeyAuth(() => "sk_123"))).toEqual({
            Authorization: `Basic ${btoa("sk_123:")}`,
        });
        expect(await resolveAuthHeaders(publishableKeyAuth(async () => "pk_123"))).toEqual({
            "x-publishable-api-key": "pk_123",
        });
    });

    it("combines schemes and skips empty credentials", async () => {
        const seller = createTokenStore("s", memory());
        expect(
            await resolveAuthHeaders([bearerAuth(() => null), headerAuth("x-seller-id", seller)])
        ).toEqual({});
        seller.set("sel_1");
        expect(
            await resolveAuthHeaders([bearerAuth(() => "tok"), headerAuth("x-seller-id", seller)])
        ).toEqual({ Authorization: "Bearer tok", "x-seller-id": "sel_1" });
    });
});

describe("createClient auth", () => {
    const fetchMock = vi.fn();
    afterEach(() => {
        fetchMock.mockReset();
        adminTokenStore.clear();
    });

    const json = (status: number, body: unknown) =>
        new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

    it("resolves the token on every request, not when the client is created", async () => {
        vi.stubGlobal("fetch", fetchMock.mockImplementation(() => Promise.resolve(json(200, { ok: true }))));
        const store = createTokenStore("t", memory());
        const client = createClient({ baseUrl: "http://api.test", auth: store }) as any;

        await client.admin.sellers.query();
        expect((fetchMock.mock.calls[0][1].headers as Headers).get("authorization")).toBeNull();

        store.set("later");
        await client.admin.sellers.query();
        expect((fetchMock.mock.calls[1][1].headers as Headers).get("authorization")).toBe("Bearer later");
    });

    it("clears the bearer store on 401 unless a handler is given", async () => {
        vi.stubGlobal("fetch", fetchMock.mockImplementation(() => Promise.resolve(json(401, { message: "Unauthorized" }))));
        adminTokenStore.set("stale");
        const client = createClient({ baseUrl: "http://api.test", auth: bearerAuth(adminTokenStore) }) as any;

        await expect(client.admin.sellers.query()).rejects.toMatchObject({ status: 401 });
        expect(adminTokenStore.get()).toBeNull();

        adminTokenStore.set("kept");
        const onUnauthorized = vi.fn();
        const custom = createClient({ baseUrl: "http://api.test", auth: adminTokenStore, onUnauthorized }) as any;
        await expect(custom.admin.sellers.query()).rejects.toMatchObject({ status: 401 });
        expect(onUnauthorized).toHaveBeenCalledWith({ status: 401, message: "Unauthorized" });
        expect(adminTokenStore.get()).toBe("kept");
    });
});
