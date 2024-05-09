![Mercur](https://rigby-web.fra1.digitaloceanspaces.com/mercur-readme.png)

<div align="center">
  <h1>Mercur</h1>
  <p>JavaScript Open Source Multi-Vendor Marketplace built on top of Medusa.js.</p>
  
  <!-- Shields.io Badges -->
  <a href="https://your-link-to-license">
    <img alt="License" src="https://img.shields.io/badge/license-MIT-blue.svg" />
  </a>
  <a href="https://your-link-to-pull-requests">
    <img alt="PRs Welcome" src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" />
  </a>
  <a href="https://your-link-to-support">
    <img alt="Support" src="https://img.shields.io/badge/support-contact%20author-blueviolet.svg" />
  </a>
  <a href="https://your-link-to-discord">
    <img alt="Chat on Discord" src="https://img.shields.io/discord/your-discord-server-id.svg?label=chat&logo=discord&color=7289da" />
  </a>

  <!-- Documentation and Website Links -->
  <p>
    <a href="https://link-to-your-documentation">Documentation</a> |
    <a href="https://link-to-your-website">Website</a>
  </p>
</div>
<br>

# Getting started

```bash
npx mercurjs marketplace
```

# What is Mercur?

Mercur is the first JavaScript open-source platform for building multi-vendor marketplaces. Built on top of Medusa.js, it simplifies the development of customized marketplaces.

## Why Mercur?

After seeing the rising trend in multi-vendor business models and setting up several marketplaces from scratch at Rigby, we wanted to eliminate the repetitive setup of marketplaces.

The aim is to enable users to start a new marketplace in about five minutes, providing a strong starting point for anyone looking to build their own multi-vendor platform.

Medusa is an amazing and strong foundation for building marketplaces but requires a few modifications to adjust to this business model. We wanted a faster way to get these platforms up and running — Mercur is that accelerator for building multi-vendor marketplace with Medusa.js as a core.

## Goals

We aim to make Mercur adaptable for various marketplace types, such as rental or service marketplaces. We're also building an ecosystem of plugins tailored to multi-vendor setups, including solutions for payment distributions like Stripe.

Feel free to share your ideas on our Discord, how you imagine the development of this project.

## Project Components:

![Mercur Architecture](https://rigby-web.fra1.digitaloceanspaces.com/mercur-mvm-arch.png)

- **Core:** The backbone of Mercur, handling the primary operations and data flow essential for marketplace functionality.
- **Admin:** Provides a control panel for marketplace administrators to manage vendors, orders, settings, and more.
- **Vendor:** A dedicated interface for vendors to manage their products, orders, and profile details.
- **Storefront:** The frontend where customers browse products, place orders, and interact with the marketplace. It is a customized version of the Medusa.js Next.js Starter.

## Project Features:

- **Vendor Registration:** Allows new vendors to sign up and await approval from marketplace administrators.
- **Vendor Profiles:** Enables vendors to create and customize their profiles on the marketplace.
- **Vendor Authorization by Admin:** Admins can review and authorize vendor registrations to maintain marketplace standards.
- **Role-based Access:** Ensures users have permissions appropriate to their role within the marketplace.
- **Order Splitting:** Facilitates the distribution of orders among multiple vendors involved in a single transaction.
- **Vendor Shipping Management:** Vendors can manage their shipping logistics independently within the platform.
- **Commission Management:** Admins can set up and manage commission rates from vendor sales.

## Getting started 🚀

Create a new Mercur project with just one command:

`npx @mercur generate marketplace`

You will be asked to enter the project's name and select the project’s modules (admin / vendor / storefront) platform you wish to use. Once selected, the CLI will create project files in the directory matching your project name.

## Support Mercur ❤️

Mercur is a community-driven, open-source initiative. We are committed to keeping it free and accessible by releasing it under the MIT License.

### How to contribute:

- **Ideas:** If you have any ideas on how to develop the product further, feel free to share them with us. We're always open to new suggestions!
- **Code:** Help improve our project by contributing code or fixing bugs. We invite you to review our Contributing Guide.
- **Bug:** Encountered a bug? We encourage you to open an issue on our GitHub repository.
- **Spread the Word:** Tell others about our project. Every mention helps!
- **Create Content:** Write a post, make a video, or create a tutorial. We’ll share your work.
- **Join the Community:** Answer questions and provide support on our Discord.

## Useful Links

- [GitHub Issues](https://github.com/medusajs/medusa/issues)
- [Community Discord](https://discord.gg/medusajs)
- [Mercur website](https://medusajs.com/blog/)
- [Mercur docs](https://github.com/medusajs/medusa)
- [Medusa website](https://medusajs.com)
- [Medusa repo](https://github.com/medusajs/medusa/blob/develop/LICENSE)
- [Medusa Docs](https://github.com/medusajs/medusa)

## License

Licensed under the [MIT License](https://github.com/medusajs/medusa/blob/develop/LICENSE).
