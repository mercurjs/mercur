import { ProductStatus } from '@medusajs/framework/utils'

export const productsToInsert = [
  {
    title: 'AIR FORCE 1 LUXE UNISEX Sneakers',
    handle: 'air-force-1-luxe-unisex-sneakers',
    subtitle: ' foam midsole with Air-Sole unit',
    description:
      'The iconic Air Force 1 with premium materials and enhanced comfort. Features a full-grain leather upper',
    is_giftcard: false,
    status: ProductStatus.PUBLISHED,
    thumbnail:
      'https://mercur-connect.s3.eu-central-1.amazonaws.com/AIR-FORCE-1-LUXE-UNISEX-1 -01JRYW1QY88H8T98HNPZF7NJTF.png',
    options: [
      {
        title: 'Color',
        values: ['White']
      }
    ],
    variants: [
      {
        title: 'White',
        allow_backorder: false,
        manage_inventory: true,
        prices: [
          {
            amount: 99,
            currency_code: 'eur'
          }
        ],
        options: {
          Color: 'White'
        }
      }
    ],
    discountable: true,
    images: [
      {
        url: 'https://mercur-connect.s3.eu-central-1.amazonaws.com/AIR-FORCE-1-LUXE-UNISEX-1 -01JRYW1QY88H8T98HNPZF7NJTF.png'
      },
      {
        url: 'https://mercur-connect.s3.eu-central-1.amazonaws.com/AIR-FORCE-1-LUXE-UNISEX-2 -01JRYW1QY96TV72HCK602R8ASK.png'
      }
    ]
  },
  {
    title: 'New Runner Flag Sneakers',
    handle: 'new-runner-flag',
    subtitle: '',
    description:
      'Heritage-inspired running silhouette featuring distinctive flag details and national color accents. Combines lightweight cushioning, breathable materials, and nostalgic design elements for a unique statement piece with exceptional comfort.',
    is_giftcard: false,
    status: ProductStatus.PUBLISHED,
    thumbnail:
      'https://mercur-connect.s3.eu-central-1.amazonaws.com/New-Runner-Flag-1-01JRYW0TG1KQ5T688H810M9BE3.png',
    discountable: true,
    variants: [
      {
        title: 'Brown / 41 / New',
        allow_backorder: false,
        manage_inventory: true,
        options: { Color: 'Brown', Size: '41', Condition: 'New' },
        variant_rank: 0,
        prices: [
          {
            currency_code: 'eur',
            amount: 59
          }
        ]
      },
      {
        title: 'Brown / 40 / New',
        allow_backorder: false,
        manage_inventory: true,
        options: { Color: 'Brown', Size: '40', Condition: 'New' },
        variant_rank: 1,
        prices: [
          {
            currency_code: 'eur',
            amount: 59
          }
        ]
      },
      {
        title: 'Brown / 39 / New',
        allow_backorder: false,
        manage_inventory: true,
        variant_rank: 2,
        options: { Color: 'Brown', Size: '39', Condition: 'New' },
        prices: [
          {
            currency_code: 'eur',
            amount: 59
          }
        ]
      },
      {
        title: 'Brown / 38 / New',
        allow_backorder: false,
        manage_inventory: true,
        variant_rank: 3,
        options: { Color: 'Brown', Size: '38', Condition: 'New' },
        prices: [
          {
            currency_code: 'eur',
            amount: 59
          }
        ]
      },
      {
        title: 'Brown / 41 / Used',
        allow_backorder: false,
        manage_inventory: true,
        variant_rank: 4,
        options: { Color: 'Brown', Size: '41', Condition: 'Used' },
        prices: [
          {
            currency_code: 'eur',
            amount: 39
          }
        ]
      },
      {
        title: 'Brown / 40 / Used',
        allow_backorder: false,
        manage_inventory: true,
        variant_rank: 5,
        options: { Color: 'Brown', Size: '40', Condition: 'Used' },
        prices: [
          {
            currency_code: 'eur',
            amount: 39
          }
        ]
      },
      {
        title: 'Brown / 39 / Used',
        allow_backorder: false,
        manage_inventory: true,
        variant_rank: 5,
        options: { Color: 'Brown', Size: '39', Condition: 'Used' },
        prices: [
          {
            currency_code: 'eur',
            amount: 39
          }
        ]
      },
      {
        title: 'Brown / 38 / Used',
        allow_backorder: false,
        manage_inventory: true,
        variant_rank: 5,
        options: { Color: 'Brown', Size: '38', Condition: 'Used' },
        prices: [
          {
            currency_code: 'eur',
            amount: 39
          }
        ]
      }
    ],
    options: [
      {
        title: 'Size',
        values: ['38', '39', '40', '41']
      },
      {
        title: 'Color',
        values: ['Brown']
      },
      {
        title: 'Condition',
        values: ['New', 'Used']
      }
    ],
    images: [
      {
        url: 'https://mercur-connect.s3.eu-central-1.amazonaws.com/New-Runner-Flag-1-01JRYW0TG1KQ5T688H810M9BE3.png'
      }
    ]
  },
  {
    title: 'CLASSIC CUPSOLE Sneakers',
    handle: 'classic-cupsole-sneakers',
    subtitle: '',
    description: 'Retro court style reimagined for today',
    is_giftcard: false,
    status: ProductStatus.PUBLISHED,
    thumbnail:
      'https://mercur-connect.s3.eu-central-1.amazonaws.com/CLASSIC-CUPSOLE-1 -01JRYVZQBJ85B2MPZ3Q0KTBYGA.png',
    discountable: true,
    variants: [
      {
        title: 'White / Used / 41',
        allow_backorder: false,
        manage_inventory: true,
        variant_rank: 0,
        options: {
          Color: 'White',
          Size: '41',
          Condition: 'Used'
        },
        prices: [
          {
            currency_code: 'eur',
            amount: 59
          }
        ]
      },
      {
        title: 'Black / Used / 41',
        allow_backorder: false,
        manage_inventory: true,
        variant_rank: 1,
        options: {
          Color: 'Black',
          Size: '41',
          Condition: 'Used'
        },
        prices: [
          {
            currency_code: 'eur',
            amount: 69
          }
        ]
      }
    ],
    options: [
      {
        title: 'Size',
        values: ['40', '41']
      },
      {
        title: 'Color',
        values: ['White', 'Black']
      },
      {
        title: 'Condition',
        values: ['New', 'Used']
      }
    ],
    images: [
      {
        url: 'https://mercur-connect.s3.eu-central-1.amazonaws.com/CLASSIC-CUPSOLE-1 -01JRYVZQBJ85B2MPZ3Q0KTBYGA.png'
      }
    ]
  },
  {
    title: 'STORM 96 2K LITE Sneakers',
    handle: 'storm-96-2k-lite',
    subtitle: '',
    description:
      "Retro-futuristic design combining '90s athletic aesthetics with contemporary technology. Features sculpted, lightweight midsole, mixed material upper, and unique lacing system for stand-out street style with all-day wearability.",
    is_giftcard: false,
    status: ProductStatus.PUBLISHED,
    thumbnail:
      'https://mercur-connect.s3.eu-central-1.amazonaws.com/STORM-96-2K-LITE-1-01JRYVZ58MYDM626NAX1E9ZDDQ.png',
    discountable: true,
    variants: [
      {
        title: 'Black / 42',
        allow_backorder: false,
        manage_inventory: true,
        variant_rank: 0,
        options: {
          Color: 'Black',
          Size: '42'
        },
        prices: [
          {
            currency_code: 'eur',
            amount: 79
          }
        ]
      },
      {
        title: 'Black / 41',
        allow_backorder: false,
        manage_inventory: true,
        variant_rank: 1,
        options: {
          Color: 'Black',
          Size: '41'
        },
        prices: [
          {
            currency_code: 'eur',
            amount: 79
          }
        ]
      }
    ],
    options: [
      { title: 'Size', values: ['41', '42'] },
      { title: 'Color', values: ['Black'] }
    ],
    images: [
      {
        url: 'https://mercur-connect.s3.eu-central-1.amazonaws.com/STORM-96-2K-LITE-1-01JRYVZ58MYDM626NAX1E9ZDDQ.png'
      }
    ]
  },
  {
    title: 'U574 UNISEX Sneakers',
    handle: 'u574-unisex-sneakers',
    subtitle: '',
    description:
      'Featuring the classic 574 silhouette with updated materials and cushioning. Includes ENCAP midsole technology for support and maximum durability, plus a suede/mesh upper for breathability and style.',
    is_giftcard: false,
    status: ProductStatus.PUBLISHED,
    thumbnail:
      'https://mercur-connect.s3.eu-central-1.amazonaws.com/U574-UNISEX-1-01JRYVYJVR8ZWQF87V8NS2HHX9.png',
    discountable: true,
    variants: [
      {
        title: '37 / Orange / New',
        allow_backorder: false,
        manage_inventory: true,
        variant_rank: 0,
        options: {
          Color: 'Orange',
          Size: '37',
          Condition: 'New'
        },
        prices: [
          {
            currency_code: 'eur',
            amount: 87
          }
        ]
      }
    ],
    options: [
      { title: 'Color', values: ['Orange'] },
      { title: 'Size', values: ['37'] },
      { title: 'Condition', values: ['Used', 'New'] }
    ],
    images: [
      {
        url: 'https://mercur-connect.s3.eu-central-1.amazonaws.com/U574-UNISEX-1-01JRYVYJVR8ZWQF87V8NS2HHX9.png'
      },
      {
        url: 'https://mercur-connect.s3.eu-central-1.amazonaws.com/U574-UNISEX-2-01JRYVYJVTX6NRM2CCEPR6T994.png'
      }
    ]
  },
  {
    title: 'Air VaporMax 2023 Flyknit Triple Black Sneakers',
    handle: 'air-vapormax-2023-flyknit-triple-black-sneakers',
    subtitle: '',
    description:
      'Revolutionary cushioning with VaporMax Air technology and lightweight Flyknit construction. The unique sole eliminates excess weight, while the sleek triple black colorway offers versatile styling options.',
    is_giftcard: false,
    status: ProductStatus.PUBLISHED,
    thumbnail:
      'https://mercur-connect.s3.eu-central-1.amazonaws.com/Air-VaporMax-2023-Flyknit-Triple-Black-1 -01JRYVXVMV7D60YFGHGCY7FD1K.png',
    discountable: true,
    variants: [
      {
        title: 'Black / 41 / New',
        allow_backorder: false,
        manage_inventory: true,
        variant_rank: 0,
        options: { Color: 'Black', Size: '41', Condition: 'New' },
        prices: [
          {
            currency_code: 'eur',
            amount: 99
          }
        ]
      }
    ],
    options: [
      { title: 'Color', values: ['Black'] },
      { title: 'Size', values: ['41'] },
      { title: 'Condition', values: ['Used', 'New'] }
    ],
    images: [
      {
        url: 'https://mercur-connect.s3.eu-central-1.amazonaws.com/Air-VaporMax-2023-Flyknit-Triple-Black-1 -01JRYVXVMV7D60YFGHGCY7FD1K.png'
      },
      {
        url: 'https://mercur-connect.s3.eu-central-1.amazonaws.com/Air-VaporMax-2023-Flyknit-Triple-Black-2 -01JRYVXVMZS1REFQNM6WKJWDPG.png'
      }
    ]
  },
  {
    title: 'Reelwind Sneakers',
    handle: 'reelwind-sneakers',
    subtitle: '',
    description:
      'Performance-meets-lifestyle design with responsive cushioning and flexible support. Made with recycled materials, featuring a breathable upper and durable rubber outsole for all-day comfort.',
    is_giftcard: false,
    status: ProductStatus.PUBLISHED,
    thumbnail:
      'https://mercur-connect.s3.eu-central-1.amazonaws.com/Reelwind-1-01JRYVWVF8XVHG23RXMNAY2EFJ.png',
    discountable: true,
    variants: [
      {
        title: 'Red / 38',
        allow_backorder: false,
        manage_inventory: true,
        variant_rank: 0,
        options: { Color: 'Red', Size: '38' },
        prices: [
          {
            currency_code: 'eur',
            amount: 59
          }
        ]
      }
    ],
    options: [
      {
        title: 'Size',
        values: ['38']
      },
      {
        title: 'Color',
        values: ['Red']
      }
    ],
    images: [
      {
        url: 'https://mercur-connect.s3.eu-central-1.amazonaws.com/Reelwind-1-01JRYVWVF8XVHG23RXMNAY2EFJ.png'
      }
    ]
  },
  {
    title: 'Cool Balance U9060EEE Sneakers',
    handle: 'u9060eee',
    subtitle: '',
    description:
      'Modern interpretation of the classic running silhouette with exaggerated proportions and enhanced cushioning. Features a combination of premium suede and mesh with an angular, sculptural midsole design for contemporary street style.',
    is_giftcard: false,
    status: ProductStatus.PUBLISHED,
    thumbnail:
      'https://mercur-connect.s3.eu-central-1.amazonaws.com/U9060EEE-1-01JRYVW83SET4B4ZYZVSK39FDF.png',
    discountable: true,
    variants: [
      {
        title: 'Gray / Used',
        allow_backorder: false,
        manage_inventory: true,
        variant_rank: 1,
        options: {
          Color: 'Gray',
          Condition: 'Used'
        },
        prices: [
          {
            currency_code: 'eur',
            amount: 39
          }
        ]
      },
      {
        title: 'Gray / New',
        allow_backorder: false,
        manage_inventory: true,
        variant_rank: 0,
        options: { Color: 'Gray', Condition: 'New' },
        prices: [
          {
            currency_code: 'eur',
            amount: 79
          }
        ]
      }
    ],
    options: [
      {
        title: 'Condition',
        values: ['New', 'Used']
      },
      {
        title: 'Color',
        values: ['Gray']
      }
    ],
    images: [
      {
        url: 'https://mercur-connect.s3.eu-central-1.amazonaws.com/U9060EEE-1-01JRYVW83SET4B4ZYZVSK39FDF.png'
      }
    ]
  },
  {
    title: 'Brown Sneakers',
    handle: 'brown-sneakers',
    subtitle: 'Cosy',
    description:
      'Classic brown sneakers with leather and suede upper, and a durable rubber sole. Timeless and versatile.',
    is_giftcard: false,
    status: ProductStatus.PUBLISHED,
    thumbnail:
      'https://mercur-connect.s3.eu-central-1.amazonaws.com/u2735941527_Product_photography_of_brown_Adidas_samba_Sneaker_80c8f007-dcfa-4e5b-b8ac-bf88851a7376_0-01JRWZZ5V9M2ZC0K0WSC96E4AZ.png',
    discountable: true,
    variants: [
      {
        title: 'Brown / New',
        allow_backorder: false,
        manage_inventory: true,
        variant_rank: 0,
        options: {
          Color: 'Brown',
          Condition: 'New'
        },
        prices: [
          {
            currency_code: 'eur',
            amount: 89
          }
        ]
      }
    ],
    options: [
      { title: 'Color', values: ['Brown'] },
      { title: 'Condition', values: ['New'] }
    ],
    images: [
      {
        url: 'https://mercur-connect.s3.eu-central-1.amazonaws.com/u2735941527_Product_photography_of_brown_Adidas_samba_Sneaker_80c8f007-dcfa-4e5b-b8ac-bf88851a7376_0-01JRWZZ5V9M2ZC0K0WSC96E4AZ.png'
      }
    ]
  },
  {
    title: 'Green high-tops',
    handle: 'green-high-tops',
    subtitle: '',
    description:
      'Bold green high-tops with classic canvas upper and rubber sole. A timeless streetwear staple.',
    is_giftcard: false,
    status: ProductStatus.PUBLISHED,
    thumbnail:
      'https://mercur-connect.s3.eu-central-1.amazonaws.com/u2735941527_Product_photography_of_green_converse_Sneakers_no_1ef027ea-f31f-4996-b419-63f85716a277_1-01JRWZYCWYAD4QVMRRTFVWHHDK.png',
    discountable: true,
    variants: [
      {
        title: 'Green / 40 / New',
        allow_backorder: false,
        manage_inventory: true,
        variant_rank: 0,
        options: { Color: 'Green', Size: '40', Condition: 'New' },
        prices: [
          {
            currency_code: 'eur',
            amount: 99
          }
        ]
      }
    ],
    options: [
      { title: 'Color', values: ['Green'] },
      { title: 'Size', values: ['40'] },
      { title: 'Condition', values: ['Used', 'New'] }
    ],
    images: [
      {
        url: 'https://mercur-connect.s3.eu-central-1.amazonaws.com/u2735941527_Product_photography_of_green_converse_Sneakers_no_1ef027ea-f31f-4996-b419-63f85716a277_1-01JRWZYCWYAD4QVMRRTFVWHHDK.png'
      }
    ]
  },
  {
    title: 'High Sneakers',
    handle: 'high-sneakers',
    subtitle: 'Purple, beige, and orange',
    description:
      'High Sneakers in a bold mix of purple, beige, and orange. Premium materials, iconic silhouette, and standout color blocking.',
    is_giftcard: false,
    status: ProductStatus.PUBLISHED,
    thumbnail: 'https://i.imgur.com/zIcEOTS.png',
    discountable: true,
    variants: [
      {
        title: 'High Sneakers',
        allow_backorder: false,
        manage_inventory: true,
        variant_rank: 0,
        options: { Color: 'Purple' },
        prices: [
          {
            currency_code: 'eur',
            amount: 119
          }
        ]
      }
    ],
    options: [
      {
        title: 'Color',
        values: ['Purple']
      }
    ],
    images: [
      {
        url: 'https://i.imgur.com/zIcEOTS.png'
      }
    ]
  }
]
