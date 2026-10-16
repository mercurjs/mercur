import { ReactNode, useEffect, useState } from "react";
import { clx } from "@medusajs/ui";
import { motion, useReducedMotion } from "motion/react";

export type WizardDirection = 1 | -1;

type WizardStepProps = {
  active: boolean;
  direction: WizardDirection;
  children: ReactNode;
};

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

const stepVariants = {
  enter: (direction: WizardDirection) => ({
    opacity: 0,
    x: 24 * direction,
    filter: "blur(4px)",
  }),
  visible: {
    opacity: 1,
    x: 0,
    filter: "blur(0px)",
    transition: { duration: 0.3, ease: EASE_OUT },
  },
  // Exits are softer and faster than enters: a short nudge in the travel
  // direction while the next step is already coming in.
  exit: (direction: WizardDirection) => ({
    opacity: 0,
    x: -12 * direction,
    filter: "blur(2px)",
    transition: { duration: 0.15, ease: EASE_OUT },
  }),
};

const reducedVariants = {
  enter: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.12 } },
};

export const WizardStep = ({
  active,
  direction,
  children,
}: WizardStepProps) => {
  const reduceMotion = useReducedMotion();
  const [shown, setShown] = useState(active);

  useEffect(() => {
    if (active) {
      setShown(true);
    }
  }, [active]);

  return (
    <motion.div
      custom={direction}
      variants={reduceMotion ? reducedVariants : stepVariants}
      initial="enter"
      animate={active ? "visible" : "exit"}
      onAnimationComplete={(definition) => {
        if (definition === "exit") {
          setShown(false);
        }
      }}
      aria-hidden={!active}
      className={clx(
        "col-start-1 row-start-1 flex-col",
        shown ? "flex" : "hidden",
        !active && "pointer-events-none",
      )}
    >
      {children}
    </motion.div>
  );
};
