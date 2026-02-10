import { motion } from "motion/react"

import { IconAvatar } from "../icon-avatar"

export default function AvatarBox({
  checked,
  size = 44,
}: {
  checked?: boolean
  size?: number
}) {
  return (
    <IconAvatar
      size={size === 44 ? "xlarge" : "small"}
      className="bg-ui-button-neutral shadow-buttons-neutral after:button-neutral-gradient relative mb-4 flex items-center justify-center rounded-xl after:inset-0 after:content-['']"
    >
      {checked && (
        <motion.div
          className="absolute -right-[5px] -top-1 flex size-5 items-center justify-center rounded-full border-[0.5px] border-[rgba(3,7,18,0.2)] bg-[#3B82F6] bg-gradient-to-b from-white/0 to-white/20 shadow-[0px_1px_2px_0px_rgba(3,7,18,0.12),0px_1px_2px_0px_rgba(255,255,255,0.10)_inset,0px_-1px_5px_0px_rgba(255,255,255,0.10)_inset,0px_0px_0px_0px_rgba(3,7,18,0.06)_inset]"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            duration: 1.2,
            delay: 0.8,
            ease: [0, 0.71, 0.2, 1.01],
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
          >
            <motion.path
              d="M5.8335 10.4167L9.16683 13.75L14.1668 6.25"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{
                duration: 1.3,
                delay: 1.1,
                bounce: 0.6,
                ease: [0.1, 0.8, 0.2, 1.01],
              }}
            />
          </svg>
        </motion.div>
      )}
      <svg
        width="44"
        height="44"
        viewBox="0 0 44 44"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="44" height="44" rx="10" fill="#FAFAFA" />
        <g clipPath="url(#clip0_11_175)">
          <path d="M8 7V20.7349L19.821 13.8675L8 7Z" fill="#4C24DD" />
          <path
            d="M36.0002 37.0001V23.2651L24.1792 30.1326L36.0002 37.0001Z"
            fill="#4C24DD"
          />
          <path d="M8 23.2651V37L36 20.7349V7L8 23.2651Z" fill="#4C24DD" />
        </g>
        <defs>
          <clipPath id="clip0_11_175">
            <rect
              width="28"
              height="30"
              fill="white"
              transform="translate(8 7)"
            />
          </clipPath>
        </defs>
      </svg>
    </IconAvatar>
  )
}
