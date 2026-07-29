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

[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Playwright](https://img.shields.io/badge/Playwright-1.61%2B-2EAD33.svg)](https://playwright.dev)
[![Guides](https://img.shields.io/badge/guides-70-blue.svg)](SKILL.md)

Production-tested Playwright guides for E2E, API, component, visual, accessibility, and security testing, plus CI/CD, CLI automation, trace-report debugging, page objects, and migration. **70 guides** with TypeScript and JavaScript examples throughout.

These are [Agent Skills](https://docs.claude.com/en/docs/claude-code/skills) — Markdown guides an AI coding agent loads on demand. Install them with the `skills` CLI and your agent pulls the right guide when you ask it to write, debug, or scale Playwright tests. [SKILL.md](SKILL.md) is the canonical index the agent reads, including the Golden Rules and architecture-decision guides.

Playwright 1.61 coverage: WebAuthn passkey testing (`context.credentials`), the `page.localStorage` / `page.sessionStorage` Web Storage API, new video retention modes, `expect.soft.poll()`, WebSockets in HAR and traces, and `apiResponse.securityDetails()` / `serverAddr()` — plus all 1.60 features (on-demand HAR in tracing, `locator.drop()`, page-level aria snapshots, `test.abort()`, `getByRole({ description })`, `toHaveCSS({ pseudo })`) and 1.59 features.

## Install

Add every skill pack to your project:

```bash
npx skills add testdino-hq/playwright-skill
```

Or add individual packs:

```bash
npx skills add testdino-hq/playwright-skill/core
npx skills add testdino-hq/playwright-skill/ci
npx skills add testdino-hq/playwright-skill/pom
npx skills add testdino-hq/playwright-skill/migration
npx skills add testdino-hq/playwright-skill/playwright-cli
```

> 🎬 Watch the installation guide
[![Watch the installation guide](https://img.youtube.com/vi/8dRCJZ_we0s/maxresdefault.jpg)](https://www.youtube.com/watch?v=8dRCJZ_we0s)

## Skill Packs

| Pack | Guides | What's covered |
|---|:---:|---|
| **core** | 47 | Locators, assertions, fixtures, auth, API testing, network mocking, visual regression, accessibility, debugging, trace-report analysis, framework recipes, architecture decisions |
| **ci** | 9 | GitHub Actions, GitLab CI, CircleCI, Azure DevOps, Jenkins, Docker, sharding, reporting, coverage |
| **playwright-cli** | 10 | CLI browser automation, screenshots, tracing, session management, device emulation |
| **pom** | 2 | Page Object Model patterns, POM vs fixtures vs helpers |
| **migration** | 2 | Migrating from Cypress, migrating from Selenium |

## Golden Rules

The patterns every guide assumes (full list with rationale in [SKILL.md](SKILL.md)):

1. **`getByRole()` over CSS/XPath** — resilient to markup changes
2. **Never `page.waitForTimeout()`** — use web-first assertions or `page.waitForURL()`
3. **Isolate every test** — no shared state, no order dependencies
4. **`baseURL` in config** — zero hardcoded URLs in tests
5. **Mock external services only** — never mock your own app

## Core Skills

The foundation: writing, debugging, and maintaining reliable tests. New to Playwright? Start with [locators.md](core/locators.md), [assertions-and-waiting.md](core/assertions-and-waiting.md), and [fixtures-and-hooks.md](core/fixtures-and-hooks.md).

### Writing Tests

| Guide | Description |
|---|---|
| [locators.md](core/locators.md) | Selector strategies — `getByRole`, `getByText`, `getByTestId` |
| [locator-strategy.md](core/locator-strategy.md) | Choosing a locator strategy and trade-offs |
| [assertions-and-waiting.md](core/assertions-and-waiting.md) | Web-first assertions, auto-retry, waiting patterns |
| [fixtures-and-hooks.md](core/fixtures-and-hooks.md) | `test.extend()`, setup/teardown, worker-scoped fixtures |
| [configuration.md](core/configuration.md) | `playwright.config.ts` — projects, timeouts, reporters, web server |
| [test-organization.md](core/test-organization.md) | File structure, tagging, `test.describe`, test filtering |
| [test-data-management.md](core/test-data-management.md) | Factories, seeding, cleanup strategies |
| [authentication.md](core/authentication.md) | Storage state reuse, multi-role auth, session management |
| [auth-flows.md](core/auth-flows.md) | Login, OAuth, and multi-step auth flows |
| [api-testing.md](core/api-testing.md) | REST and GraphQL testing with `request` fixture |
| [network-mocking.md](core/network-mocking.md) | Route interception, HAR replay, response modification |
| [when-to-mock.md](core/when-to-mock.md) | When to mock vs hit real services |
| [forms-and-validation.md](core/forms-and-validation.md) | Form fills, validation, error states, multi-step wizards |
| [crud-testing.md](core/crud-testing.md) | Create / read / update / delete flow testing |
| [search-and-filter.md](core/search-and-filter.md) | Search and filter UI testing |
| [drag-and-drop.md](core/drag-and-drop.md) | Drag-and-drop interactions |
| [file-operations.md](core/file-operations.md) | File handling in tests |
| [file-upload-download.md](core/file-upload-download.md) | Upload and download flows |
| [error-and-edge-cases.md](core/error-and-edge-cases.md) | Error states and edge-case coverage |
| [visual-regression.md](core/visual-regression.md) | Screenshot comparison, thresholds, masking dynamic content |
| [accessibility.md](core/accessibility.md) | axe-core integration, ARIA assertions, a11y auditing |
| [component-testing.md](core/component-testing.md) | Mount React/Vue/Svelte components in isolation |
| [mobile-and-responsive.md](core/mobile-and-responsive.md) | Device emulation, viewport testing, touch interactions |

### Debugging & Fixing

| Guide | Description |
|---|---|
| [debugging.md](core/debugging.md) | Trace viewer, `PWDEBUG`, UI mode, headed + slow-mo |
| [trace-analysis.md](core/trace-analysis.md) | Debug a `trace.zip` from the terminal with the `npx playwright trace` CLI — agent-native, decision trees, failure playbooks |
| [error-index.md](core/error-index.md) | Common error messages and how to fix them |
| [flaky-tests.md](core/flaky-tests.md) | Root causes, retry strategies, stabilization patterns |
| [common-pitfalls.md](core/common-pitfalls.md) | Top beginner mistakes and how to avoid them |

### Architecture Decisions

| Question | Guide |
|---|---|
| E2E vs component vs API? | [test-architecture.md](core/test-architecture.md) |
| Which locator strategy? | [locator-strategy.md](core/locator-strategy.md) |
| Mock vs real services? | [when-to-mock.md](core/when-to-mock.md) |
| POM vs fixtures vs helpers? | [pom-vs-fixtures-vs-helpers.md](pom/pom-vs-fixtures-vs-helpers.md) |

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
| [multi-user-and-collaboration.md](core/multi-user-and-collaboration.md) | Multi-user and real-time collaboration flows |
| [websockets-and-realtime.md](core/websockets-and-realtime.md) | WebSocket testing, real-time UI |
| [canvas-and-webgl.md](core/canvas-and-webgl.md) | Canvas testing, visual comparison |
| [electron-testing.md](core/electron-testing.md) | Desktop app testing with Electron |
| [security-testing.md](core/security-testing.md) | XSS, CSRF, header validation |
| [performance-testing.md](core/performance-testing.md) | Core Web Vitals, Lighthouse, benchmarks |
| [clock-and-time-mocking.md](core/clock-and-time-mocking.md) | Fake timers, date mocking |
| [service-workers-and-pwa.md](core/service-workers-and-pwa.md) | PWA testing, offline mode |
| [browser-extensions.md](core/browser-extensions.md) | Extension testing patterns |
| [third-party-integrations.md](core/third-party-integrations.md) | Testing against third-party services |
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
