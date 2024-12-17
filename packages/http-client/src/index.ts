const getBody = <T>(c: Response | Request): Promise<T> => {
  const contentType = c.headers.get("content-type");

  if (contentType && contentType.includes("application/json")) {
    return c.json();
  }

  if (contentType && contentType.includes("application/pdf")) {
    return c.blob() as Promise<T>;
  }

  return c.text() as Promise<T>;
};

export class FetchError extends Error {
  status: number | undefined;
  statusText: string | undefined;

  constructor(message: string, statusText?: string, status?: number) {
    super(message);
    this.statusText = statusText;
    this.status = status;
  }
}

export const customFetch = async <T>(
  url: string,
  options: RequestInit
): Promise<T> => {
  const requestInit: RequestInit = {
    credentials: "include",
    ...options,
  };

  const request = new Request(url, requestInit);
  const response = await fetch(request);

  if (!response.ok) {
    const jsonError = (await response.json().catch(() => ({}))) as {
      message?: string;
    };

    throw new FetchError(
      jsonError.message ?? response.statusText,
      response.statusText,
      response.status
    );
  }

  const data = await getBody<T>(response);

  return { status: response.status, data, headers: response.headers } as T;
};
