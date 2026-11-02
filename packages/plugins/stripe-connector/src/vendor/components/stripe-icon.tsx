import type { ComponentProps } from "react"

// Brand mark: the Stripe purple and glyph are fixed by Stripe, not theme tokens.
export const StripeIcon = (props: ComponentProps<"svg">) => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <rect width="15" height="15" fill="#635BFF" />
    <rect width="15" height="15" fill="url(#stripe_icon_gradient)" fillOpacity="0.2" />
    <g clipPath="url(#stripe_icon_clip)">
      <path
        transform="translate(3 3) scale(0.375)"
        fill="white"
        d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.594-7.305h.003z"
      />
    </g>
    <defs>
      <linearGradient id="stripe_icon_gradient" x1="7.5" y1="0" x2="7.5" y2="15" gradientUnits="userSpaceOnUse">
        <stop stopColor="white" />
        <stop offset="1" stopColor="white" stopOpacity="0" />
      </linearGradient>
      <clipPath id="stripe_icon_clip">
        <rect width="9" height="9" fill="white" transform="translate(3 3)" />
      </clipPath>
    </defs>
  </svg>
)
