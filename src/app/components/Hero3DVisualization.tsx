import { motion } from "motion/react";
import { useEffect, useState } from "react";

export function Hero3DVisualization() {
  const [pulsePhase, setPulsePhase] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPulsePhase((prev) => (prev + 1) % 100);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full h-[600px] flex items-center justify-center overflow-hidden">
      {/* Glass morphism container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        className="relative w-[500px] h-[400px]"
        style={{
          perspective: "1000px",
        }}
      >
        {/* 3D Room wireframe */}
        <motion.div
          className="absolute inset-0"
          style={{
            transformStyle: "preserve-3d",
          }}
          animate={{
            rotateY: [0, 5, 0, -5, 0],
            rotateX: [0, -2, 0, 2, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          {/* Back wall */}
          <div
            className="absolute w-full h-full border border-[#FFFFFF]/30 backdrop-blur-xl rounded-lg"
            style={{
              background:
                "linear-gradient(135deg, rgba(255, 255, 255, 0.05), rgba(224, 234, 255, 0.05))",
              transform: "translateZ(-100px)",
            }}
          />

          {/* Floor */}
          <div
            className="absolute w-full h-full border border-[#E0EAFF]/20"
            style={{
              background:
                "linear-gradient(180deg, rgba(224, 234, 255, 0.02), rgba(255, 255, 255, 0.03))",
              transformOrigin: "bottom",
              transform: "rotateX(90deg) translateZ(-200px)",
            }}
          />

          {/* Left wall */}
          <div
            className="absolute w-full h-full border border-[#FFFFFF]/20"
            style={{
              background: "rgba(255, 255, 255, 0.02)",
              transformOrigin: "left",
              transform: "rotateY(-90deg) translateZ(-250px)",
            }}
          />

          {/* Right wall */}
          <div
            className="absolute w-full h-full border border-[#E0EAFF]/20"
            style={{
              background: "rgba(224, 234, 255, 0.02)",
              transformOrigin: "right",
              transform: "rotateY(90deg) translateZ(-250px)",
            }}
          />

          {/* Negative space particles */}
          {Array.from({ length: 8 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-3 h-3 rounded-full"
              style={{
                background:
                  i % 2 === 0
                    ? "radial-gradient(circle, #FFFFFF 0%, transparent 70%)"
                    : "radial-gradient(circle, #E0EAFF 0%, transparent 70%)",
                left: `${20 + (i % 4) * 20}%`,
                top: `${20 + Math.floor(i / 4) * 40}%`,
                transform: `translateZ(${-50 + i * 10}px)`,
                boxShadow:
                  i % 2 === 0
                    ? "0 0 20px rgba(255, 255, 255, 0.6)"
                    : "0 0 20px rgba(224, 234, 255, 0.6)",
              }}
              animate={{
                y: [0, -10, 0],
                opacity: [0.4, 1, 0.4],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 3 + i * 0.3,
                repeat: Infinity,
                delay: i * 0.2,
                ease: "easeInOut",
              }}
            />
          ))}

          {/* Central pulsing orb representing spatial awareness */}
          <motion.div
            className="absolute left-1/2 top-1/2 w-32 h-32 -ml-16 -mt-16 rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(255, 255, 255, 0.3) 0%, rgba(224, 234, 255, 0.2) 50%, transparent 70%)",
              filter: "blur(20px)",
              transform: "translateZ(0px)",
            }}
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.5, 0.8, 0.5],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </motion.div>

        {/* Floating data streams */}
        {Array.from({ length: 12 }).map((_, i) => (
          <motion.div
            key={`stream-${i}`}
            className="absolute w-px h-16"
            style={{
              background:
                i % 2 === 0
                  ? "linear-gradient(180deg, transparent, #FFFFFF, transparent)"
                  : "linear-gradient(180deg, transparent, #E0EAFF, transparent)",
              left: `${10 + i * 7}%`,
              top: "-20%",
            }}
            animate={{
              y: ["0vh", "120vh"],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 3 + i * 0.5,
              repeat: Infinity,
              delay: i * 0.3,
              ease: "linear",
            }}
          />
        ))}
      </motion.div>

      {/* Ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(255, 255, 255, 0.1) 0%, transparent 60%)",
        }}
      />
    </div>
  );
}
