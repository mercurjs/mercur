import * as React from "react"

export const ListBadge = (props: React.SVGProps<SVGSVGElement>) => {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 15 15"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <circle cx="7.5" cy="7.5" r="7.5" fill="#2563EB" />
      <circle
        cx="7.5"
        cy="7.5"
        r="7.5"
        fill="url(#list_badge_paint0_linear)"
        fillOpacity="0.2"
      />
      <circle
        cx="7.5"
        cy="7.5"
        r="7.25"
        stroke="#18181B"
        strokeOpacity="0.24"
        strokeWidth="0.5"
      />
      <path
        d="M10.23 4.25H4.77C4.48281 4.25 4.25 4.48281 4.25 4.77V6.59C4.25 6.87719 4.48281 7.11 4.77 7.11H10.23C10.5172 7.11 10.75 6.87719 10.75 6.59V4.77C10.75 4.48281 10.5172 4.25 10.23 4.25Z"
        fill="white"
      />
      <path
        d="M4.25 8.93H10.75M4.25 10.75H10.75M4.77 4.25H10.23C10.5172 4.25 10.75 4.48281 10.75 4.77V6.59C10.75 6.87719 10.5172 7.11 10.23 7.11H4.77C4.48281 7.11 4.25 6.87719 4.25 6.59V4.77C4.25 4.48281 4.48281 4.25 4.77 4.25Z"
        stroke="white"
        strokeWidth="0.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <defs>
        <linearGradient
          id="list_badge_paint0_linear"
          x1="7.5"
          y1="0"
          x2="7.5"
          y2="15"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="white" />
          <stop offset="1" stopColor="white" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  )
}
