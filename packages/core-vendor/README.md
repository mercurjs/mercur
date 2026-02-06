![B2C Storefront Cover](https://cdn.prod.website-files.com/6790aeffc4b432ccaf1b56e5/683051d0fd663550f5233ecb_ca2d007b9ac4c0d8c2f6afef398711bf_Readme-Vendor-Panel.png)

<div align="center">
  <h1> Vendor Panel
    <br> 
for <a href="https://github.com/mercurjs/mercur">Mercur</a> - Open Source Marketplace Platform  </h1>
  <!-- Shields.io Badges -->
  <a href="https://github.com/mercurjs/mercur/tree/main?tab=MIT-1-ov-file">
    <img alt="License" src="https://img.shields.io/badge/license-MIT-blue.svg" />
  </a>
  <a href="#">
    <img alt="PRs Welcome" src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" />
  </a>
  <a href="https://mercurjs.com/contact">
    <img alt="Support" src="https://img.shields.io/badge/support-contact%20author-blueviolet.svg" />
  </a>
  <!-- Website Links -->
  <p>
  <a href="https://vendor.mercurjs.com/">🛍️ Vendor Panel Demo </a> · <a href="https://mercurjs.com/">Mercur Website</a> · <a href="https://docs.mercurjs.com/">📃 Explore the docs</a> 
  </p> 
</div>

## Vendor Panel for Mercur

The Vendor Panel is a pivotal component of the MercurJS ecosystem, designed to provide vendors with an intuitive interface to oversee their marketplace activities. 

- Product Management: Add, edit, and organize products with ease.
- Order Tracking: Monitor order statuses and manage fulfillment processes.
- Store Customization: Update vendor store details
- Review Handling: Engage with customer feedback to improve service quality.
- Analytics Dashboard: Gain insights into sales performance and customer behavior. 

### Vendor Panel - Product Management View
![Vendor Store - Frontend View](https://cdn.prod.website-files.com/6790aeffc4b432ccaf1b56e5/68304fb2466a73f093aa5965_Adding%20Products%20_%20Mercur.png)

### Vendor Store - Frontend View
![Vendor Store - Frontend View](https://cdn.prod.website-files.com/6790aeffc4b432ccaf1b56e5/68304b8674abb6fff86a2dbf_Cart%20and%20Vendor%20Page%20_%20Mercur%20B2C%20Storefront.png)


# Part of Mercur

<a href="https://github.com/mercurjs/mercur">Mercur</a> is an open source marketplace platform that allows you to create high-quality experiences for shoppers and vendors while having the most popular Open Source commerce platform MedusaJS as a foundation.

Mercur is a platform to start, customize, manage, and scale your marketplace for every business model with a modern technology stack.

![Mercur](https://cdn.prod.website-files.com/6790aeffc4b432ccaf1b56e5/67a1020f202572832c954ead_6b96703adfe74613f85133f83a19b1f0_Fleek%20Tilt%20-%20Readme.png)


# Quickstart

## Installation

Clone the repository

```js
git clone https://github.com/mercurjs/vendor-panel.git
```

&nbsp;

Go to directory

```js
cd vendor-panel
```

&nbsp;

Install dependencies

```js
yarn install
```

&nbsp;

Make a .env.local file and copy the code below

```js
VITE_MEDUSA_BASE='/'
VITE_MEDUSA_STOREFRONT_URL=http://localhost:3000
VITE_MEDUSA_BACKEND_URL=http://localhost:9000
VITE_TALK_JS_APP_ID=<talkjs public key here>
VITE_DISABLE_SELLERS_REGISTRATION=false
```

&nbsp;

Start storefront

```js
npm run dev
```

&nbsp;

## Guides

<a href="https://talkjs.com/docs/Reference/Concepts/Sessions/" target="_blank">How
to get TalkJs App ID</a>
