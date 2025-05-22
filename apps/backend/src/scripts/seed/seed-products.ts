import { ProductStatus } from '@medusajs/framework/utils'

export const productsToInsert = [
  {
    title: 'Bata Power Canvas Shoes',
    handle: 'bata-power-canvas-shoes',
    subtitle: 'Classic Indian canvas shoes',
    description:
      'Bata Power Canvas Shoes are a staple in Indian footwear, known for their comfort and durability. Perfect for school and daily wear.',
    is_giftcard: false,
    status: ProductStatus.PUBLISHED,
    thumbnail:
      'https://mercur-connect.s3.eu-central-1.amazonaws.com/AIR-FORCE-1-LUXE-UNISEX-1 -01JRYW1QY88H8T98HNPZF7NJTF.png',
    options: [
      {
        title: 'Color',
        values: ['White', 'Black']
      }
    ],
    variants: [
      {
        title: 'White',
        allow_backorder: false,
        manage_inventory: true,
        prices: [
          {
            amount: 499,
            currency_code: 'inr'
          }
        ],
        options: {
          Color: 'White'
        }
      },
      {
        title: 'Black',
        allow_backorder: false,
        manage_inventory: true,
        prices: [
          {
            amount: 499,
            currency_code: 'inr'
          }
        ],
        options: {
          Color: 'Black'
        }
      }
    ],
    discountable: true,
    images: [
      {
        url: 'https://mercur-connect.s3.eu-central-1.amazonaws.com/New-Runner-Flag-1-01JRYW0TG1KQ5T688H810M9BE3.png'
      }
    ]
  },
  {
    title: 'Paragon Flip Flops',
    handle: 'paragon-flip-flops',
    subtitle: 'Affordable and durable',
    description:
      'Paragon Flip Flops are a household name in India, offering affordable and long-lasting slippers for all ages.',
    is_giftcard: false,
    status: ProductStatus.PUBLISHED,
    thumbnail:
      'https://mercur-connect.s3.eu-central-1.amazonaws.com/CLASSIC-CUPSOLE-1 -01JRYVZQBJ85B2MPZ3Q0KTBYGA.png',
    discountable: true,
    variants: [
      {
        title: 'Blue / 8',
        allow_backorder: false,
        manage_inventory: true,
        options: { Color: 'Blue', Size: '8' },
        prices: [
          {
            currency_code: 'inr',
            amount: 199
          }
        ]
      },
      {
        title: 'Black / 9',
        allow_backorder: false,
        manage_inventory: true,
        options: { Color: 'Black', Size: '9' },
        prices: [
          {
            currency_code: 'inr',
            amount: 199
          }
        ]
      }
    ],
    options: [
      {
        title: 'Size',
        values: ['8', '9']
      },
      {
        title: 'Color',
        values: ['Blue', 'Black']
      }
    ],
    images: [
      {
        url: 'https://mercur-connect.s3.eu-central-1.amazonaws.com/CLASSIC-CUPSOLE-1 -01JRYVZQBJ85B2MPZ3Q0KTBYGA.png'
      }
    ]
  },
  {
    title: 'Liberty Warrior Safety Shoes',
    handle: 'liberty-warrior-safety-shoes',
    subtitle: 'Industrial safety shoes',
    description: 'Liberty Warrior Safety Shoes are trusted by Indian workers for their protection and comfort in industrial environments.',
    is_giftcard: false,
    status: ProductStatus.PUBLISHED,
    thumbnail:
      'https://mercur-connect.s3.eu-central-1.amazonaws.com/STORM-96-2K-LITE-1-01JRYVZ58MYDM626NAX1E9ZDDQ.png',
    discountable: true,
    variants: [
      {
        title: 'Black / 10',
        allow_backorder: false,
        manage_inventory: true,
        options: { Color: 'Black', Size: '10' },
        prices: [
          {
            currency_code: 'inr',
            amount: 899
          }
        ]
      }
    ],
    options: [
      {
        title: 'Size',
        values: ['10']
      },
      {
        title: 'Color',
        values: ['Black']
      }
    ],
    images: [
      {
        url: 'https://mercur-connect.s3.eu-central-1.amazonaws.com/Reelwind-1-01JRYVWVF8XVHG23RXMNAY2EFJ.png'
      }
    ]
  },
  {
    title: 'Relaxo Hawaii Slippers',
    handle: 'relaxo-hawaii-slippers',
    subtitle: 'Popular Indian slippers',
    description:
      'Relaxo Hawaii Slippers are known for their comfort and affordability, making them a favorite across India.',
    is_giftcard: false,
    status: ProductStatus.PUBLISHED,
    thumbnail:
      'https://mercur-connect.s3.eu-central-1.amazonaws.com/U9060EEE-1-01JRYVW83SET4B4ZYZVSK39FDF.png',
    discountable: true,
    variants: [
      {
        title: 'Red / 7',
        allow_backorder: false,
        manage_inventory: true,
        options: { Color: 'Red', Size: '7' },
        prices: [
          {
            currency_code: 'inr',
            amount: 149
          }
        ]
      }
    ],
    options: [
      { title: 'Color', values: ['Red'] },
      { title: 'Size', values: ['7'] }
    ],
    images: [
      {
        url: 'https://mercur-connect.s3.eu-central-1.amazonaws.com/U9060EEE-1-01JRYVW83SET4B4ZYZVSK39FDF.png'
      }
    ]
  }
]
