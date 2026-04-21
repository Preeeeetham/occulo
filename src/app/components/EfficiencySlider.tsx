import { useState } from "react";
import { motion } from "motion/react";

export function EfficiencySlider() {
  const [value, setValue] = useState(50);

  const waitTimeReduction = Math.round(value * 0.4);
  const densityReduction = Math.round(value * 0.7);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8 }}
      className="w-full max-w-2xl mx-auto p-8 rounded-2xl"
      style={{
        background: "rgba(30, 64, 175, 0.3)",
        backdropFilter: "blur(30px)",
        border: "1px solid rgba(255, 255, 255, 0.3)",
      }}
    >
      <h3 className="text-xl tracking-wide mb-8 text-center uppercase text-white/80">
        Efficiency Impact
      </h3>

      {/* Custom glass slider */}
      <div className="relative mb-12">
        <div
          className="h-2 rounded-full relative overflow-hidden"
          style={{
            background: "rgba(255, 255, 255, 0.1)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
          }}
        >
          {/* Filled portion */}
          <motion.div
            className="absolute left-0 top-0 bottom-0 rounded-full"
            style={{
              width: `${value}%`,
              background: "linear-gradient(90deg, #FFFFFF, #E0EAFF)",
              boxShadow: "0 0 20px rgba(255, 255, 255, 0.5)",
            }}
            initial={false}
            animate={{ width: `${value}%` }}
          />
        </div>

        {/* Slider thumb */}
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 cursor-pointer"
          style={{
            left: `${value}%`,
            marginLeft: "-16px",
          }}
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.9 }}
        >
          <div
            className="w-8 h-8 rounded-full relative"
            style={{
              background: "linear-gradient(135deg, #FFFFFF, #E0EAFF)",
              boxShadow: "0 0 30px rgba(255, 255, 255, 0.8), 0 4px 15px rgba(0, 0, 0, 0.2)",
              border: "2px solid rgba(255, 255, 255, 0.4)",
            }}
          >
            {/* Glow pulse */}
            <motion.div
              className="absolute inset-0 rounded-full"
              animate={{
                boxShadow: [
                  "0 0 20px rgba(255, 255, 255, 0.5)",
                  "0 0 40px rgba(255, 255, 255, 0.8)",
                  "0 0 20px rgba(255, 255, 255, 0.5)",
                ],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
        </motion.div>

        {/* Interactive input */}
        <input
          type="range"
          min="0"
          max="100"
          value={value}
          onChange={(e) => setValue(Number(e.target.value))}
          className="absolute inset-0 w-full opacity-0 cursor-pointer"
        />
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-6">
        <motion.div
          className="text-center p-6 rounded-xl"
          style={{
            background: "rgba(255, 255, 255, 0.1)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
          }}
          animate={{
            borderColor: [
              "rgba(255, 255, 255, 0.2)",
              "rgba(255, 255, 255, 0.5)",
              "rgba(255, 255, 255, 0.2)",
            ],
          }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <div className="text-sm uppercase tracking-widest text-[#FFFFFF]/60 mb-3">
            Wait Time Reduction
          </div>
          <motion.div
            key={waitTimeReduction}
            initial={{ scale: 1.1, opacity: 0.8 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-5xl tracking-tight"
            style={{
              color: "#FFFFFF",
              textShadow: "0 0 30px rgba(255, 255, 255, 0.5)",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {waitTimeReduction}%
          </motion.div>
        </motion.div>

        <motion.div
          className="text-center p-6 rounded-xl"
          style={{
            background: "rgba(255, 255, 255, 0.1)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
          }}
          animate={{
            borderColor: [
              "rgba(255, 255, 255, 0.2)",
              "rgba(255, 255, 255, 0.5)",
              "rgba(255, 255, 255, 0.2)",
            ],
          }}
          transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
        >
          <div className="text-sm uppercase tracking-widest text-[#E0EAFF]/60 mb-3">
            Unsafe Density Reduction
          </div>
          <motion.div
            key={densityReduction}
            initial={{ scale: 1.1, opacity: 0.8 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-5xl tracking-tight"
            style={{
              color: "#E0EAFF",
              textShadow: "0 0 30px rgba(224, 234, 255, 0.4)",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {densityReduction}%
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
}
