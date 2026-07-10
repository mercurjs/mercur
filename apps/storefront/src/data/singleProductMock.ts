export const singleProduct = {
  id: '1',
  brand: 'Nike',
  name: 'AIR FORCE 1 LOW OFF-WHITE UNIVERSITY GOLD',
  price: 3599,
  originalPrice: 4000,
  color: 'Yellow',
  colorVariants: [
    {
      variant: '#FCC501',
      label: 'Yellow',
      disabled: false,
    },
    { variant: '#090909', label: 'Black', disabled: false },
    { variant: '#F7F7F7', label: 'Gray', disabled: false },
  ],
  size: 'UK 3.5',
  sizeVariants: [
    { label: 'UK 3', disabled: false },
    { label: 'UK 3.5', disabled: false },
    { label: 'UK 4', disabled: false },
    { label: 'UK 4.5', disabled: true },
  ],
  condition: 'New with box',
  images: [
    {
      id: '1',
      url: '/images/product/Image-1.jpg',
      alt: 'Nike Air Force 1 Low Off-White University Gold - Main View',
    },
    {
      id: '2',
      url: '/images/product/Image-2.jpg',
      alt: 'Nike Air Force 1 Low Off-White University Gold - Side View',
    },
    {
      id: '3',
      url: '/images/product/Image-3.jpg',
      alt: 'Nike Air Force 1 Low Off-White University Gold - Back View',
    },
    {
      id: '4',
      url: '/images/product/Image-3.jpg',
      alt: 'Nike Air Force 1 Low Off-White University Gold - Back View',
    },
    {
      id: '5',
      url: '/images/product/Image-3.jpg',
      alt: 'Nike Air Force 1 Low Off-White University Gold - Back View',
    },
  ],
  details:
    "<p>Nike elevates the iconic Air Force 1 silhouette with the Off-White University Gold edition. These sneakers blend high-fashion aesthetics with streetwear appeal, showcasing Virgil Abloh's signature deconstructed design and bold yellow accents. The intricately crafted details and Off-White branding make them a standout piece in any collection.</p><ul class='mt-4'><li>Upper: leather</li><li>Lining: fabric</li><li>Sole: rubber</li><li>Toe shape: round toe</li><li>Made in: Vietnam</li><li>Includes: shoe box, extra laces</li><li>Designer color name: University Gold</li><li>Closure: lace-up</li><li>Item number: AF1OWUG</li></ul>",
  measurements: [
    { label: 'Heel Height', inches: '2', cm: '5.1' },
  ],
  seller: {
    id: 'jason',
    name: 'Jason',
    avatar: '/images/product/seller-avatar.jpg',
    rating: 4,
    reviewCount: 234,
    verified: true,
    page: '/sellers/jason',
    joinDate: '2017',
    sold: 126,
    description:
      'Designer collection garms from Japan<br />Buy with confidence & Pay as you wish/the most offer & Bundle deals, make reasonable offers & No refund',
  },
  reviews: [
    {
      id: '1',
      rating: 5,
      username: 'sarahmitchell',
      date: '3 days ago',
      text: 'Amazing experience buying from Jason! The customer service was top-notch, and my Jordans arrived quickly. The shoes were exactly as described. Will definitely shop here again!',
      image: '/images/product/review-image-1.jpg',
    },
    {
      id: '2',
      rating: 5,
      username: 'jamesrodriguez',
      date: '3 weeks ago',
      text: 'Jason provided fantastic service. My order arrived in perfect condition and right on time. The site is easy to navigate, and checkout was a breeze. Highly recommend this seller!',
      image: '/images/product/review-image-2.jpg',
    },
    {
      id: '3',
      rating: 5,
      username: 'rmilydavis',
      date: '1 year ago',
      text: "I'm very impressed with Jason. My order was processed swiftly, and the sneakers arrived earlier than expected. Excellent communication and quality products. I'll be a returning customer for sure!",
      image: '/images/product/review-image-3.jpg',
    },
  ],
  tags: ['Sneakers', 'Nike', 'Track'],
  postedDate: '7 days ago',
};
