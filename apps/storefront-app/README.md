# Mercur storefront apps

One website, then thin native shells that load it. The Next.js storefront stays the product; this package is how you **test it on every OS** and **ship it to the stores**.

| Surface | How you run it | How you ship it |
| --- | --- | --- |
| Website | `bun run platform:web` | Host `apps/storefront` (`next start` / Docker / any Node host) |
| Installable PWA | same URL → browser “Install app” / iOS “Add to Home Screen” | The hosted website (manifest + service worker) |
| macOS | `bun run platform:macos` | Mac App Store (`mas` build) or a signed `.dmg` |
| Windows | `bun run platform:windows` | Microsoft Store (`.appx`) or `.exe` |
| Linux | `bun run platform:linux` | Snap Store, Flathub (`.deb` / `.rpm` / AppImage) |
| iOS | `bun run platform:ios` | App Store via Xcode |
| Android | `bun run platform:android` | Play Store via Android Studio |

Native apps are **not** a rewrite. They open the storefront URL in a platform WebView so checkout, cookies, and SSR keep working.

Set `MERCUR_STOREFRONT_URL` (production) or `STOREFRONT_URL` (local) when the site is not `http://127.0.0.1:3000`.

## Test on this machine

From the repo root (API can already be running on `:9000`):

```sh
bun install
bun run --filter @mercurjs/storefront-app icons   # once
bun run platform:web        # website at http://127.0.0.1:3000
bun run platform:macos      # desktop window (also used for Windows/Linux locally)
bun run platform:ios        # iOS Simulator (Xcode)
bun run platform:android    # Android Emulator (Android Studio)
bun run platform:device     # physical phone on the same Wi-Fi
```

On Windows or Linux, `platform:macos` / `platform:windows` / `platform:linux` all launch the same desktop shell; package per-OS with `package:desktop`.

### Physical phone

1. Phone and Mac on the same Wi-Fi.
2. `ALLOWED_DEV_ORIGIN=<your-lan-ip> bun run platform:device`
3. Accept the local-network prompt on iOS.

### Production URL in a shell

```sh
STOREFRONT_URL=https://b2c.mercurjs.com bun run platform:macos
```

## Ship

**Website.** Deploy `apps/storefront` as today (`output: "standalone"`). PWAs install from that URL automatically.

**iOS / Android.** First run of `platform:ios` / `platform:android` adds the Capacitor project. Then:

```sh
bun run --filter @mercurjs/storefront-app package:ios      # opens Xcode
bun run --filter @mercurjs/storefront-app package:android  # opens Android Studio
```

Archive in Xcode → App Store Connect. Android Studio → Generate signed App Bundle → Play Console.

Before you archive, point the shell at production:

```sh
STOREFRONT_URL=https://your-marketplace.example.com bunx cap sync
```

**Desktop stores.**

```sh
MERCUR_STOREFRONT_URL=https://your-marketplace.example.com \
  bun run --filter @mercurjs/storefront-app package:desktop
```

Artifacts land in `apps/storefront-app/release/`:

- macOS: `.dmg` (add `--mac mas` for Mac App Store after you set signing identities)
- Windows: `.exe` and `.appx` (Microsoft Store Partner Center — replace `CN=Mercur` in `electron-builder.yml` with your publisher id)
- Linux: `.AppImage`, `.deb`, `.rpm`, `.snap` (Snap Store / Flathub)

CI can build those on demand: `.github/workflows/storefront-packages.yml`.

## Identifiers

Keep these in sync when you rebrand:

- App id: `com.mercurjs.storefront`
- URL scheme: `mercur://`
- Icons: `bun run --filter @mercurjs/storefront-app icons`
