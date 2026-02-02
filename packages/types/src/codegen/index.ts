export type HttpMethod = "GET" | "POST" | "DELETE";

export type RouteHandler = {
    method: HttpMethod;
    input: string | null;
    output: string | null;
};

export type RouteInfo = {
    filePath: string;
    route: string;
    handlers: RouteHandler[];
};
