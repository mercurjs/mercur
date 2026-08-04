<br>
<p align="center">
  <a href="https://github.com/mercurjs/mercur">
    <img src="https://cdn.prod.website-files.com/6790aeffc4b432ccaf1b56e5/67a225dc6fa298afc1cc4ae6_Mercur%20Cover.png" alt="Mercur">
  </a>
</p>

<h1 align="center">
  Mercur
</h1>

<div align="center">
  <h3>The open-source marketplace platform. A Mirakl alternative.</h3>
</div>

<h4 align="center">
  <a href="https://mercurjs.com/">Website</a> ·
  <a href="https://docs.mercurjs.com">Documentation</a> ·
  <a href="https://demo.mercurjs.com/">Live Demo</a> ·
  <a href="https://discord.gg/hnZBzc4NJU">Discord</a>
</h4>

<div align="center">

  [![License](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/mercurjs/mercur/tree/main?tab=MIT-1-ov-file)
  [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/mercurjs/mercur/issues/new/choose)
  [![Support](https://img.shields.io/badge/support-contact%20author-blueviolet.svg)](https://www.mercurjs.com/contact)
  [![GitHub closed issues](https://img.shields.io/github/issues-closed/mercurjs/mercur)](https://github.com/mercurjs/mercur/issues?q=is%3Aissue%20state%3Aclosed)
    <br>
    <br>
  [![Discord](https://img.shields.io/badge/Discord-Join%20Chat-5865F2?logo=discord&logoColor=white)](https://discord.gg/hnZBzc4NJU)

</div>

## What is Mercur

<img width="100%" alt="demo-screen" src="https://github.com/user-attachments/assets/8b73163c-230a-46c4-b86c-fed4fa339964" />

**Mercur** is an open-source, headless platform for building multi-vendor marketplaces. Add vendor onboarding, multi-vendor catalogs, offers, commissions, and automated payouts on top of a commerce core you can change at its foundation. Run B2C, B2B, and hybrid marketplaces without choosing between a profit-draining SaaS platform and a build from scratch.

- **Own your marketplace, no fees**: Self-host on your own infrastructure with full source access. No percentage of GMV, no per-transaction cut, no vendor lock-in — your data, your customers, and your roadmap stay yours.
- **Built for the marketplace model**: Vendor onboarding, multi-vendor catalogs, offers, commissions, and automated payouts are built in — multiple sellers can list offers against the same product, so you're not rebuilding marketplace logic on top of a single-seller commerce engine.
- **Headless and customizable, no forks**: TypeScript, event-driven, and API-first — serve any storefront or frontend. Extend or override workflows, products, and vendor rules through a composable architecture built for the most complex B2B and multi-vendor models, without patching the core.
- **Standing on [Medusa](https://medusajs.com/)**: Inherit a mature, battle-tested commerce core — catalog, orders, payments, shipping, tax, and stock — instead of reinventing it. Mercur adds the marketplace layer on top of **[Medusa](https://medusajs.com/)**.
- **Production-ready and AI-native**: Run real marketplaces in production today, on an architecture designed for AI-assisted development — an introspectable, API-first stack that works hand in hand with your AI coding tools.

![Mercur Use Cases](https://cdn.prod.website-files.com/6790aeffc4b432ccaf1b56e5/67b46aa08180d5b8499c6a15_Use-cases.jpg)

<!-- GETTING STARTED -->

## Getting Started

To get a local marketplace up and running, please follow these simple steps.

### Prerequisites

Here's what you need to run Mercur.

- Node.js (Version: >=20.x)
- PostgreSQL (Version: >=13.x)
- Redis
- Bun _(recommended)_

> If you want to enable any of the available integrations (e.g. Stripe Connect payouts, Resend email, Algolia/Meilisearch search), you may want to obtain additional credentials for each one and add them to your `.env` file.

### Setup

1. Create a new Mercur project

   ```sh
   bun create mercur-app@latest my-marketplace
   ```

2. Start the development server

   ```sh
   cd my-marketplace
   bun run dev
   ```

3. Access your marketplace
   - Backend API: `http://localhost:9000`
   - Admin Panel: `http://localhost:9000/dashboard`
   - Vendor Panel: `http://localhost:9000/seller`

   Your marketplace comes seeded with a demo store out of the box — a ready-to-go seller (`seller@mercur.dev` / `supersecret`) with a full catalog of products and offers, so you can explore the admin and vendor panels immediately. Sign in to the Vendor Panel with those credentials, or manage everything from the Admin Panel.

### Built With

- [Medusa.js](https://medusajs.com/)
- [TypeScript](https://www.typescriptlang.org/)
- [React.js](https://reactjs.org/)
- [Vite](https://vitejs.dev/)
- [Node.js](https://nodejs.org/)
- [PostgreSQL](https://www.postgresql.org/)
- [Redis](https://redis.io/)

## Architecture

Mercur is modular. Each piece is a separate, independently deployable app that talks to the core over APIs.

- **Mercur Core**: the marketplace engine on top of Medusa, with vendors, commissions, payouts, and multi-vendor primitives.
- **Admin Panel**: marketplace operators manage vendors, catalog, categories, commissions, and rules.
- **Vendor Panel**: sellers manage their products, orders, and payouts.
- **Storefronts**: customer-facing B2C/B2B apps with multi-vendor browsing, cart, and checkout.

![Mercur](https://cdn.prod.website-files.com/6790aeffc4b432ccaf1b56e5/67a1020f202572832c954ead_6b96703adfe74613f85133f83a19b1f0_Fleek%20Tilt%20-%20Readme.png)

## What's in this repo

This is the Mercur development monorepo: the `@mercurjs/core` plugin, the React + Vite admin and vendor dashboards, the `@mercurjs/cli`, the typed API client, the dashboard SDK, the Stripe Connect payout provider, and the cross-package integration suites. If you just want to build a marketplace, run `bun create mercur-app@latest` (see [Getting Started](#getting-started)) - clone this repo only when you want to contribute to Mercur itself.

## Deployment

Because Mercur is a plain Node.js application backed by PostgreSQL and Redis, it deploys the same way whether you ship it as a container, orchestrate it with Kubernetes, push it to a managed cloud, or lock it inside an air-gapped network. There's no proprietary runtime to adopt and no hosting tier you're forced onto, so where your marketplace lives and where its data sits stay entirely under your control. Prefer a managed backend? Mercur also deploys to [Medusa Cloud](https://medusajs.com/pricing/) with push-to-deploy and auto-scaling.

## License

This repository is **Mercur core**, licensed under the [MIT License](./LICENSE) and fully open source. It's the marketplace engine on top of [Medusa](https://medusajs.com) — vendors, multi-vendor catalogs, offers, commissions, and payouts, with the admin and vendor dashboards and APIs to run a marketplace yourself.

**Mercur Enterprise** adds a licensed suite of advanced modules (EAN matching & deduplication, a Buy Box / winning-offer engine, master-data governance, multi-channel stock sync, automated split payouts, vendor KYC, and much more), all maintained, tested, and upgraded by the core team. You deploy and run Enterprise on your own infrastructure, exactly like the open-source core.

It comes backed by a direct support relationship with the people who build the platform: a dedicated support channel, contractual SLAs with guaranteed response times, prioritized bug fixes and security patches, and hands-on onboarding and architecture guidance to get you to production. Higher support tiers add priority escalation and a named technical contact.

[Book Mercur Enterprise demo](https://www.mercurjs.com/enterprise).

## Professional services

Mercur is built and maintained by [Rigby](https://rigbyjs.com), a team that has designed, built, and launched multi-vendor marketplaces in production. If you'd rather not do it alone, we work alongside your engineers — from architecture reviews and integrating Mercur with your existing stack to hardening, scaling, and getting your marketplace live on schedule. [Talk to our team](https://www.mercurjs.com/contact).

## Contribution

Mercur is an Open Source project and we encourage everyone to help us making it better. If you are interested in contributing to the project, please read our [Contributing Guide](https://raw.githubusercontent.com/mercurjs/mercur/refs/heads/new/CONTRIBUTING.md) and [Code of Conduct](https://raw.githubusercontent.com/mercurjs/mercur/refs/heads/new/CODE_OF_CONDUCT.md).

If you have any questions about contributing, please join our [Discord server](https://discord.gg/hnZBzc4NJU) - we are happy to help you!

Discovered a 🐜 or have feature suggestion? Feel free to [create an issue](https://github.com/mercurjs/mercur/issues/new/choose) on Github.

## Upgrades

Follow the [Release Notes](https://github.com/mercurjs/mercur/releases) to keep your Mercur marketplace up-to-date.

## Contributors

<a href="https://github.com/mercurjs/mercur/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=mercurjs/mercur" alt="Mercur contributors" />
</a>

## Star history

<a href="https://star-history.com/#mercurjs/mercur&Date">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="./.github/assets/star-history-dark.svg" />
    <img src="./.github/assets/star-history.svg" alt="Star History Chart" width="70%" />
  </picture>
</a>
