import { ModuleProvider, Modules } from "@medusajs/framework/utils";

import ResendService from "./service";
export * from "./types";

export default ModuleProvider(Modules.NOTIFICATION, {
  services: [ResendService],
});
