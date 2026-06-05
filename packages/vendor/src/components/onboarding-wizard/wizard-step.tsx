import { ReactNode } from "react";
import { motion } from "motion/react";

type WizardStepProps = {
  children: ReactNode;
};

const stepVariants = {
  initial: { opacity: 0, y: 12, filter: "blur(4px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  exit: {
    opacity: 0,
    y: -8,
    filter: "blur(4px)",
    transition: { duration: 0.2, ease: [0.23, 1, 0.32, 1] },
  },
};

export const WizardStep = ({ children }: WizardStepProps) => {
  return (
    <motion.div
      variants={stepVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
      className="flex flex-col"
    >
      {children}
    </motion.div>
  );
};
