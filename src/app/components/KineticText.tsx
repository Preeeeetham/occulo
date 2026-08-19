import { motion } from "motion/react";

interface KineticTextProps {
  text: string;
  className?: string;
  style?: React.CSSProperties;
  as?: "h1" | "h2" | "h3" | "p" | "span";
}

const components = {
  h1: motion.h1,
  h2: motion.h2,
  h3: motion.h3,
  p: motion.p,
  span: motion.span,
};

export function KineticText({ text, className = "", style = {}, as = "h2" }: KineticTextProps) {
  const words = text.split(" ");
  const Component = components[as] || motion.h2;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1,
      },
    },
  };

  const wordVariants = {
    hidden: {
      opacity: 0,
      y: 40,
      rotateX: -45,
    },
    visible: {
      opacity: 1,
      y: 0,
      rotateX: 0,
      transition: {
        duration: 0.9,
        ease: [0.16, 1, 0.3, 1],
      },
    },
  };

  return (
    <Component
      className={`inline-flex flex-wrap gap-x-[0.28em] gap-y-[0.1em] ${className}`}
      style={{
        ...style,
        perspective: "1000px",
      }}
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-10%" }}
    >
      {words.map((word, index) => (
        <span key={index} className="inline-block overflow-hidden pb-1">
          <motion.span
            variants={wordVariants}
            className="inline-block transform-gpu"
            style={{ transformOrigin: "bottom center" }}
          >
            {word}
          </motion.span>
        </span>
      ))}
    </Component>
  );
}
