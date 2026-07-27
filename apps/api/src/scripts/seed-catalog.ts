// Demo catalog with fictional brands and generic product names. Titles, brands,
// and colorways are invented for a trademark-safe marketplace demo — they do not
// reference any real brand or protected product design. Product images are generic
// AI-generated renders hosted from /static via the jsDelivr GitHub CDN (main branch).

export type SeedCatalogItem = {
  title: string
  brand: string
  colorway: string
  category: "Sandals" | "Sneakers" | "Boots" | "Sport" | "Accessories"
  price: number
  footwear: boolean
  description: string
  images: string[]
}

export const seedCatalog: SeedCatalogItem[] = [
  {
    "title": "Meridian Twin-Strap Buckle Sandal",
    "brand": "Meridian",
    "colorway": "Black - Regular/Wide",
    "price": 155,
    "images": [
      "https://cdn.jsdelivr.net/gh/mercurjs/mercur@main/static/meridian-twin-strap-buckle-sandal-1.png"
    ],
    "category": "Sandals",
    "footwear": true,
    "description": "Meridian Twin-Strap Buckle Sandal in Black - Regular/Wide."
  },
  {
    "title": "Meridian Twin-Strap Sandal",
    "brand": "Meridian",
    "colorway": "Pearl White - Narrow",
    "price": 125,
    "images": [
      "https://cdn.jsdelivr.net/gh/mercurjs/mercur@main/static/meridian-twin-strap-sandal-1.png"
    ],
    "category": "Sandals",
    "footwear": true,
    "description": "Meridian Twin-Strap Sandal in Pearl White - Narrow."
  },
  {
    "title": "Meridian Clog Slide",
    "brand": "Meridian",
    "colorway": "Anthracite",
    "price": 232,
    "images": [
      "https://cdn.jsdelivr.net/gh/mercurjs/mercur@main/static/meridian-clog-slide-1.png"
    ],
    "category": "Sandals",
    "footwear": true,
    "description": "Meridian Clog Slide in Anthracite."
  },
  {
    "title": "Cloudpeak Golden Slide",
    "brand": "Cloudpeak",
    "colorway": "Dark Sand",
    "price": 72,
    "images": [
      "https://cdn.jsdelivr.net/gh/mercurjs/mercur@main/static/cloudpeak-golden-slide-1.png"
    ],
    "category": "Sandals",
    "footwear": true,
    "description": "Cloudpeak Golden Slide in Dark Sand."
  },
  {
    "title": "Meridian Wire Buckle Clog",
    "brand": "Meridian",
    "colorway": "Vintage Wood Roast",
    "price": 226,
    "images": [
      "https://cdn.jsdelivr.net/gh/mercurjs/mercur@main/static/meridian-wire-buckle-clog-1.png"
    ],
    "category": "Sandals",
    "footwear": true,
    "description": "Meridian Wire Buckle Clog in Vintage Wood Roast."
  },
  {
    "title": "Cloudpeak Golden Sandal",
    "brand": "Cloudpeak",
    "colorway": "Bay Fog",
    "price": 78,
    "images": [
      "https://cdn.jsdelivr.net/gh/mercurjs/mercur@main/static/cloudpeak-golden-sandal-1.png"
    ],
    "category": "Sandals",
    "footwear": true,
    "description": "Cloudpeak Golden Sandal in Bay Fog."
  },
  {
    "title": "Apex Pool Slides",
    "brand": "Apex",
    "colorway": "Black",
    "price": 47,
    "images": [
      "https://cdn.jsdelivr.net/gh/mercurjs/mercur@main/static/apex-pool-slides-1.png",
      "https://cdn.jsdelivr.net/gh/mercurjs/mercur@main/static/apex-pool-slides-2.png",
      "https://cdn.jsdelivr.net/gh/mercurjs/mercur@main/static/apex-pool-slides-3.png"
    ],
    "category": "Sandals",
    "footwear": true,
    "description": "Apex Pool Slides in Black."
  },
  {
    "title": "Strive Mule Slides",
    "brand": "Strive",
    "colorway": "Core Black Gum",
    "price": 106,
    "images": [
      "https://cdn.jsdelivr.net/gh/mercurjs/mercur@main/static/strive-mule-slides-1.png"
    ],
    "category": "Sandals",
    "footwear": true,
    "description": "Strive Mule Slides in Core Black Gum."
  },
  {
    "title": "Nimbus Classic Clog",
    "brand": "Nimbus",
    "colorway": "Pond",
    "price": 60,
    "images": [
      "https://cdn.jsdelivr.net/gh/mercurjs/mercur@main/static/nimbus-classic-clog-1.png"
    ],
    "category": "Sandals",
    "footwear": true,
    "description": "Nimbus Classic Clog in Pond."
  },
  {
    "title": "Cloudpeak Starlet Sandal",
    "brand": "Cloudpeak",
    "colorway": "Sand",
    "price": 83,
    "images": [
      "https://cdn.jsdelivr.net/gh/mercurjs/mercur@main/static/cloudpeak-starlet-sandal-1.png"
    ],
    "category": "Sandals",
    "footwear": true,
    "description": "Cloudpeak Starlet Sandal in Sand."
  },
  {
    "title": "Cityline Canvas High Top",
    "brand": "Cityline",
    "colorway": "Black Denim",
    "price": 82,
    "images": [
      "https://cdn.jsdelivr.net/gh/mercurjs/mercur@main/static/cityline-canvas-high-top-1.png"
    ],
    "category": "Sneakers",
    "footwear": true,
    "description": "Cityline Canvas High Top in Black Denim."
  },
  {
    "title": "Vantage 204 Runner",
    "brand": "Vantage",
    "colorway": "Beige Brown",
    "price": 95,
    "images": [
      "https://cdn.jsdelivr.net/gh/mercurjs/mercur@main/static/vantage-204-runner-1.png"
    ],
    "category": "Sneakers",
    "footwear": true,
    "description": "Vantage 204 Runner in Beige Brown."
  },
  {
    "title": "Halcyon Sherpa Runner",
    "brand": "Halcyon",
    "colorway": "Cream",
    "price": 279,
    "images": [
      "https://cdn.jsdelivr.net/gh/mercurjs/mercur@main/static/halcyon-sherpa-runner-1.png"
    ],
    "category": "Sneakers",
    "footwear": true,
    "description": "Halcyon Sherpa Runner in Cream."
  },
  {
    "title": "Strive Rivalry Low",
    "brand": "Strive",
    "colorway": "Ember Red",
    "price": 119,
    "images": [
      "https://cdn.jsdelivr.net/gh/mercurjs/mercur@main/static/strive-rivalry-low-1.png"
    ],
    "category": "Sneakers",
    "footwear": true,
    "description": "Strive Rivalry Low in Ember Red."
  },
  {
    "title": "Comet Star Icon",
    "brand": "Comet",
    "colorway": "Olive Drab Camo",
    "price": 367,
    "images": [
      "https://cdn.jsdelivr.net/gh/mercurjs/mercur@main/static/comet-star-icon-1.png"
    ],
    "category": "Sneakers",
    "footwear": true,
    "description": "Comet Star Icon in Olive Drab Camo."
  },
  {
    "title": "Comet Star",
    "brand": "Comet",
    "colorway": "Brown Black",
    "price": 367,
    "images": [
      "https://cdn.jsdelivr.net/gh/mercurjs/mercur@main/static/comet-star-1.png"
    ],
    "category": "Sneakers",
    "footwear": true,
    "description": "Comet Star in Brown Black."
  },
  {
    "title": "Comet Star Icon Low",
    "brand": "Comet",
    "colorway": "Green",
    "price": 367,
    "images": [
      "https://cdn.jsdelivr.net/gh/mercurjs/mercur@main/static/comet-star-icon-low-1.png"
    ],
    "category": "Sneakers",
    "footwear": true,
    "description": "Comet Star Icon Low in Green."
  },
  {
    "title": "Cloudpeak Disc Slipper",
    "brand": "Cloudpeak",
    "colorway": "Sand",
    "price": 113,
    "images": [
      "https://cdn.jsdelivr.net/gh/mercurjs/mercur@main/static/cloudpeak-disc-slipper-1.png"
    ],
    "category": "Sneakers",
    "footwear": true,
    "description": "Cloudpeak Disc Slipper in Sand."
  },
  {
    "title": "Vector Twilight Pump",
    "brand": "Vector",
    "colorway": "Neon Green",
    "price": 148,
    "images": [
      "https://cdn.jsdelivr.net/gh/mercurjs/mercur@main/static/vector-twilight-pump-1.png",
      "https://cdn.jsdelivr.net/gh/mercurjs/mercur@main/static/vector-twilight-pump-2.png",
      "https://cdn.jsdelivr.net/gh/mercurjs/mercur@main/static/vector-twilight-pump-3.png"
    ],
    "category": "Sneakers",
    "footwear": true,
    "description": "Vector Twilight Pump in Neon Green."
  },
  {
    "title": "Velocity Trail 1000 Runner",
    "brand": "Velocity",
    "colorway": "Light Blue Sapphire",
    "price": 131,
    "images": [
      "https://cdn.jsdelivr.net/gh/mercurjs/mercur@main/static/velocity-trail-1000-runner-1.png"
    ],
    "category": "Sneakers",
    "footwear": true,
    "description": "Velocity Trail 1000 Runner in Light Blue Sapphire."
  },
  {
    "title": "Strive Pro Mid-Cut Firm Ground Cleats",
    "brand": "Strive",
    "colorway": "Aurora Blue Solar Yellow",
    "price": 250,
    "images": [
      "https://cdn.jsdelivr.net/gh/mercurjs/mercur@main/static/strive-pro-mid-cut-firm-ground-cleats-1.png"
    ],
    "category": "Boots",
    "footwear": true,
    "description": "Strive Pro Mid-Cut Firm Ground Cleats in Aurora Blue Solar Yellow."
  },
  {
    "title": "Cloudpeak Classic Mini Boot",
    "brand": "Cloudpeak",
    "colorway": "Black",
    "price": 155,
    "images": [
      "https://cdn.jsdelivr.net/gh/mercurjs/mercur@main/static/cloudpeak-classic-mini-boot-1.png"
    ],
    "category": "Boots",
    "footwear": true,
    "description": "Cloudpeak Classic Mini Boot in Black."
  },
  {
    "title": "Cloudpeak Ultra Mini Boot",
    "brand": "Cloudpeak",
    "colorway": "Hickory",
    "price": 160,
    "images": [
      "https://cdn.jsdelivr.net/gh/mercurjs/mercur@main/static/cloudpeak-ultra-mini-boot-1.png"
    ],
    "category": "Boots",
    "footwear": true,
    "description": "Cloudpeak Ultra Mini Boot in Hickory."
  },
  {
    "title": "Cloudpeak Chukka II Boot",
    "brand": "Cloudpeak",
    "colorway": "Dusted Cocoa",
    "price": 149,
    "images": [
      "https://cdn.jsdelivr.net/gh/mercurjs/mercur@main/static/cloudpeak-chukka-ii-boot-1.png"
    ],
    "category": "Boots",
    "footwear": true,
    "description": "Cloudpeak Chukka II Boot in Dusted Cocoa."
  },
  {
    "title": "Cloudpeak Bow Boots",
    "brand": "Cloudpeak",
    "colorway": "Anemone",
    "price": 132,
    "images": [
      "https://cdn.jsdelivr.net/gh/mercurjs/mercur@main/static/cloudpeak-bow-boots-1.png"
    ],
    "category": "Boots",
    "footwear": true,
    "description": "Cloudpeak Bow Boots in Anemone."
  },
  {
    "title": "Tundra Tall Waterproof Boots",
    "brand": "Tundra",
    "colorway": "Quarry",
    "price": 169,
    "images": [
      "https://cdn.jsdelivr.net/gh/mercurjs/mercur@main/static/tundra-tall-waterproof-boots-1.png"
    ],
    "category": "Boots",
    "footwear": true,
    "description": "Tundra Tall Waterproof Boots in Quarry."
  },
  {
    "title": "Cloudpeak Button Boots",
    "brand": "Cloudpeak",
    "colorway": "Chocolate Brown",
    "price": 97,
    "images": [
      "https://cdn.jsdelivr.net/gh/mercurjs/mercur@main/static/cloudpeak-button-boots-1.png"
    ],
    "category": "Boots",
    "footwear": true,
    "description": "Cloudpeak Button Boots in Chocolate Brown."
  },
  {
    "title": "Redwood Heritage Boot",
    "brand": "Redwood",
    "colorway": "Wheat Nubuck",
    "price": 155,
    "images": [
      "https://cdn.jsdelivr.net/gh/mercurjs/mercur@main/static/redwood-heritage-boot-1.png",
      "https://cdn.jsdelivr.net/gh/mercurjs/mercur@main/static/redwood-heritage-boot-2.png",
      "https://cdn.jsdelivr.net/gh/mercurjs/mercur@main/static/redwood-heritage-boot-3.png"
    ],
    "category": "Boots",
    "footwear": true,
    "description": "Redwood Heritage Boot in Wheat Nubuck."
  },
  {
    "title": "Harlow Moccasin Boot",
    "brand": "Harlow",
    "colorway": "Grey",
    "price": 167,
    "images": [
      "https://cdn.jsdelivr.net/gh/mercurjs/mercur@main/static/harlow-moccasin-boot-1.png"
    ],
    "category": "Boots",
    "footwear": true,
    "description": "Harlow Moccasin Boot in Grey."
  },
  {
    "title": "Cloudpeak Summit Mid Boots",
    "brand": "Cloudpeak",
    "colorway": "Chestnut Black Waterproof",
    "price": 273,
    "images": [
      "https://cdn.jsdelivr.net/gh/mercurjs/mercur@main/static/cloudpeak-summit-mid-boots-1.png"
    ],
    "category": "Boots",
    "footwear": true,
    "description": "Cloudpeak Summit Mid Boots in Chestnut Black Waterproof."
  },
  {
    "title": "Strive Pro FG Cleats",
    "brand": "Strive",
    "colorway": "Aurora Black Platinum",
    "price": 131,
    "images": [
      "https://cdn.jsdelivr.net/gh/mercurjs/mercur@main/static/strive-pro-fg-cleats-1.png"
    ],
    "category": "Sport",
    "footwear": true,
    "description": "Strive Pro FG Cleats in Aurora Black Platinum."
  },
  {
    "title": "Strive Talon Pro FG Cleats",
    "brand": "Strive",
    "colorway": "Midnight Navy",
    "price": 155,
    "images": [
      "https://cdn.jsdelivr.net/gh/mercurjs/mercur@main/static/strive-talon-pro-fg-cleats-1.png"
    ],
    "category": "Sport",
    "footwear": true,
    "description": "Strive Talon Pro FG Cleats in Midnight Navy."
  },
  {
    "title": "Strive Taekwondo Trainers",
    "brand": "Strive",
    "colorway": "Silver Lilac",
    "price": 119,
    "images": [
      "https://cdn.jsdelivr.net/gh/mercurjs/mercur@main/static/strive-taekwondo-trainers-1.png"
    ],
    "category": "Sport",
    "footwear": true,
    "description": "Strive Taekwondo Trainers in Silver Lilac."
  },
  {
    "title": "Strive Talon League FG Cleats",
    "brand": "Strive",
    "colorway": "Blue Pink",
    "price": 108,
    "images": [
      "https://cdn.jsdelivr.net/gh/mercurjs/mercur@main/static/strive-talon-league-fg-cleats-1.png"
    ],
    "category": "Sport",
    "footwear": true,
    "description": "Strive Talon League FG Cleats in Blue Pink."
  },
  {
    "title": "Strive League FG/MG Cleats",
    "brand": "Strive",
    "colorway": "Sky Blue",
    "price": 95,
    "images": [
      "https://cdn.jsdelivr.net/gh/mercurjs/mercur@main/static/strive-league-fg-mg-cleats-1.png"
    ],
    "category": "Sport",
    "footwear": true,
    "description": "Strive League FG/MG Cleats in Sky Blue."
  },
  {
    "title": "Stride Drift Runner",
    "brand": "Stride",
    "colorway": "White Cobalt",
    "price": 190,
    "images": [
      "https://cdn.jsdelivr.net/gh/mercurjs/mercur@main/static/stride-drift-runner-1.png"
    ],
    "category": "Sport",
    "footwear": true,
    "description": "Stride Drift Runner in White Cobalt."
  },
  {
    "title": "Strive Taekwondo Ballet Trainers",
    "brand": "Strive",
    "colorway": "Maroon",
    "price": 140,
    "images": [
      "https://cdn.jsdelivr.net/gh/mercurjs/mercur@main/static/strive-taekwondo-ballet-trainers-1.png"
    ],
    "category": "Sport",
    "footwear": true,
    "description": "Strive Taekwondo Ballet Trainers in Maroon."
  },
  {
    "title": "Velocity Kinetic Runner",
    "brand": "Velocity",
    "colorway": "White Truffle Grey",
    "price": 214,
    "images": [
      "https://cdn.jsdelivr.net/gh/mercurjs/mercur@main/static/velocity-kinetic-runner-1.png"
    ],
    "category": "Sport",
    "footwear": true,
    "description": "Velocity Kinetic Runner in White Truffle Grey."
  },
  {
    "title": "Velocity Motion 32 Runner",
    "brand": "Velocity",
    "colorway": "Black Graphite Grey",
    "price": 196,
    "images": [
      "https://cdn.jsdelivr.net/gh/mercurjs/mercur@main/static/velocity-motion-32-runner-1.png"
    ],
    "category": "Sport",
    "footwear": true,
    "description": "Velocity Motion 32 Runner in Black Graphite Grey."
  },
  {
    "title": "Apex Cloud Runner 41",
    "brand": "Apex",
    "colorway": "White Turquoise Concord Black",
    "price": 173,
    "images": [
      "https://cdn.jsdelivr.net/gh/mercurjs/mercur@main/static/apex-cloud-runner-41-1.png"
    ],
    "category": "Sport",
    "footwear": true,
    "description": "Apex Cloud Runner 41 in White Turquoise Concord Black."
  },
  {
    "title": "Ironforge Trucker Hat",
    "brand": "Ironforge",
    "colorway": "Honolulu",
    "price": 949,
    "images": [
      "https://cdn.jsdelivr.net/gh/mercurjs/mercur@main/static/ironforge-trucker-hat-1.png",
      "https://cdn.jsdelivr.net/gh/mercurjs/mercur@main/static/ironforge-trucker-hat-2.png"
    ],
    "category": "Accessories",
    "footwear": false,
    "description": "Ironforge Trucker Hat in Honolulu."
  },
  {
    "title": "Cottonwood Watermelon Pouch",
    "brand": "Cottonwood",
    "colorway": "Green",
    "price": 313,
    "images": [
      "https://cdn.jsdelivr.net/gh/mercurjs/mercur@main/static/cottonwood-watermelon-pouch-1.png",
      "https://cdn.jsdelivr.net/gh/mercurjs/mercur@main/static/cottonwood-watermelon-pouch-2.png"
    ],
    "category": "Accessories",
    "footwear": false,
    "description": "Cottonwood Watermelon Pouch in Green."
  },
  {
    "title": "Cottonwood Flag Wallet",
    "brand": "Cottonwood",
    "colorway": "Multicolor",
    "price": 313,
    "images": [
      "https://cdn.jsdelivr.net/gh/mercurjs/mercur@main/static/cottonwood-flag-wallet-1.png",
      "https://cdn.jsdelivr.net/gh/mercurjs/mercur@main/static/cottonwood-flag-wallet-2.png"
    ],
    "category": "Accessories",
    "footwear": false,
    "description": "Cottonwood Flag Wallet in Multicolor."
  },
  {
    "title": "Cottonwood Flag Zip Wallet",
    "brand": "Cottonwood",
    "colorway": "Multicolor",
    "price": 313,
    "images": [
      "https://cdn.jsdelivr.net/gh/mercurjs/mercur@main/static/cottonwood-flag-zip-wallet-1.png",
      "https://cdn.jsdelivr.net/gh/mercurjs/mercur@main/static/cottonwood-flag-zip-wallet-2.png"
    ],
    "category": "Accessories",
    "footwear": false,
    "description": "Cottonwood Flag Zip Wallet in Multicolor."
  },
  {
    "title": "Cottonwood Flag Pouch",
    "brand": "Cottonwood",
    "colorway": "Multicolor",
    "price": 313,
    "images": [
      "https://cdn.jsdelivr.net/gh/mercurjs/mercur@main/static/cottonwood-flag-pouch-1.png",
      "https://cdn.jsdelivr.net/gh/mercurjs/mercur@main/static/cottonwood-flag-pouch-2.png"
    ],
    "category": "Accessories",
    "footwear": false,
    "description": "Cottonwood Flag Pouch in Multicolor."
  },
  {
    "title": "Union Standard Reversible Bucket Hat",
    "brand": "Union Standard",
    "colorway": "Black",
    "price": 76,
    "images": [
      "https://cdn.jsdelivr.net/gh/mercurjs/mercur@main/static/union-standard-reversible-bucket-hat-1.png",
      "https://cdn.jsdelivr.net/gh/mercurjs/mercur@main/static/union-standard-reversible-bucket-hat-2.png"
    ],
    "category": "Accessories",
    "footwear": false,
    "description": "Union Standard Reversible Bucket Hat in Black."
  },
  {
    "title": "Cottonwood Classic Cap",
    "brand": "Cottonwood",
    "colorway": "Purple",
    "price": 73,
    "images": [
      "https://cdn.jsdelivr.net/gh/mercurjs/mercur@main/static/cottonwood-classic-cap-1.png",
      "https://cdn.jsdelivr.net/gh/mercurjs/mercur@main/static/cottonwood-classic-cap-2.png"
    ],
    "category": "Accessories",
    "footwear": false,
    "description": "Cottonwood Classic Cap in Purple."
  },
  {
    "title": "Cottonwood Watermelon Wallet",
    "brand": "Cottonwood",
    "colorway": "Green",
    "price": 313,
    "images": [
      "https://cdn.jsdelivr.net/gh/mercurjs/mercur@main/static/cottonwood-watermelon-wallet-1.png",
      "https://cdn.jsdelivr.net/gh/mercurjs/mercur@main/static/cottonwood-watermelon-wallet-2.png"
    ],
    "category": "Accessories",
    "footwear": false,
    "description": "Cottonwood Watermelon Wallet in Green."
  },
  {
    "title": "Cottonwood Slogan Trucker Hat",
    "brand": "Cottonwood",
    "colorway": "Orange",
    "price": 66,
    "images": [
      "https://cdn.jsdelivr.net/gh/mercurjs/mercur@main/static/cottonwood-slogan-trucker-hat-1.png",
      "https://cdn.jsdelivr.net/gh/mercurjs/mercur@main/static/cottonwood-slogan-trucker-hat-2.png"
    ],
    "category": "Accessories",
    "footwear": false,
    "description": "Cottonwood Slogan Trucker Hat in Orange."
  },
  {
    "title": "Cottonwood Meadow Trucker Cap",
    "brand": "Cottonwood",
    "colorway": "Yellow",
    "price": 66,
    "images": [
      "https://cdn.jsdelivr.net/gh/mercurjs/mercur@main/static/cottonwood-meadow-trucker-cap-1.png",
      "https://cdn.jsdelivr.net/gh/mercurjs/mercur@main/static/cottonwood-meadow-trucker-cap-2.png"
    ],
    "category": "Accessories",
    "footwear": false,
    "description": "Cottonwood Meadow Trucker Cap in Yellow."
  }
]
