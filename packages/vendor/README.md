# @rigby-software-house/mercurjs-vendor

[Author website](https://rigbyjs.com) | [Admin docs](https://docs.medusajs.com/admin/quickstart)

## Prerequisites

- [Medusa backend](https://docs.medusajs.com/development/backend/install) (>= 1.20.0)

---

## Getting started

Install the package:

```bash
yarn add @rigby-software-house/mercurjs-vendor
```

Add the plugin to your `medusa-config.js`:

```js
module.exports = {
  // ...
  plugins: [
    {
      resolve: "@rigby-software-house/mercurjs-vendor",
      options: {
        // ...
      },
    },
  ],
  // ...
};
```

## Accessing the vendor dashboard

After succesful instalation you can run `medusa-vendor developer` to spin up the vendor dashboard. You can also do so by adding the following script to your `package.json`:

```json
{
  "scripts": {
    "dev:vendor": "medusa-vendor develop"
  }
}
```

## Building the vendor dashboard

You may need to manually trigger a rebuild sometimes, for example after you have upgraded to a newer version of `@rigby-software-house/mercurjs-vendor`, or if you have disabled `autoRebuild`. You can do so by adding the following script to your `package.json`:

```json
{
  "scripts": {
    "build:vendor": "medusa-vendor build"
  }
}
```
