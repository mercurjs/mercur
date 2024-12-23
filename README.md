<h1 align="center">
  Mercur
</h1>

<h4 align="center">
  <a href="https://docs.mercurjs.com">Documentation</a> |
  <a href="https://www.mercurjs.com">Website</a>
</h4>

<p align="center">
  Marketplace solution built on top of <a href="https://medusajs.com/" target="_blank">Medusa 2.0</a>
</p>

## Table

- [Prerequisites](#prerequisites)
- [Features](#features)
- [Quickstart](#quickstart)
- [Resources](#resources)

## Prerequisites

- Node.js v20+
- PostgreSQL
- Git CLI

&nbsp;

## Features

- **Product management**. Sellers can manage their products and variants.
- **Order management**. Sellers can manage their orders.
- **Stock location and inventory managment**. Sellers can create stock locations and manage their inventory.
- **Team management**. Sellers can invite and manage their team members.
- **Fulfillment management**. Sellers can manage their fulfillments, shipping options and delivery types.
- **Order spliting**. Orders are splitted into multiple orders by sellers in the cart.
- **OpenAPI support**. Mercur API endpoints are available via OpenAPI.
- **Payouts**. Automated payouts to sellers.
- **Stripe Connect Integration**. Integration with Stripe Connect for payment and payout processing.

&nbsp;

## Quickstart

#### Setup Medusa project

```bash
# Clone the repository
git clone https://github.com/mercurjs/mercur.git

# Install dependencies
yarn install

# Go to backend folder
cd apps/backend

# Clone .env.template
cp .env.template .env

# Setup database and run migrations
yarn medusa db:create && yarn medusa db:migrate && yarn run seed

# Generate OpenAPI client
yarn codegen

# Go to root folder
cd ../..

# Start Mercur
yarn dev
```

&nbsp;

# Resources

#### Learn more about Mercur

- [Website](https://www.mercurjs.com/)
- [Docs](https://rigby-3d34c1f9.mintlify.app/introduction)

#### Learn more about Medusa

- [Website](https://www.medusajs.com/)
- [Docs](https://docs.medusajs.com/v2)
