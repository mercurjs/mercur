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

export type RouteDef<TInput = unknown, TOutput = unknown> = {
    input: TInput;
    output: TOutput;
};

export type Router = {
    queries: Record<string, RouteDef>;
    mutations: Record<string, RouteDef>;
    deletes: Record<string, RouteDef>;
};

