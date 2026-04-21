import { motion } from "motion/react";

export function OcculoLogo({ size = 40 }: { size?: number }) {
  const dotSize = size / 20;
  const dots = [];
  const cols = 8;
  const rows = 8;

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const centerX = cols / 2;
      const centerY = rows / 2;
      const distanceFromCenter = Math.sqrt(
        Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2)
      );
      const maxDistance = Math.sqrt(Math.pow(centerX, 2) + Math.pow(centerY, 2));
      const opacity = 1 - distanceFromCenter / maxDistance;

      if (opacity > 0.2) {
        dots.push({
          x: (x / (cols - 1)) * size,
          y: (y / (rows - 1)) * size,
          opacity: opacity,
          delay: (x + y) * 0.02,
        });
      }
    }
  }

  return (
    <div className="relative flex items-center gap-2">
      {/* Dotted sphere logo */}
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {dots.map((dot, i) => (
          <motion.circle
            key={i}
            cx={dot.x}
            cy={dot.y}
            r={dotSize}
            fill="white"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: dot.opacity, scale: 1 }}
            transition={{
              duration: 0.6,
              delay: dot.delay,
              ease: "easeOut",
            }}
          />
        ))}
      </svg>

      {/* Text logo */}
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, delay: 0.3 }}
        className="tracking-[0.3em] uppercase"
        style={{
          fontSize: size * 0.35,
          letterSpacing: "0.3em",
        }}
      >
        occulo
      </motion.div>
    </div>
  );
}
