```
██████╗ ██╗      █████╗ ██╗   ██╗██╗    ██╗██████╗ ██╗ ██████╗ ██╗  ██╗████████╗
██╔══██╗██║     ██╔══██╗╚██╗ ██╔╝██║    ██║██╔══██╗██║██╔════╝ ██║  ██║╚══██╔══╝
██████╔╝██║     ███████║ ╚████╔╝ ██║ █╗ ██║██████╔╝██║██║  ███╗███████║   ██║
██╔═══╝ ██║     ██╔══██║  ╚██╔╝  ██║███╗██║██╔══██╗██║██║   ██║██╔══██║   ██║
██║     ███████╗██║  ██║   ██║   ╚███╔███╔╝██║  ██║██║╚██████╔╝██║  ██║   ██║
╚═╝     ╚══════╝╚═╝  ╚═╝   ╚═╝    ╚══╝╚══╝ ╚═╝  ╚═╝╚═╝ ╚═════╝ ╚═╝  ╚═╝   ╚═╝

███████╗██╗  ██╗██╗██╗     ██╗
██╔════╝██║ ██╔╝██║██║     ██║
███████╗█████╔╝ ██║██║     ██║
╚════██║██╔═██╗ ██║██║     ██║
███████║██║  ██╗██║███████╗███████╗
╚══════╝╚═╝  ╚═╝╚═╝╚══════╝╚══════╝
```
<p align="left">
  <picture>
    <source
      srcset="https://testdino.com/images/logo-icon-white.svg"
      media="(prefers-color-scheme: dark)"
    />
    <source
      srcset="https://testdino.com/images/logo-icon-black.svg"
      media="(prefers-color-scheme: light)"
    />
    <img
      src="https://testdino.com/images/logo-icon-black.svg"
      width="24"
      height="24"
      alt="TestDino Logo"
      align="center"
    />
  </picture> by
  <a href="https://testdino.com">testdino.com</a>
  — Purpose built for debugging, managing, and improving Playwright tests with AI
</p>

# Playwright Skill Guides

Playwright guides for E2E, API, component, visual, accessibility, and security testing, plus CLI automation. **70+ guides** with TypeScript and JavaScript examples.

Updated Playwright 1.60 coverage: on-demand HAR recording, `locator.drop()`, page-level aria snapshots, `test.abort()`, `getByRole({ description })`, `toHaveCSS({ pseudo })`, and `connectOverCDP({ noDefaults })` — plus all 1.59 features. 

## Install

Add all skills to your project:

```bash
npx skills add testdino-hq/playwright-skill
```

Or add individual skill packs:

```bash
npx skills add testdino-hq/playwright-skill/core
npx skills add testdino-hq/playwright-skill/ci
npx skills add testdino-hq/playwright-skill/pom
npx skills add testdino-hq/playwright-skill/migration
npx skills add testdino-hq/playwright-skill/playwright-cli
```

