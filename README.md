![Mercur](https://cdn.prod.website-files.com/6790aeffc4b432ccaf1b56e5/67a10247c8809ae1ec2387f3_HERO%20README%20-%20MERCUR.png)

<div align="center">
  <h1>Mercur <br> Open Source Marketplace Platform</h1> 
  <!-- Shields.io Badges -->
  <a href="https://github.com/mercurjs/mercur/tree/main?tab=MIT-1-ov-file">
    <img alt="License" src="https://img.shields.io/badge/license-MIT-blue.svg" />
  </a>
  <a href="#">
    <img alt="PRs Welcome" src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" />
  </a>
  <a href="https://rigbyjs.com/#contact">
    <img alt="Support" src="https://img.shields.io/badge/support-contact%20author-blueviolet.svg" />
  </a>
  <!-- Website Links -->
  <p>
    <a href="https://mercurjs.com/">Mercur</a> |   <a href="https://docs.mercurjs.com/">Docs</a>
  </p> 
</div>




# What is Mercur?

Mercur is an open source marketplace platform that allows you to create high-quality experiences for shoppers and vendors while having the most popular Open Source commerce platform [MedusaJS](https://github.com/medusajs/medusa) as a foundation. 

Mercur is a platform to start, customize, manage, and scale your marketplace for every business model with a modern technology stack.

Here is preview how our B2C Marketplace Storefront look like

![Mercur](https://cdn.prod.website-files.com/6790aeffc4b432ccaf1b56e5/67a1020f202572832c954ead_6b96703adfe74613f85133f83a19b1f0_Fleek%20Tilt%20-%20Readme.png)
## Designed to power your marketplace model

-   Custom B2B Marketplace
    
-   Custom B2C Marketplace
    
-   Adding Marketplace to your current eCommerce [coming soon 👀]


## Project Components:

![Mercur Architecture](https://rigby-web.fra1.digitaloceanspaces.com/mercur-mvm-lgg.png)

**B2C and B2B Storefronts** <br>
Customizable storefronts designed for B2B and B2C with all elements including browsing and buying products across multiple vendors at once. 

**Admin Panel** <br>
Control over whole marketplace: setting product categories, vendors, commissions and rules

**Vendor panel** <br>
A powerful dashboard giving sellers complete control over their products, orders, and store management in one intuitive interface.

**Integrations** <br>
Built-in integration with Stripe for payments and Resend for communication needs. More integrations coming soon. 


## Project Features:

- **Vendor Registration:** Allows new vendors to sign up and await approval from marketplace administrators.
- **Vendor Profiles:** Enables vendors to create and customize their profiles on the marketplace.
- **Vendor Authorization by Admin:** Admins can review and authorize vendor registrations to maintain marketplace standards.
- **Order Splitting:** Facilitates the distribution of orders among multiple vendors involved in a single transaction.
- **Vendor Shipping Management:** Vendors can manage their shipping logistics independently within the platform.

## Roadmap:

- Payment provider & Commission Management & Invoices
- Expect big updates in 2025, stay tuned! 


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
3. Build the admin and vendor ui:s; `yarn run build:admin && yarn run build:vendor`

**Environment Configuration**

1. Create a `.env` file in the root of the project.
2. Add the `DATABASE_URL` variable with your PostgreSQL database URL.

**Database and Server Initialization**

1. Seed the database:

```bash
yarn seed
```

2. Start the Medusa development server:

```bash
yarn dev
```

The server will start on http://localhost:9000.

#### Admin panel

1. Navigate to the `/api` folder.
2. Run the `yarn dev` command to start API and admin panel in development mode
3. Log into the admin panel using the credentials created during the seeding process (admin@medusa-test.com with password supersecret).

#### Vendor panel

1. Navigate to the `/api` folder.
2. Run the `yarn dev:vendor` command to start vendor panel in development mode
3. Register vendor by accessing `vendor_url/register` page
4. Approve registered vendor on `Users` page in admin panel
5. Log in using vendor credentials
6. Now you can edit your vendor panel using `/vendor` folder in `src` directory [(See medusa admin quickstart)](https://docs.medusajs.com/admin/quickstart)

#### Storefront Setup

1. Navigate to the `/store-front` folder.
2. Run the `yarn` command to install dependencies.
3. Create an `.env` file in the root of the project folder with the following entries:

```bash
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

1. Make a POST request to the endpoint `api_url/vendor/users` with the body:

```json
{
  "email": "vendoremail@email.com",
  "password": "vendorpassword"
}
```

Replace api_url with your actual API endpoint URL, typically something like http://localhost:9000.

This will create a new vendor user in the system. Before the vendor can log in, the admin must authorize his registration in the administration panel by making his status active.

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

- [Mercur website](https://mercurjs.com)
- [Mercur docs](https://docs.mercurjs.com)

## About Medusa

- [Medusa website](https://medusajs.com)
- [Medusa docs](https://docs.medusajs.com/)
- [Medusa repo](https://github.com/medusajs/medusa)
- [Medusa Community Discord](https://discord.gg/medusajs)

## License

Licensed under the [MIT License](https://github.com/mercurjs/mercur/tree/main?tab=MIT-1-ov-file).
