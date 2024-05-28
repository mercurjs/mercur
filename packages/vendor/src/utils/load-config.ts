import type { ConfigModule } from "@medusajs/medusa";
import { getConfigFile } from "medusa-core-utils";
import { PluginOptions } from "../types";

export const loadConfig = (isDev?: boolean): PluginOptions | null => {
  const { configModule } = getConfigFile<ConfigModule>(
    process.cwd(),
    "medusa-config"
  );

  const plugin = configModule.plugins.find(
    (p) =>
      (typeof p === "string" &&
        p === "@rigby-software-house/mercurjs-vendor") ||
      (typeof p === "object" &&
        p.resolve === "@rigby-software-house/mercurjs-vendor")
  );

  if (!plugin) {
    return null;
  }

  let config: PluginOptions = {
    serve: true,
    autoRebuild: false,
    path: "/",
    outDir: "build-vendor",
    backend: isDev ? "http://localhost:9000" : "/",
    develop: {
      open: true,
      port: 7002,
      allowedHosts: "auto",
      host: "localhost",
    },
  };

  if (typeof plugin !== "string") {
    const options = (plugin as { options: PluginOptions }).options ?? {};

    const serve = options.serve !== undefined ? options.serve : config.serve;

    const serverUrl = serve
      ? config.backend
      : options.backend
      ? options.backend
      : "/";

    config = {
      serve,
      autoRebuild: options.autoRebuild ?? config.autoRebuild,
      path: options.path ?? config.path,
      outDir: options.outDir ?? config.outDir,
      backend: serverUrl,
      develop: {
        open: options.develop?.open ?? config.develop.open,
        port: options.develop?.port ?? config.develop.port,
        allowedHosts:
          options.develop?.allowedHosts ?? config.develop.allowedHosts,
        webSocketURL:
          options.develop?.webSocketURL ?? config.develop.webSocketURL,
        host: options.develop?.host ?? config.develop.host,
      },
    };
  }

  return config;
};
