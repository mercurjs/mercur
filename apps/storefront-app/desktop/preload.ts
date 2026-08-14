import { contextBridge } from "electron";

contextBridge.exposeInMainWorld("mercurDesktop", {
  platform: process.platform,
});
