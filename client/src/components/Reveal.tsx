import { motion } from "framer-motion";
import { cardEnter, enterTransition, motionRest, revealViewport } from "@/lib/motion";

type RevealProps = {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  as?: "div" | "section" | "li";
  reduce: boolean;
  id?: string;
};

export function Reveal({ children, className, delay = 0, as = "div", reduce, id }: RevealProps) {
  const shared = {
    id,
    className,
    initial: cardEnter(reduce),
    whileInView: motionRest(),
    viewport: revealViewport,
    transition: enterTransition(reduce, delay, 0.5),
  };

  if (as === "section") return <motion.section {...shared}>{children}</motion.section>;
  if (as === "li") return <motion.li {...shared}>{children}</motion.li>;
  return <motion.div {...shared}>{children}</motion.div>;
}
