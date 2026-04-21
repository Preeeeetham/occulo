import { motion, useScroll, useTransform, AnimatePresence } from "motion/react";
import { useRef, useState } from "react";
import { OccupancySimulation } from "./components/OccupancySimulation";
import logoImg from "../imports/image.png";
import heroLogo from "../../1.png";
import { Shield, Zap, Eye, ArrowRight, X, Phone, Mail, Linkedin } from "lucide-react";

// Premium easing curves for buttery transitions
const EASE = [0.16, 1, 0.3, 1];
const SPRING = { type: "spring", stiffness: 100, damping: 20 };

// Reusable animation variants
const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 1.2, ease: EASE } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.1 },
  },
};

export default function App() {
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [formState, setFormState] = useState({ name: "", email: "", company: "", message: "" });
  const [formStatus, setFormStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormStatus("loading");

    try {
      const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service_id: "service_bcvb6rj",
          template_id: "template_bsvrhue",
          user_id: "ISngJx5D_OLuvtHWv",
          template_params: {
            name: formState.name,
            email: formState.email,
            company: formState.company,
            message: formState.message,
          }
        })
      });

      if (res.ok) {
        setFormStatus("success");
        setTimeout(() => {
          setIsContactOpen(false);
          setFormStatus("idle");
          setFormState({ name: "", email: "", company: "", message: "" });
        }, 2500);
      } else {
        const errorText = await res.text();
        console.error("EmailJS Error:", errorText);
        setFormStatus("error");
      }
    } catch (err) {
      console.error("Fetch failed:", err);
      setFormStatus("error");
    }
  };

  // Scroll parallax for the hero section
  const heroRef = useRef(null);
  const { scrollYProgress: heroScroll } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  const heroY = useTransform(heroScroll, [0, 1], [0, 200]);
  const heroOpacity = useTransform(heroScroll, [0, 0.8], [1, 0]);

  return (
    <div
      className="min-h-screen overflow-x-hidden selection:bg-[#2c6bde] selection:text-white"
      style={{ fontFamily: "'Inter', sans-serif", color: "#111" }}
    >
      {/* Hide main browser scrollbar globally for premium app feel */}
      <style>{`
        ::-webkit-scrollbar { display: none; }
        * { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* ───────── Slide-out Contact Drawer ───────── */}
      <AnimatePresence>
        {isContactOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="fixed inset-0 z-[100] cursor-pointer"
              style={{ background: "rgba(0, 0, 0, 0.4)", backdropFilter: "blur(4px)" }}
              onClick={() => setIsContactOpen(false)}
            />

            {/* Sliding Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full md:max-w-md bg-white z-[110] shadow-2xl overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
            >
              <div className="p-8 md:p-12 relative flex flex-col min-h-full">
                <button
                  onClick={() => setIsContactOpen(false)}
                  className="absolute top-8 right-8 p-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <X size={20} color="#111" />
                </button>

                <h3 className="text-3xl font-semibold mb-2" style={{ letterSpacing: "-0.03em" }}>Get in Touch</h3>
                {formStatus === "success" ? (
                  <div className="flex flex-col items-center justify-center h-full text-center py-20">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
                      <Zap size={24} color="#10b981" />
                    </div>
                    <h3 className="text-2xl font-semibold mb-2">Message Sent</h3>
                    <p className="text-gray-500">We'll be in touch with you shortly.</p>
                  </div>
                ) : (
                  <>
                    <p className="text-gray-500 mb-10 text-sm leading-relaxed">
                      Fill out the details below and we'll orchestrate a demo for your space.
                    </p>

                    <form className="flex flex-col gap-6" onSubmit={handleEmailSubmit}>
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Name</label>
                        <input
                          type="text"
                          required
                          value={formState.name}
                          onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                          placeholder="Your name"
                          className="w-full pb-3 border-b border-gray-200 outline-none focus:border-[#2c6bde] transition-colors bg-transparent placeholder:text-gray-300"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Email</label>
                        <input
                          type="email"
                          required
                          value={formState.email}
                          onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                          placeholder="name@company.com"
                          className="w-full pb-3 border-b border-gray-200 outline-none focus:border-[#2c6bde] transition-colors bg-transparent placeholder:text-gray-300"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Company</label>
                        <input
                          type="text"
                          value={formState.company}
                          onChange={(e) => setFormState({ ...formState, company: e.target.value })}
                          placeholder="Company name"
                          className="w-full pb-3 border-b border-gray-200 outline-none focus:border-[#2c6bde] transition-colors bg-transparent placeholder:text-gray-300"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Message</label>
                        <textarea
                          rows={4}
                          value={formState.message}
                          onChange={(e) => setFormState({ ...formState, message: e.target.value })}
                          placeholder="How can we help?"
                          className="w-full py-3 border-b border-gray-200 outline-none focus:border-[#2c6bde] transition-colors bg-transparent placeholder:text-gray-300 resize-none"
                        />
                      </div>

                      {formStatus === "error" && (
                        <div className="text-red-500 text-sm mt-2">Failed to send message. Please try again.</div>
                      )}

                      <motion.button
                        disabled={formStatus === "loading"}
                        whileHover={formStatus !== "loading" ? { scale: 1.02 } : {}}
                        whileTap={formStatus !== "loading" ? { scale: 0.98 } : {}}
                        className={`mt-6 w-full py-4 rounded-full text-white font-semibold text-sm shadow-md flex justify-center items-center gap-2 ${formStatus === "loading" ? "opacity-70" : ""}`}
                        style={{ background: "#2c6bde" }}
                      >
                        {formStatus === "loading" ? "Sending..." : "Submit Request"}
                      </motion.button>
                    </form>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ───────── Navigation ───────── */}
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1, ease: EASE }}
        className="fixed top-0 left-0 right-0 z-50 px-6 md:px-10 py-5"
        style={{
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          background: "rgba(244, 244, 244, 0.75)",
          borderBottom: "1px solid rgba(0, 0, 0, 0.04)",
        }}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <motion.a
            href="#"
            className="flex items-center gap-2.5"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={SPRING}
          >
            <img
              src={logoImg}
              alt="Occulo"
              className="h-8 w-8 rounded-lg object-cover"
              style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
            />
            <span
              className="text-[1.05rem] font-semibold tracking-tight"
              style={{ color: "#2c6bde" }}
            >
              Occulo
            </span>
          </motion.a>

          <motion.button
            onClick={() => setIsContactOpen(true)}
            whileHover={{ scale: 1.05, backgroundColor: "#2459c0" }}
            whileTap={{ scale: 0.95 }}
            transition={SPRING}
            className="px-6 py-2.5 rounded-full text-[13px] font-medium text-white shadow-sm cursor-pointer"
            style={{ background: "#2c6bde" }}
          >
            Request Demo
          </motion.button>
        </div>
      </motion.nav>

      {/* ───────── Hero ───────── */}
      <section
        ref={heroRef}
        className="relative min-h-screen flex items-center justify-center px-6 md:px-10 overflow-hidden"
        style={{ background: "#2c6bde" }}
      >
        <motion.div
          className="max-w-4xl mx-auto text-center text-white pt-24 relative z-10"
          style={{ y: heroY, opacity: heroOpacity }}
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={fadeUp}>
            <img
              src={heroLogo}
              alt="Occulo"
              className="w-[85%] max-w-[20rem] md:max-w-[28rem] h-auto object-contain object-center mx-auto mb-0 pointer-events-none drop-shadow-xl relative z-20"
            />
          </motion.div>

          <motion.h1
            variants={fadeUp}
            className="-mt-4 md:-mt-10 relative z-10"
            style={{
              fontSize: "clamp(2.8rem, 6vw, 5.5rem)",
              lineHeight: 1.05,
              letterSpacing: "-0.04em",
              fontWeight: 600,
            }}
          >
            The Space Between.
            <br />
            <span style={{ opacity: 0.85 }}>Orchestrated.</span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="text-lg md:text-[1.35rem] max-w-2xl mx-auto mt-8 mb-14"
            style={{ color: "rgba(255,255,255,0.75)", lineHeight: 1.6, fontWeight: 400 }}
          >
            AI-powered spatial intelligence that makes buildings smarter,
            safer, and more efficient&nbsp;— invisibly.
          </motion.p>

          <motion.div variants={fadeUp}>
            <motion.button
              onClick={() => setIsContactOpen(true)}
              whileHover={{ scale: 1.04, boxShadow: "0 20px 40px rgba(0,0,0,0.15)" }}
              whileTap={{ scale: 0.96 }}
              transition={SPRING}
              className="inline-flex items-center gap-2 px-9 py-4 rounded-full text-[15px] font-semibold active:opacity-90 relative z-10 shadow-xl cursor-pointer"
              style={{ background: "#fff", color: "#2c6bde" }}
            >
              Request Demo
              <motion.div
                initial={{ x: 0 }}
                whileHover={{ x: 4 }}
                transition={SPRING}
              >
                <ArrowRight size={18} />
              </motion.div>
            </motion.button>
          </motion.div>
        </motion.div>

        {/* Ambient grain / subtle glow in background */}
        <div
          className="absolute inset-0 pointer-events-none opacity-40 mix-blend-overlay"
          style={{
            background: "radial-gradient(circle at 50% 0%, rgba(255,255,255,0.4) 0%, transparent 70%)"
          }}
        />

        {/* Scroll hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2, duration: 1.5 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 12, 0], opacity: [0.3, 0.8, 0.3] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            className="w-px h-14"
            style={{
              background: "linear-gradient(180deg, transparent, rgba(255,255,255,0.8), transparent)",
            }}
          />
        </motion.div>
      </section>

      {/* ───────── The Problem ───────── */}
      <section className="py-32 md:py-48 px-6 md:px-10" style={{ background: "#f4f4f4" }}>
        <motion.div
          className="max-w-5xl mx-auto"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-10%" }}
        >
          <motion.div variants={fadeUp} className="text-center mb-20 md:mb-28">
            <p
              className="text-[11px] font-bold tracking-[0.25em] uppercase mb-6"
              style={{ color: "#2c6bde" }}
            >
              The Problem
            </p>
            <h2
              className="text-4xl md:text-6xl font-semibold mb-6"
              style={{ letterSpacing: "-0.035em" }}
            >
              Buildings are blind.
            </h2>
            <p
              className="text-lg md:text-xl max-w-3xl mx-auto"
              style={{ color: "#666", lineHeight: 1.6 }}
            >
              Elevators waste capacity. Lobbies overcrowd silently. Spaces are
              mismanaged because they can't see themselves. Existing solutions are
              invasive, expensive, and take months to deploy.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                stat: "40%",
                label: "Elevator capacity wasted",
                desc: "Due to zero real-time occupancy data",
              },
              {
                stat: "95%",
                label: "Spaces lack awareness",
                desc: "No intelligent feedback loop exists",
              },
              {
                stat: "6–12 mo",
                label: "Legacy deployments",
                desc: "Before a single insight is generated",
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                custom={i}
                variants={{
                  hidden: { opacity: 0, x: 250, y: 50, rotate: 15, scale: 0.85 },
                  visible: {
                    opacity: 1, x: 0, y: 0, rotate: 0, scale: 1,
                    transition: { type: "spring", damping: 18, stiffness: 75, delay: i * 0.15 }
                  }
                }}
                whileHover={{ y: -8, boxShadow: "0 20px 40px rgba(0,0,0,0.06)", scale: 1.02 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className="p-8 md:p-10 rounded-3xl bg-white"
                style={{
                  border: "1px solid rgba(0,0,0,0.03)",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.02)",
                }}
              >
                <div
                  className="text-4xl md:text-5xl font-bold mb-4"
                  style={{ color: "#2c6bde", letterSpacing: "-0.03em" }}
                >
                  {item.stat}
                </div>
                <div className="text-[15px] font-semibold text-[#111] mb-2 leading-snug">
                  {item.label}
                </div>
                <div className="text-[14px]" style={{ color: "#888", lineHeight: 1.5 }}>
                  {item.desc}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ───────── What We Build ───────── */}
      <section className="py-32 md:py-48 px-6 md:px-10 overflow-hidden" style={{ background: "#fff" }}>
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-20 lg:gap-24 items-center">
            {/* Text side */}
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-10%" }}
            >
              <motion.p
                variants={fadeUp}
                className="text-[11px] font-bold tracking-[0.25em] uppercase mb-6"
                style={{ color: "#2c6bde" }}
              >
                What We Build
              </motion.p>
              <motion.h2
                variants={fadeUp}
                className="text-4xl md:text-[3.2rem] font-semibold mb-8"
                style={{ letterSpacing: "-0.035em", lineHeight: 1.1 }}
              >
                Invisible infrastructure
                <br />
                for spatial intelligence.
              </motion.h2>
              <motion.p
                variants={fadeUp}
                className="text-lg md:text-xl mb-12"
                style={{ color: "#666", lineHeight: 1.6 }}
              >
                Occulo deploys AI-powered edge sensors that detect occupancy in
                real-time with 95%+ accuracy. No wearables. No
                disruption. Plug in, calibrate, and let the space orchestrate
                itself.
              </motion.p>

              <div className="flex flex-col gap-6">
                {[
                  { icon: Eye, text: "95%+ detection accuracy in dynamic environments" },
                  { icon: Zap, text: "Deploy in hours, not months — true plug-and-play" },
                  { icon: Shield, text: "Privacy-first design — no cloud, no facial recognition" },
                ].map(({ icon: Icon, text }, i) => (
                  <motion.div
                    key={i}
                    variants={fadeUp}
                    className="flex items-start gap-4"
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: "rgba(44,107,222,0.06)" }}
                    >
                      <Icon size={18} style={{ color: "#2c6bde" }} />
                    </div>
                    <span className="text-[16px] leading-relaxed" style={{ color: "#444" }}>
                      {text}
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Live simulation */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, x: 20 }}
              whileInView={{ opacity: 1, scale: 1, x: 0 }}
              viewport={{ once: true, margin: "-10%" }}
              transition={{ duration: 1.4, ease: EASE }}
              className="relative"
            >
              <div className="absolute inset-0 bg-[#2c6bde] opacity-5 blur-3xl rounded-full transform scale-110" />
              <OccupancySimulation />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ───────── Why Occulo / USP ───────── */}
      <section className="py-32 md:py-48 px-6 md:px-10 overflow-hidden relative" style={{ background: "#2c6bde" }}>
        {/* Subtle background decoration */}
        <div className="absolute top-0 right-0 w-full h-full overflow-hidden pointer-events-none">
          <motion.div
            className="absolute -right-[20%] -top-[20%] w-[60%] h-[100%] rounded-full bg-white opacity-5 blur-[120px]"
            animate={{ scale: [1, 1.1, 1], rotate: [0, 5, 0] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          />
        </div>

        <motion.div
          className="max-w-5xl mx-auto text-white relative z-10"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-10%" }}
        >
          <motion.div variants={fadeUp} className="text-center mb-20 md:mb-28">
            <p className="text-[11px] font-bold tracking-[0.25em] uppercase mb-6 text-white/50">
              Why Occulo
            </p>
            <h2
              className="text-4xl md:text-6xl font-semibold mb-6"
              style={{ letterSpacing: "-0.035em" }}
            >
              Built different. Deployed faster.
            </h2>
            <p
              className="text-lg md:text-xl max-w-2xl mx-auto text-white/70"
              style={{ lineHeight: 1.6 }}
            >
              Where others take months and millions, Occulo takes hours and a
              fraction of the cost.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: "Plug & Play",
                desc: "No rewiring. No construction. Attaches to existing infrastructure and goes live in under 4 hours.",
              },
              {
                title: "Edge AI",
                desc: "All processing happens on-device. Zero cloud dependency. Real-time decisions at the edge, always.",
              },
              {
                title: "Platform Agnostic",
                desc: "Works with any BMS. Integrates via open APIs. No vendor lock-in — ever.",
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                whileHover={{ y: -8, backgroundColor: "rgba(255,255,255,0.06)" }}
                transition={SPRING}
                className="p-8 md:p-10 rounded-3xl"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  backdropFilter: "blur(10px)",
                }}
              >
                <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                <p
                  className="text-[15px]"
                  style={{ color: "rgba(255,255,255,0.6)", lineHeight: 1.6 }}
                >
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ───────── Industries ───────── */}
      <section className="py-28 md:py-40 px-6 md:px-10" style={{ background: "#f4f4f4" }}>
        <motion.div
          className="max-w-4xl mx-auto text-center"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-10%" }}
        >
          <motion.div variants={fadeUp}>
            <p
              className="text-[11px] font-bold tracking-[0.25em] uppercase mb-4"
              style={{ color: "#2c6bde" }}
            >
              Industries
            </p>
            <h2
              className="text-3xl md:text-5xl font-semibold mb-16"
              style={{ letterSpacing: "-0.03em" }}
            >
              Any space. Any scale.
            </h2>
          </motion.div>

          <div className="flex flex-wrap justify-center gap-4 md:gap-5">
            {[
              "Corporate Offices",
              "Airports & Transit",
              "Retail & Malls",
              "Healthcare",
            ].map((industry, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                whileHover={{ scale: 1.03, y: -2 }}
                transition={SPRING}
                className="py-4 px-6 rounded-full bg-white shadow-sm"
                style={{ border: "1px solid rgba(0,0,0,0.04)" }}
              >
                <span className="text-[15px] font-medium" style={{ color: "#333" }}>
                  {industry}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ───────── CTA / Footer ───────── */}
      <section
        id="contact"
        className="pt-32 md:pt-48 pb-10 px-6 md:px-10"
        style={{ background: "#0a0a0a" }}
      >
        <motion.div
          className="max-w-4xl mx-auto text-center"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-10%" }}
        >
          <motion.h2
            variants={fadeUp}
            className="text-5xl md:text-[4.5rem] font-semibold text-white mb-6"
            style={{ letterSpacing: "-0.035em", lineHeight: 1.05 }}
          >
            Ready to orchestrate
            <br />
            your space?
          </motion.h2>
          <motion.p
            variants={fadeUp}
            className="text-lg md:text-xl text-white/40 mb-16"
            style={{ lineHeight: 1.6 }}
          >
            Join the buildings that already think for themselves.
          </motion.p>

          <motion.div variants={fadeUp} className="mb-24">
            <motion.button
              onClick={() => setIsContactOpen(true)}
              whileHover={{ scale: 1.04, boxShadow: "0 0 40px rgba(44,107,222,0.4)" }}
              whileTap={{ scale: 0.96 }}
              transition={SPRING}
              className="inline-flex items-center gap-2 px-10 py-4 rounded-full text-[15px] font-semibold text-white cursor-pointer"
              style={{ background: "#2c6bde" }}
            >
              Get in Touch
              <ArrowRight size={18} />
            </motion.button>
          </motion.div>

          {/* Unified Footer bar */}
          <motion.div
            variants={fadeUp}
            className="pt-8 mt-12 flex flex-col md:flex-row items-center justify-between gap-8 md:gap-6"
            style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
          >
            {/* Left side: branding & copyright */}
            <div className="flex flex-col md:flex-row items-center gap-4 md:gap-5">
              <div className="flex items-center gap-2.5 opacity-50 hover:opacity-100 transition-opacity cursor-pointer">
                <img
                  src={logoImg}
                  alt="Occulo"
                  className="h-6 w-6 rounded border border-white/10"
                />
                <span className="text-sm font-medium text-white">
                  Occulo
                </span>
              </div>
              <span className="hidden md:block w-1 h-1 rounded-full bg-white/20" />
              <span className="text-[13px] text-white/30 font-medium text-center md:text-left">
                © {new Date().getFullYear()} Occulo. All rights reserved.
              </span>
            </div>

            {/* Right side: contact links */}
            <div className="flex items-center gap-6 text-[13px] font-medium text-white/50">
              <a href="tel:+917483651130" className="hover:text-white transition-colors">
                +91 7483651130
              </a>
              <a href="mailto:contact@occulo.co" className="hover:text-white transition-colors">
                contact@occulo.co
              </a>
              <a href="https://www.linkedin.com/company/occulopvtltd/" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">
                LinkedIn
              </a>
            </div>
          </motion.div>
        </motion.div>
      </section>
    </div>
  );
}