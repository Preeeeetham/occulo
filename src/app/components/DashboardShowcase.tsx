import { motion } from "motion/react";
import { useRef, useState } from "react";

export function DashboardShowcase() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <section
      className="py-24 md:py-32 px-6 md:px-10 overflow-hidden relative"
      style={{ background: "#080E1C" }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Top Edge Accent */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[1px] bg-gradient-to-r from-transparent via-[#2c6bde]/50 to-transparent opacity-50" />

      <div className="max-w-[1400px] mx-auto">
        <div className="grid lg:grid-cols-[0.7fr_2fr] gap-24 items-center">

          {/* Left Column: Narrative & Brand */}
          <div className="flex flex-col gap-8 z-10">
            <div className="space-y-6">
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-[11px] font-bold tracking-[0.3em] uppercase text-[#2c6bde]"
              >
                SPADES LIVE DASHBOARD
              </motion.p>

              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1, duration: 0.8 }}
                className="text-5xl md:text-7xl font-bold text-white leading-[0.9]"
                style={{ letterSpacing: "-0.05em" }}
              >
                Total <br /> Observability.
              </motion.h2>

              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="text-white/50 text-lg md:text-xl max-w-md font-medium leading-relaxed"
              >
                Every elevator. Every floor. Every trip. Processed entirely at the edge, monitored in real-time.
              </motion.p>
            </div>


          </div>

          {/* Right Column: The Video Mockup */}
          <div className="relative">
            {/* Cinematic Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-lg bg-[#2c6bde]/20 blur-[120px] rounded-full opacity-60" />

            <div className="relative z-10">
              {/* Production-Ready Annotations */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 }}
                className="absolute -left-8 md:-left-16 top-1/2 -translate-y-1/2 hidden lg:flex items-center gap-4"
              >
                <div className="w-12 h-px bg-white/20" />
                <div className="w-2 h-2 rounded-full bg-[#2c6bde]" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-[#2c6bde] uppercase tracking-widest mb-1">SENSORY FEED</span>
                  <span className="text-xs font-mono text-white/50 whitespace-nowrap">Interior A-12</span>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.6 }}
                className="absolute -right-8 md:-right-16 top-1/4 hidden lg:flex items-center justify-end gap-4"
              >
                <div className="flex flex-col text-right">
                  <span className="text-[10px] font-bold text-[#2c6bde] uppercase tracking-widest mb-1">SENSORY INFERENCE</span>
                  <span className="text-xs font-mono text-white/50 whitespace-nowrap">Density Prevention</span>
                </div>
                <div className="w-2 h-2 rounded-full bg-[#2c6bde]" />
                <div className="w-12 h-px bg-white/20" />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.7 }}
                className="absolute -right-8 md:-right-16 bottom-1/4 hidden lg:flex items-center justify-end gap-4"
              >
                <div className="flex flex-col text-right">
                  <span className="text-[10px] font-bold text-[#2c6bde] uppercase tracking-widest mb-1">SPATIAL MAPPING</span>
                  <span className="text-xs font-mono text-white/50 whitespace-nowrap">Occupancy Grid</span>
                </div>
                <div className="w-2 h-2 rounded-full bg-[#2c6bde]" />
                <div className="w-12 h-px bg-white/20" />
              </motion.div>

              {/* Browser Chrome Mockup */}
              <motion.div
                initial={{ opacity: 0, y: 40, scale: 0.98 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                className="relative bg-[#0f172a] rounded-3xl shadow-[0_0_100px_rgba(44,107,222,0.15)] border border-white/10 overflow-hidden group"
              >
                <div className="flex items-center px-5 py-3 border-b border-white/5 bg-white/[0.02]">
                  <div className="flex gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
                  </div>
                </div>
                <div className="aspect-video bg-black overflow-hidden relative">
                  <video
                    ref={videoRef}
                    src="https://pub-06550b23f5e34caba3a8cf8c9189e1ea.r2.dev/SaaS.mp4"
                    autoPlay
                    muted
                    loop
                    playsInline
                    disablePictureInPicture
                    controlsList="nodownload noplaybackrate"
                    onContextMenu={(e) => e.preventDefault()}
                    className="w-full h-full object-cover pointer-events-none"
                  />
                  <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_60px_rgba(0,0,0,0.6)]" />
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
