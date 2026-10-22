/**
 * Token storage and request authentication for the client.
 *
 * A token store keeps one credential under one key and survives reloads
 * through `localStorage` when it exists, falling back to memory on the server
 * or when storage is blocked. An auth scheme turns stores into the headers a
 * Mercur API expects, resolved freshly on every request.
 */

export type TokenStorage = {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
    removeItem(key: string): void;
};

export type TokenStore = {
    readonly key: string;
    get(): string | null;
    set(token: string): void;
    clear(): void;
    /** Called with the new value after every `set` and `clear`, in this tab. */
    subscribe(listener: (token: string | null) => void): () => void;
};

const memoryStorage = (): TokenStorage => {
    const map = new Map<string, string>();
    return {
        getItem: (key) => map.get(key) ?? null,
        setItem: (key, value) => void map.set(key, value),
        removeItem: (key) => void map.delete(key),
    };
};

const resolveStorage = (storage?: TokenStorage): TokenStorage => {
    if (storage) return storage;
    try {
        if (typeof localStorage !== "undefined") {
            // A throwing accessor (private mode, blocked storage) must not take the client down.
            localStorage.getItem("__mercur_probe__");
            return localStorage;
        }
    } catch {
        // fall through
    }
    return memoryStorage();
};

export function createTokenStore(key: string, storage?: TokenStorage): TokenStore {
    const backing = resolveStorage(storage);
    const listeners = new Set<(token: string | null) => void>();
    const notify = (token: string | null) => listeners.forEach((l) => l(token));

    return {
        key,
        get() {
            try {
                return backing.getItem(key);
            } catch {
                return null;
            }
        },
        set(token) {
            try {
                backing.setItem(key, token);
            } catch {
                return;
            }
            notify(token);
        },
        clear() {
            try {
                backing.removeItem(key);
            } catch {
                return;
            }
            notify(null);
        },
        subscribe(listener) {
            listeners.add(listener);
            return () => void listeners.delete(listener);
        },
    };
}

type MaybePromise<T> = T | Promise<T>;
type Credential = string | null | undefined;

/** One way of authenticating a request. Several can be combined in `ClientOptions.auth`. */
export type AuthScheme =
    | { type: "bearer"; token: TokenStore | (() => MaybePromise<Credential>) }
    | { type: "api-key"; key: TokenStore | (() => MaybePromise<Credential>) }
    | { type: "publishable-key"; key: TokenStore | (() => MaybePromise<Credential>) }
    | { type: "header"; name: string; value: TokenStore | (() => MaybePromise<Credential>) };

export type AuthOption = TokenStore | AuthScheme | AuthScheme[];

const read = (source: TokenStore | (() => MaybePromise<Credential>)): MaybePromise<Credential> =>
    typeof source === "function" ? source() : source.get();

const isTokenStore = (value: unknown): value is TokenStore =>
    typeof value === "object" && value !== null && "get" in value && "subscribe" in value;

const toBase64 = (value: string): string =>
    typeof btoa === "function" ? btoa(value) : Buffer.from(value, "utf8").toString("base64");

/** The session token of an admin or vendor panel user, as `Authorization: Bearer`. */
export const bearerAuth = (token: TokenStore | (() => MaybePromise<Credential>)): AuthScheme => ({ type: "bearer", token });

/** A secret API key (`sk_…`), sent the way Medusa expects it: HTTP Basic with the key as the user. */
export const apiKeyAuth = (key: TokenStore | (() => MaybePromise<Credential>)): AuthScheme => ({ type: "api-key", key });

/** A publishable API key (`pk_…`) for the Store API. */
export const publishableKeyAuth = (key: TokenStore | (() => MaybePromise<Credential>)): AuthScheme => ({ type: "publishable-key", key });

/** Any other credential header, e.g. the vendor panel's active seller. */
export const headerAuth = (name: string, value: TokenStore | (() => MaybePromise<Credential>)): AuthScheme => ({ type: "header", name, value });

export async function resolveAuthHeaders(auth: AuthOption | undefined): Promise<Record<string, string>> {
    if (!auth) return {};
    const schemes: AuthScheme[] = isTokenStore(auth) ? [bearerAuth(auth)] : Array.isArray(auth) ? auth : [auth];
    const headers: Record<string, string> = {};

    for (const scheme of schemes) {
        switch (scheme.type) {
            case "bearer": {
                const token = await read(scheme.token);
                if (token) headers.Authorization = `Bearer ${token}`;
                break;
            }
            case "api-key": {
                const key = await read(scheme.key);
                if (key) headers.Authorization = `Basic ${toBase64(`${key}:`)}`;
                break;
            }
            case "publishable-key": {
                const key = await read(scheme.key);
                if (key) headers["x-publishable-api-key"] = key;
                break;
            }
            case "header": {
                const value = await read(scheme.value);
                if (value) headers[scheme.name] = value;
                break;
            }
        }
    }

    return headers;
}

/** Clears every token store the auth option reads from; used after a 401. */
export function clearAuthStores(auth: AuthOption | undefined): void {
    if (!auth) return;
    const schemes: AuthScheme[] = isTokenStore(auth) ? [bearerAuth(auth)] : Array.isArray(auth) ? auth : [auth];
    for (const scheme of schemes) {
        const source = scheme.type === "bearer" ? scheme.token : scheme.type === "header" ? scheme.value : scheme.key;
        if (isTokenStore(source) && scheme.type === "bearer") source.clear();
    }
}

/**
 * The stores the admin and vendor panels keep their sessions in. A plugin's
 * dashboard code reads the same session by using the same store, so it never
 * has to know the storage key.
 */
export const ADMIN_TOKEN_KEY = "mercur_admin_auth_token";
export const VENDOR_TOKEN_KEY = "mercur_vendor_auth_token";
export const VENDOR_SELLER_KEY = "mercur_vendor_seller_id";

export const adminTokenStore: TokenStore = createTokenStore(ADMIN_TOKEN_KEY);
export const vendorTokenStore: TokenStore = createTokenStore(VENDOR_TOKEN_KEY);
export const vendorSellerStore: TokenStore = createTokenStore(VENDOR_SELLER_KEY);

/** Auth for anything that talks to `/admin/*` as the signed-in panel user. */
export const adminAuth = (): AuthScheme[] => [bearerAuth(adminTokenStore)];

/** Auth for `/vendor/*` as the signed-in seller member, scoped to the active seller. */
export const vendorAuth = (): AuthScheme[] => [
    bearerAuth(vendorTokenStore),
    headerAuth("x-seller-id", vendorSellerStore),
];
