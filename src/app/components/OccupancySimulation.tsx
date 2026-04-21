import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect } from "react";

interface Person {
  id: number;
  x: number;
  y: number;
}

export function OccupancySimulation() {
  const [people, setPeople] = useState<Person[]>([]);
  const [accuracy, setAccuracy] = useState(95);

  useEffect(() => {
    const interval = setInterval(() => {
      setPeople((prev) => {
        const newPeople = [...prev];

        // Randomly add or remove people
        if (Math.random() > 0.5 && newPeople.length < 8) {
          newPeople.push({
            id: Date.now(),
            x: Math.random() * 70 + 15,
            y: Math.random() * 60 + 20,
          });
        } else if (newPeople.length > 0 && Math.random() > 0.7) {
          newPeople.shift();
        }

        return newPeople;
      });

      // Accuracy fluctuates slightly
      setAccuracy(95 + Math.random() * 2);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full max-w-md mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="relative h-[380px] rounded-2xl overflow-hidden"
        style={{
          background: "linear-gradient(145deg, #2c6bde, #2459c0)",
          boxShadow: "0 24px 64px rgba(44, 107, 222, 0.25), 0 8px 24px rgba(0,0,0,0.08)",
        }}
      >
        {/* Room wireframe */}
        <div className="absolute inset-4 border border-white/20 rounded-lg">
          {/* Grid lines */}
          <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white/10" />
          <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white/10" />
          <div className="absolute left-0 right-0 top-1/3 h-px bg-white/10" />
          <div className="absolute left-0 right-0 top-2/3 h-px bg-white/10" />

          {/* Door outline */}
          <div className="absolute left-1/4 right-1/4 top-1/2 bottom-0 border border-white/15 rounded-t-lg" />
        </div>

        {/* People dots */}
        <AnimatePresence>
          {people.map((person) => (
            <motion.div
              key={person.id}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              className="absolute w-3 h-3 rounded-full"
              style={{
                left: `${person.x}%`,
                top: `${person.y}%`,
                background: "#fff",
                boxShadow: "0 0 12px rgba(255, 255, 255, 0.5)",
              }}
            />
          ))}
        </AnimatePresence>

        {/* Occupancy count */}
        <div className="absolute top-5 right-5 text-right">
          <motion.div
            key={people.length}
            initial={{ scale: 1.15 }}
            animate={{ scale: 1 }}
            className="text-3xl font-semibold tracking-tight text-white"
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            {people.length}
          </motion.div>
          <div className="text-[10px] uppercase tracking-[0.15em] text-white/45 mt-0.5">
            Occupants
          </div>
        </div>

        {/* Accuracy indicator */}
        <div className="absolute bottom-5 left-5">
          <div className="text-[10px] uppercase tracking-[0.15em] text-white/40 mb-1">
            Detection Accuracy
          </div>
          <motion.div
            key={accuracy.toFixed(1)}
            initial={{ opacity: 0.6 }}
            animate={{ opacity: 1 }}
            className="text-xl font-medium tracking-tight text-white/90"
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            {accuracy.toFixed(1)}%
          </motion.div>
        </div>
      </motion.div>

      {/* Label */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.3 }}
        className="text-center mt-5 text-xs tracking-[0.15em] uppercase"
        style={{ color: "#aaa" }}
      >
        Live Occupancy Simulation
      </motion.div>
    </div>
  );
}
