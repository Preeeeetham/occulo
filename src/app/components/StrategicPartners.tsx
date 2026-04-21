import { motion } from "motion/react";
import { Building2, Plane, ShoppingBag, Hospital } from "lucide-react";

const partners = [
  { icon: ShoppingBag, label: "Retail & Malls", delay: 0 },
  { icon: Hospital, label: "Healthcare", delay: 0.1 },
  { icon: Plane, label: "Airports", delay: 0.2 },
  { icon: Building2, label: "Corporate", delay: 0.3 },
];

export function StrategicPartners() {
  return (
    <div className="w-full py-20">
      <motion.h3
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center text-xs uppercase tracking-[0.3em] text-white/40 mb-16"
      >
        Strategic Partners
      </motion.h3>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
        {partners.map(({ icon: Icon, label, delay }) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay }}
            whileHover={{ scale: 1.05 }}
            className="relative group"
          >
            <div
              className="aspect-square rounded-2xl p-8 flex flex-col items-center justify-center gap-4 transition-all duration-500"
              style={{
                background: "rgba(30, 64, 175, 0.3)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                backdropFilter: "blur(10px)",
              }}
            >
              <Icon
                className="w-12 h-12 transition-all duration-500"
                style={{
                  stroke: "rgba(255, 255, 255, 0.3)",
                  strokeWidth: 1,
                }}
              />
              <div className="text-xs uppercase tracking-widest text-white/40 text-center">
                {label}
              </div>

              {/* Hover glow */}
              <motion.div
                className="absolute inset-0 rounded-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(255, 255, 255, 0.15), rgba(224, 234, 255, 0.15))",
                  boxShadow: "0 0 40px rgba(255, 255, 255, 0.3)",
                }}
              />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
