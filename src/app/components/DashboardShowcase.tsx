import { motion } from "motion/react";

export function DashboardShowcase() {
  return (
    <section
      className="py-24 md:py-36 px-6 md:px-10 overflow-hidden relative"
      style={{ background: "#080E1C" }}
    >
      {/* Top Edge Accent */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[1px] bg-gradient-to-r from-transparent via-[#2c6bde]/50 to-transparent opacity-50" />

      <div className="max-w-[1400px] mx-auto space-y-28 md:space-y-40">
        {/* ───────── Master Section Header ───────── */}
        <div className="text-center max-w-3xl mx-auto">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-[11px] font-bold tracking-[0.3em] uppercase text-[#2c6bde] mb-4"
          >
            SPADES LIVE DASHBOARD
          </motion.p>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, duration: 0.8 }}
            className="text-5xl md:text-7xl font-bold text-white leading-[1.0] tracking-tight mb-6"
            style={{ letterSpacing: "-0.04em" }}
          >
            Total Observability.
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-white/60 text-base md:text-xl font-medium leading-relaxed max-w-2xl mx-auto"
          >
            Real-time edge spatial intelligence unifying vertical passenger transit and wide-area aerial perimeters.
          </motion.p>
        </div>

        {/* ───────── 1. Elevator Live Dashboard (Text on Left, Video on Right) ───────── */}
        <div className="grid lg:grid-cols-[0.7fr_2fr] gap-16 lg:gap-24 items-center">
          {/* Left Column: Narrative */}
          <div className="flex flex-col gap-8 z-10">
            <div className="space-y-5">
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-[11px] font-bold tracking-[0.3em] uppercase text-[#2c6bde]"
              >
                VERTICAL MOBILITY
              </motion.p>

              <motion.h3
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1, duration: 0.8 }}
                className="text-4xl md:text-5xl font-bold text-white leading-[1.0]"
                style={{ letterSpacing: "-0.04em" }}
              >
                Elevator Cabin <br /> Dynamics.
              </motion.h3>

              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="text-white/50 text-base md:text-lg max-w-md font-medium leading-relaxed"
              >
                Every elevator. Every floor. Every trip. Processed entirely at the edge, monitoring space availability and increasing the safety and efficiency in real time.
              </motion.p>
            </div>
          </div>

          {/* Right Column: Elevator Video Mockup */}
          <div className="relative">
            {/* Cinematic Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-lg bg-[#2c6bde]/20 blur-[120px] rounded-full opacity-60 pointer-events-none" />

            <div className="relative z-10">
              {/* Callout Annotations */}
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
                <div 
                  className="w-full bg-black overflow-hidden relative"
                  style={{ aspectRatio: "3840 / 1728" }}
                >
                  <video
                    src="/SaaS.mp4"
                    autoPlay
                    muted
                    loop
                    playsInline
                    disablePictureInPicture
                    controlsList="nodownload noplaybackrate"
                    onContextMenu={(e) => e.preventDefault()}
                    className="w-full h-full object-cover pointer-events-none"
                  />
                  <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_30px_rgba(0,0,0,0.3)]" />
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* ───────── 2. Aerial Drone Dashboard (Video on Left, Text on Right) ───────── */}
        <div className="grid lg:grid-cols-[2fr_0.7fr] gap-16 lg:gap-24 items-center">
          {/* Left Column: Drone Video Mockup */}
          <div className="relative order-2 lg:order-1">
            {/* Cinematic Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-lg bg-[#2c6bde]/20 blur-[120px] rounded-full opacity-60 pointer-events-none" />

            <div className="relative z-10">
              {/* Callout Annotations */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 }}
                className="absolute -left-8 md:-left-16 top-1/3 -translate-y-1/2 hidden lg:flex items-center gap-4"
              >
                <div className="w-12 h-px bg-white/20" />
                <div className="w-2 h-2 rounded-full bg-[#2c6bde]" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-[#2c6bde] uppercase tracking-widest mb-1">AERIAL SENSORY FEED</span>
                  <span className="text-xs font-mono text-white/50 whitespace-nowrap">Drone Alpha · 48m AGL</span>
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
                  <span className="text-[10px] font-bold text-[#2c6bde] uppercase tracking-widest mb-1">TACTICAL GIS</span>
                  <span className="text-xs font-mono text-white/50 whitespace-nowrap">Route Dispersal</span>
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
                  <span className="text-[10px] font-bold text-[#2c6bde] uppercase tracking-widest mb-1">SPATIAL FREESPACE</span>
                  <span className="text-xs font-mono text-white/50 whitespace-nowrap">42.6% Safe Buffer</span>
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
                <div 
                  className="w-full bg-black overflow-hidden relative"
                  style={{ aspectRatio: "1920 / 862" }}
                >
                  <video
                    src="/SPADES_drone.mp4"
                    autoPlay
                    muted
                    loop
                    playsInline
                    disablePictureInPicture
                    controlsList="nodownload noplaybackrate"
                    onContextMenu={(e) => e.preventDefault()}
                    className="w-full h-full object-cover pointer-events-none"
                  />
                  <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_30px_rgba(0,0,0,0.3)]" />
                </div>
              </motion.div>
            </div>
          </div>

          {/* Right Column: Narrative */}
          <div className="flex flex-col gap-8 z-10 order-1 lg:order-2">
            <div className="space-y-5">
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-[11px] font-bold tracking-[0.3em] uppercase text-[#2c6bde]"
              >
                AERIAL TELEMETRY
              </motion.p>

              <motion.h3
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1, duration: 0.8 }}
                className="text-4xl md:text-5xl font-bold text-white leading-[1.0]"
                style={{ letterSpacing: "-0.04em" }}
              >
                Public Perimeter and <br /> Tactical GIS.
              </motion.h3>

              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="text-white/50 text-base md:text-lg max-w-md font-medium leading-relaxed"
              >
                Every Public Overcrowding sector. Every altitude. Every perimeter. Processed entirely at the edge with live tactical GIS dispersal tracking in real-time.
              </motion.p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