> 🎬 Watch the installation guide 
[![Watch the installation guide](https://img.youtube.com/vi/8dRCJZ_we0s/maxresdefault.jpg)](https://www.youtube.com/watch?v=8dRCJZ_we0s)

## Skills Overview

| Skill Pack | Guides | What's Covered |
|---|:---:|---|
| **core** | 46 | Locators, assertions, fixtures, auth, API testing, network mocking, visual regression, accessibility, debugging, framework recipes |
| **ci** | 9 | GitHub Actions, GitLab CI, CircleCI, Azure DevOps, Jenkins, Docker, sharding, reporting, coverage |
| **pom** | 2 | Page Object Model patterns, POM vs fixtures vs helpers |
| **migration** | 2 | Migrating from Cypress, migrating from Selenium |
| **playwright-cli** | 11 | CLI browser automation, screenshots, tracing, session management, device emulation |

## Core Skills

The foundation of Playwright testing. These guides cover everything you need to write, debug, and maintain reliable end-to-end tests.

- **Start here** if you're new to Playwright — begin with locators, assertions, and fixtures
- Covers common patterns like authentication, API testing, network mocking, and visual regression
- Includes framework-specific recipes for React, Vue, Angular, and Next.js
- Debugging guides to help you fix flaky tests and common pitfalls

### Writing Tests

| Guide | Description |
|---|---|
| [locators.md](core/locators.md) | Selector strategies — `getByRole`, `getByText`, `getByTestId` |
| [assertions-and-waiting.md](core/assertions-and-waiting.md) | Web-first assertions, auto-retry, waiting patterns |
| [fixtures-and-hooks.md](core/fixtures-and-hooks.md) | `test.extend()`, setup/teardown, worker-scoped fixtures |
| [configuration.md](core/configuration.md) | `playwright.config.ts` — projects, timeouts, reporters, web server |
| [test-organization.md](core/test-organization.md) | File structure, tagging, `test.describe`, test filtering |
| [test-data-management.md](core/test-data-management.md) | Factories, seeding, cleanup strategies |
| [authentication.md](core/authentication.md) | Storage state reuse, multi-role auth, session management |
| [api-testing.md](core/api-testing.md) | REST and GraphQL testing with `request` fixture |
| [network-mocking.md](core/network-mocking.md) | Route interception, HAR replay, response modification |
| [forms-and-validation.md](core/forms-and-validation.md) | Form fills, validation, error states, multi-step wizards |
| [visual-regression.md](core/visual-regression.md) | Screenshot comparison, thresholds, masking dynamic content |
| [accessibility.md](core/accessibility.md) | axe-core integration, ARIA assertions, a11y auditing |
| [component-testing.md](core/component-testing.md) | Mount React/Vue/Svelte components in isolation |
| [mobile-and-responsive.md](core/mobile-and-responsive.md) | Device emulation, viewport testing, touch interactions |

### Debugging & Fixing

| Guide | Description |
|---|---|
| [debugging.md](core/debugging.md) | Trace viewer, `PWDEBUG`, UI mode, headed + slow-mo |
| [error-index.md](core/error-index.md) | Common error messages and how to fix them |
| [flaky-tests.md](core/flaky-tests.md) | Root causes, retry strategies, stabilization patterns |
| [common-pitfalls.md](core/common-pitfalls.md) | Top beginner mistakes and how to avoid them |

### Framework Recipes

| Guide | Description |
|---|---|
| [nextjs.md](core/nextjs.md) | App Router + Pages Router testing |
| [react.md](core/react.md) | CRA, Vite, component testing |
| [vue.md](core/vue.md) | Vue 3 / Nuxt testing |
| [angular.md](core/angular.md) | Angular testing patterns |

### Specialized Topics

| Guide | Description |
|---|---|
| [browser-apis.md](core/browser-apis.md) | Geolocation, clipboard, permissions |
| [iframes-and-shadow-dom.md](core/iframes-and-shadow-dom.md) | Cross-frame testing, Shadow DOM piercing |
| [multi-context-and-popups.md](core/multi-context-and-popups.md) | Multi-tab, popups, new windows |
| [websockets-and-realtime.md](core/websockets-and-realtime.md) | WebSocket testing, real-time UI |
| [canvas-and-webgl.md](core/canvas-and-webgl.md) | Canvas testing, visual comparison |
| [electron-testing.md](core/electron-testing.md) | Desktop app testing with Electron |
| [security-testing.md](core/security-testing.md) | XSS, CSRF, header validation |
| [performance-testing.md](core/performance-testing.md) | Core Web Vitals, Lighthouse, benchmarks |
| [clock-and-time-mocking.md](core/clock-and-time-mocking.md) | Fake timers, date mocking |
| [service-workers-and-pwa.md](core/service-workers-and-pwa.md) | PWA testing, offline mode |
| [browser-extensions.md](core/browser-extensions.md) | Extension testing patterns |
| [i18n-and-localization.md](core/i18n-and-localization.md) | Multi-language, RTL, locale testing |

## CI/CD Skills

| Guide | Description |
|---|---|
| [ci-github-actions.md](ci/ci-github-actions.md) | Workflows, caching, artifact uploads |
| [ci-gitlab.md](ci/ci-gitlab.md) | GitLab CI pipelines |
| [ci-other.md](ci/ci-other.md) | CircleCI, Azure DevOps, Jenkins |
| [parallel-and-sharding.md](ci/parallel-and-sharding.md) | Sharding across CI runners |
| [docker-and-containers.md](ci/docker-and-containers.md) | Containerized test execution |
| [reporting-and-artifacts.md](ci/reporting-and-artifacts.md) | HTML reports, traces, screenshots |
| [test-coverage.md](ci/test-coverage.md) | Code coverage collection |
| [global-setup-teardown.md](ci/global-setup-teardown.md) | One-time setup/teardown |
| [projects-and-dependencies.md](ci/projects-and-dependencies.md) | Multi-project config, dependencies |

## Playwright CLI Skills

| Guide | Description |
|---|---|
| [core-commands.md](playwright-cli/core-commands.md) | Open, navigate, click, fill, keyboard, mouse |
| [request-mocking.md](playwright-cli/request-mocking.md) | Route interception, conditional mocks, HAR replay |
| [running-custom-code.md](playwright-cli/running-custom-code.md) | Full Playwright API via `run-code` |
| [session-management.md](playwright-cli/session-management.md) | Named sessions, isolation, persistent profiles |
| [storage-and-auth.md](playwright-cli/storage-and-auth.md) | Cookies, localStorage, auth state save/restore |
| [test-generation.md](playwright-cli/test-generation.md) | Auto-generate test code from CLI interactions |
| [tracing-and-debugging.md](playwright-cli/tracing-and-debugging.md) | Traces, console/network monitoring |
| [screenshots-and-media.md](playwright-cli/screenshots-and-media.md) | Screenshots, video recording, PDF export |
| [device-emulation.md](playwright-cli/device-emulation.md) | Viewport, geolocation, locale, dark mode |
| [advanced-workflows.md](playwright-cli/advanced-workflows.md) | Popups, scraping, accessibility auditing |

## Migration Skills

| Guide | Description |
|---|---|
| [from-cypress.md](migration/from-cypress.md) | Cypress to Playwright migration |
| [from-selenium.md](migration/from-selenium.md) | Selenium/WebDriver to Playwright migration |

## Page Object Model Skills

| Guide | Description |
|---|---|
| [page-object-model.md](pom/page-object-model.md) | POM patterns for Playwright |
| [pom-vs-fixtures-vs-helpers.md](pom/pom-vs-fixtures-vs-helpers.md) | When to use POM vs fixtures vs helpers |

## License

[MIT](LICENSE)
