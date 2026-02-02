export type HttpMethod = "GET" | "POST" | "DELETE";

export type RouteInfo = {
    filePath: string;
    route: string;
};

export type RecursiveReadDirOptions = {
    pathnameFilter?: (pathname: string) => boolean;
    ignoreFilter?: (pathname: string) => boolean;
    ignorePartFilter?: (part: string) => boolean;
    sortPathnames?: boolean;
};
