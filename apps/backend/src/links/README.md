# Module Links

A module link forms an association between two data models of different modules, while maintaining module isolation.

For example:

```ts
import { defineLink } from '@medusajs/framework/utils'
import ProductModule from '@medusajs/medusa/product'

import HelloModule from '../modules/hello'

export default defineLink(
  ProductModule.linkable.product,
  HelloModule.linkable.myCustom
)
```

This defines a link between the Product Module's `product` data model and the Hello Module (custom module)'s `myCustom` data model.

Learn more about links in [this documentation](https://docs.medusajs.com/v2/advanced-development/modules/module-links)
