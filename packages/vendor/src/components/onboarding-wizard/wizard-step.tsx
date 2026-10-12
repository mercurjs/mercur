import { ReactNode } from "react";
import { clx } from "@medusajs/ui";
import { motion } from "motion/react";

type WizardStepProps = {
  active: boolean;
  children: ReactNode;
};

const stepVariants = {
  initial: { opacity: 0, y: 12, filter: "blur(4px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
};

export const WizardStep = ({ active, children }: WizardStepProps) => {
  return (
    <motion.div
      variants={stepVariants}
      initial="initial"
      animate={active ? "animate" : "initial"}
      transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
      className={clx("flex-col", active ? "flex" : "hidden")}
    >
      {children}
    </motion.div>
  );
};
