import { motion } from "motion/react";

import { IconAvatar } from "../icon-avatar";
import config from "virtual:mercur/config";

export default function AvatarBox({ checked }: { checked?: boolean }) {
  const fallbackLetter = config.name?.charAt(0)?.toUpperCase() ?? "M";

  return (
    <IconAvatar
      size="xlarge"
      className="bg-ui-button-neutral shadow-buttons-neutral after:button-neutral-gradient relative mb-4 flex h-[50px] w-[50px] items-center justify-center rounded-xl after:inset-0 after:content-['']"
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
      {config.logo ? (
        <img
          src={config.logo}
          alt={config.name ?? ""}
          className="h-full w-full rounded-[10px] object-cover"
        />
      ) : (
        <svg
          className="rounded-[10px]"
          viewBox="0 0 400 400"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect width="400" height="400" rx="40" fill="#18181B" />
          <text
            x="200"
            y="200"
            textAnchor="middle"
            dominantBaseline="central"
            fill="white"
            fontSize="200"
            fontWeight="bold"
            fontFamily="Inter, system-ui, sans-serif"
          >
            {fallbackLetter}
          </text>
        </svg>
      )}
    </IconAvatar>
  );
}
