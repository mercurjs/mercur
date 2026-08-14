import { app, BrowserWindow, shell } from "electron";
import path from "node:path";

import {
  APP_NAME,
  BACKGROUND_COLOR,
  DEFAULT_PRODUCTION_URL,
} from "../src/identity";
import { resolveStorefrontUrl } from "../src/resolve-url";

const isDev = !app.isPackaged;

function storefrontUrl(): string {
  if (process.env.STOREFRONT_URL) {
    return process.env.STOREFRONT_URL;
  }

  if (isDev) {
    return resolveStorefrontUrl("desktop");
  }

  return process.env.MERCUR_STOREFRONT_URL ?? DEFAULT_PRODUCTION_URL;
}

function createWindow(): void {
  const window = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 390,
    minHeight: 700,
    title: APP_NAME,
    backgroundColor: BACKGROUND_COLOR,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  const url = storefrontUrl();

  void window.loadURL(url).catch(() => {
    void window.loadFile(path.join(__dirname, "..", "www", "index.html"));
  });

  window.webContents.setWindowOpenHandler(({ url: nextUrl }) => {
    void shell.openExternal(nextUrl);
    return { action: "deny" };
  });
}

void app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
