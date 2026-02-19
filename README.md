![Mercur Main Cover](https://cdn.prod.website-files.com/6790aeffc4b432ccaf1b56e5/67a225dc6fa298afc1cc4ae6_Mercur%20Cover.png)

<div align="center">
  <h1>Mercur <br> Open Source Marketplace Platform</h1> 
  <!-- Shields.io Badges -->
  <a href="https://github.com/mercurjs/mercur/tree/main?tab=MIT-1-ov-file">
    <img alt="License" src="https://img.shields.io/badge/license-MIT-blue.svg" />
  </a>
  <a href="https://github.com/mercurjs/mercur/issues/new/choose">
    <img alt="PRs Welcome" src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" />
  </a>
  <a href="https://www.mercurjs.com/contact">
    <img alt="Support" src="https://img.shields.io/badge/support-contact%20author-blueviolet.svg" />
  </a>
  <a href="https://discord.gg/hnZBzc4NJU">
    <img alt="Discord" src="https://img.shields.io/badge/Discord-Join%20Chat-5865F2?logo=discord&logoColor=white" />
  </a>
  <!-- Website Links -->
  <p>
    <a href="https://mercurjs.com/">Mercur</a> |   <a href="https://docs.mercurjs.com/">Docs</a> 
  </p> 
</div>

# What is Mercur?

<a href="https://www.mercurjs.com/">Mercur</a> is the first
truly limitless open source marketplace platform that
combines the simplicity of SaaS with the freedom of open
source. Built on
[MedusaJS](https://github.com/medusajs/medusa), it empowers
businesses to create custom marketplaces without choosing
between ownership and ease of use.

Mercur is a platform to start, customize, manage, and scale
your marketplace for every business model with a modern
technology stack.

> [!CAUTION]
> This is the canary branch of Mercur. It is **not production-ready** and is **not yet meant to be used in production**.
> Canary releases may contain breaking changes, incomplete features, and unstable APIs.
> For the stable version, please use the [main branch](https://github.com/mercurjs/mercur/tree/main).

## Mercur 2.0 Canary

We are actively working on **Mercur 2.0** — a major rearchitecture of the platform. [@vholik](https://github.com/vholik), [@Si3r4dz](https://github.com/Si3r4dz), and [@gtomaka](https://github.com/gtomaka) are building the next generation of Mercur with a new modular, block-based architecture.

**What's new in 2.0:**

- **Block-based architecture** — reusable modules, workflows, API routes, and UI extensions installable via CLI
- **Vendor portal** — a standalone React-based vendor dashboard
- **Dashboard SDK** — Vite plugin with file-based routing and hot module reloading
- **New CLI** — `@mercurjs/cli` for scaffolding projects, adding blocks, and managing registries
- **Full code ownership** — code is copied into your project, no black-box dependencies

**Try the canary:**

```bash
npm install @mercurjs/cli@canary
```

Canary versions are published on every release and are intended for early testing and feedback only. APIs and behavior may change without notice between canary releases.

## Why Choose Mercur?

- Full Ownership: Unlike SaaS platforms, you own your
  marketplace with no transaction fees or vendor lock-in
- Modern Foundation: Built on MedusaJS, offering a modern
  tech stack that developers love
- Beautiful by Default: Create stunning storefronts without
  sacrificing customization

## Power Any Marketplace Model

- Custom B2B Marketplace: Build enterprise-grade platforms
  with specialized workflows
- Custom B2C Marketplace: Create engaging consumer
  marketplaces with modern UX
- eCommerce Extension: Transform your store into a
  marketplace (coming soon)

![Mercur Use Cases](https://cdn.prod.website-files.com/6790aeffc4b432ccaf1b56e5/67b46aa08180d5b8499c6a15_Use-cases.jpg)
&nbsp;

# Ready-to-go marketplace features

<b>Storefronts for Marketplace </b> <br> Customizable
storefronts designed for B2B and B2C with all elements
including browsing and buying products across multiple
vendors at once.

Discover
<a href="https://github.com/mercurjs/b2c-marketplace-storefront">B2C
Storefront Repository</a> -
<a href="https://b2c.mercurjs.com/">🛍️ Check demo </a>

<b>Admin Panel</b> <br> Control over whole marketplace:
setting product categories, vendors, commissions and rules

<b>Vendor Panel</b> <br> A powerful dashboard giving sellers
complete control over their products, orders, and store
management in one intuitive interface.

Discover
<a href="https://github.com/mercurjs/vendor-panel">Vendor
Panel</a> - <a href="https://www.mercurjs.com/contact">
Contact us to get demo </a>

<b>Integrations</b> <br> Built-in integration with Stripe
for payments and Resend for communication needs. More
integrations coming soon.

![Mercur](https://cdn.prod.website-files.com/6790aeffc4b432ccaf1b56e5/67a1020f202572832c954ead_6b96703adfe74613f85133f83a19b1f0_Fleek%20Tilt%20-%20Readme.png)

&nbsp;

## Quickstart

**Step 1**: Create a new Mercur project and start the development server:

```bash
npx @mercurjs/cli create my-marketplace
```

**Step 2**: Start the development server:

```bash
cd my-marketplace
npm run dev
```

**Step 3**: Access your marketplace:

- Backend API: `http://localhost:9000`
- Admin Panel: `http://localhost:7000`
- Vendor Panel: `http://localhost:7001`

&nbsp;

## Prerequisites

- [Node.js v20+](https://nodejs.org/en/download)
- [PostgreSQL](https://www.postgresql.org/download/)
- [Redis](https://redis.io/download/)
- [Git CLI](https://git-scm.com/downloads)

## Contribution

Mercur is an Open Source project and we encourage everyone to help us making it better. If you are interested in contributing to the project, please read our [Contributing Guide](https://raw.githubusercontent.com/mercurjs/mercur/refs/heads/new/CONTRIBUTING.md) and [Code of Conduct](https://raw.githubusercontent.com/mercurjs/mercur/refs/heads/new/CODE_OF_CONDUCT.md).

If you have any questions about contributing, please join our [Discord server](https://discord.gg/hnZBzc4NJU) - we are happy to help you!

Discovered a 🐜 or have feature suggestion? Feel free to [create an issue](https://github.com/mercurjs/mercur/issues/new/choose) on Github.

# Resources

#### Learn more about Mercur

- [Mercur Website](https://www.mercurjs.com/)
- [Mercur Docs](https://docs.mercurjs.com/introduction)

#### Learn more about Medusa

- [Medusa Website](https://www.medusajs.com/)
- [Medusa Docs](https://docs.medusajs.com/v2)
