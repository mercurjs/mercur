![Mercur](https://rigby-web.fra1.digitaloceanspaces.com/README-mercur.png)

<div align="center">
  <h1>Mercur</h1>
  <p>JavaScript Open Source Multi-Vendor Marketplace built on top of Medusa.js.</p>
  
  <!-- Shields.io Badges -->
  <a href="#">
    <img alt="License" src="https://img.shields.io/badge/license-MIT-blue.svg" />
  </a>
  <a href="#">
    <img alt="PRs Welcome" src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" />
  </a>
  <a href="https://rigbyjs.com/en#contact">
    <img alt="Support" src="https://img.shields.io/badge/support-contact%20author-blueviolet.svg" />
  </a>

  <!-- Website Links -->
  <p>
    <a href="https://mercurjs.com/">Mercur</a> |
    <a href="https://medusajs.com/">Medusa</a>
  </p>
</div>
<br>

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

![Mercur Architecture](https://rigby-web.fra1.digitaloceanspaces.com/mercur-mvm-lg.png)

- **Core:** The backbone of Mercur, handling the primary operations and data flow essential for marketplace functionality.
- **Admin:** Provides a control panel for marketplace administrators to manage vendors, orders, settings, and more.
- **Vendor:** A dedicated interface for vendors to manage their products, orders, and profile details.
- **Storefront:** The frontend where customers browse products, place orders, and interact with the marketplace. It is a customized version of the Medusa.js Next.js Starter.

## Project Features:

- **Vendor Registration:** Allows new vendors to sign up and await approval from marketplace administrators.
- **Vendor Profiles:** Enables vendors to create and customize their profiles on the marketplace.
- **Vendor Authorization by Admin:** Admins can review and authorize vendor registrations to maintain marketplace standards.
- **Order Splitting:** Facilitates the distribution of orders among multiple vendors involved in a single transaction.
- **Vendor Shipping Management:** Vendors can manage their shipping logistics independently within the platform.

## Roadmap:
- Payment provider & Commission Management & Invoices
- Adjustments to Medusa 2.0!
- More: coming soon

## Getting started 🚀

Create a new Mercur project with the command:

```bash
npx mercurjs marketplace
```

You will be asked to enter the project's name and select the project’s modules (admin / vendor / storefront) platform you wish to use. Once selected, the CLI will create project files in the directory matching your project name.

## How to configure

#### API Configuration

**Initial Setup**

1. Navigate to the `/api` directory.
2. Execute the `yarn` command to install dependencies.

**Environment Configuration**

1. Create a `.env` file in the root of the project.
2. Add the `DATABASE_URL` variable with your PostgreSQL database URL.

**Database and Server Initialization**

1. Run database migrations with the command:
 ```bash
 medusa migrations run
 ```
2. Seed the database:
 ```bash
 yarn seed
 ```
3. Start the Medusa development server:
 ```bash
yarn develop
 ```

The server will start on http://localhost:9000.

#### Admin and Vendor Panels

In both /admin and /vendor directories:

1. Execute the `yarn` command to install dependencies.

2. Create an .env file in each directory and set:
``` bash
VITE_BACKEND_URL=http://localhost:9000
```

3. Start the panels with `yarn dev`

Admin panel will be accessible at http://localhost:7000.
Vendor panel will be available at http://localhost:7001.

Log into the admin panel using the credentials created during the seeding process (admin@medusa-test.com with password supersecret).

#### Storefront Setup

1. Navigate to the `/store-front` folder.
2. Run the `yarn` command to install dependencies.
3. Create an `.env` file in the root of the project folder with the following entries:

``` bash
NEXT_PUBLIC_MEDUSA_BACKEND_URL=http://localhost:9000
NEXT_PUBLIC_BASE_URL=http://localhost:8000
NEXT_PUBLIC_DEFAULT_REGION=eu
REVALIDATE_SECRET=supersecret
```

4. Start the storefront application:
```bash
yarn dev
```

This will launch the storefront, typically available at http://localhost:8000.

#### Adding a Vendor User

To add a vendor user via the API, follow these steps:

1. Make a POST request to the endpoint `api_url/vendors/users` with the body:
 ```json
 {
   "email": "vendoremail@email.com",
   "password": "vendorpassword"
 }
 ```

Replace api_url with your actual API endpoint URL, typically something like http://localhost:9000.

This will create a new vendor user in the system. Before the vendor can log in, the admin must authorize his registration in the administration panel.


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

- [Medusa Community Discord](https://discord.gg/medusajs)
- [Mercur website](https://mercurjs.com)
- [Medusa website](https://medusajs.com)
- [Medusa docs](https://docs.medusajs.com/)
- [Medusa repo](https://github.com/medusajs/medusa)

## License

Licensed under the MIT License.
