import Medusa from "@medusajs/js-sdk";

export const backendUrl = __BACKEND_URL__ ?? "/";

const decodeJwt = (token: string) => {
  try {
    const payload = token.split(".")[1];
    const decoded = JSON.parse(atob(payload));

    return decoded;
  } catch {
    return null;
  }
};

export const isTokenExpired = (token: string | null) => {
  if (!token) {
    return true;
  }

  const payload = decodeJwt(token);

  if (!payload?.exp) {
    return true;
  }

  return payload.exp * 1000 < Date.now();
};

export const getAuthToken = () => {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem("medusa_auth_token");
};

export const sdk = new Medusa({
  baseUrl: backendUrl,
});

// useful when you want to call the BE from the console and try things out quickly
if (typeof window !== "undefined") {
  (window as any).__sdk = sdk;
}
