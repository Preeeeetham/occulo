import { motion, useScroll, useTransform, AnimatePresence } from "motion/react";
import { useRef, useState } from "react";
import logoImg from "../imports/image.png";
import heroLogo from "../imports/1.svg";
import RLT from "../imports/RLT.png";
import SLT from "../imports/SLT.png";
import dashboardImg from "../imports/occulo_saas.png";
import {
  Shield,
  Zap,
  Eye,
  ArrowRight,
  X,
  Phone,
  Mail,
  Linkedin,
  Building2,
  Users,
} from "lucide-react";
import { OccupancySimulation } from "./components/OccupancySimulation";
import { EfficiencySlider } from "./components/EfficiencySlider";
import { Hero3DVisualization } from "./components/Hero3DVisualization";
import { StrategicPartners } from "./components/StrategicPartners";

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

type InquiryType = "demo" | "general" | "b2b" | "b2c";

const problemCards = [
  {
    title: "Weight-based legacy systems",
    label: "Old signal, limited view",
    desc: "Traditional weight sensors can tell you load, but not how people are moving through a space.",
  },
  {
    title: "Slow operational feedback",
    label: "Bottlenecks show up late",
    desc: "By the time a building reacts, passengers already feel the congestion.",
  },
  {
    title: "High retrofit friction",
    label: "More setup than insight",
    desc: "Legacy systems require excessive coordination and downtime for installation.",
  },
];

const howItWorksSteps = [
  {
    step: "01",
    title: "Sense the space",
    desc: "Observing occupancy patterns without disrupting building operations.",
  },
  {
    step: "02",
    title: "Interpret locally",
    desc: "Edge processing for fast, privacy-conscious spatial analysis.",
  },
  {
    step: "03",
    title: "Return a usable signal",
    desc: "Actionable data for elevator flow and safety management.",
  },
];

const featureCards = [
  {
    icon: Eye,
    title: "Real-time space occupancy detection",
    desc: "Built to turn raw spatial activity into data-driven control decisions.",
  },
  {
    icon: Shield,
    title: "Overcrowding prevention and safety control",
    desc: "Designed to help reduce unsafe passenger density before the space becomes uncomfortable or inefficient.",
  },
  {
    icon: Zap,
    title: "Plug-and-play retrofit integration",
    desc: "A retrofit-first approach that avoids infrastructure-heavy changes and keeps deployment simple.",
  },
];

const validationCards = [
  {
    label: "TRL 7",
    desc: "SPADES has reached live demonstration stage in operational environments.",
  },
  {
    label: "MRL 8",
    desc: "Manufacturing processes have moved beyond lab-only intent and into buildable form.",
  },
  {
    label: "95% Accuracy",
    desc: "SPADES demonstrated this result in field testing under real-world conditions.",
  },
];

const audienceCards = [
  {
    icon: Building2,
    title: "B2B",
    desc: "For elevator OEMs, service providers, facility managers, developers, and system integrators.",
    cta: "I am a business",
    inquiry: "b2b" as InquiryType,
  },
  {
    icon: Users,
    title: "B2C",
    desc: "For residential communities, private building owners, and individual stakeholders.",
    cta: "I am a consumer",
    inquiry: "b2c" as InquiryType,
  },
];

export default function App() {
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [formState, setFormState] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    inquiry: "general" as InquiryType,
    message: "",
  });
  const [formStatus, setFormStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const openContact = (inquiry: InquiryType) => {
    setFormState((prev) => ({
      ...prev,
      inquiry,
      ...(inquiry === "b2c" ? { company: "", phone: "" } : {}),
    }));
    setIsContactOpen(true);
  };

  const inquiryMeta = {
    demo: {
      title: "Request a demo",
      subtitle: "Show us your space and we’ll route the right conversation.",
      showCompany: true,
      showPhone: true,
      companyRequired: false,
      phoneRequired: false,
    },
    general: {
      title: "Get in touch",
      subtitle: "Tell us what you want to explore and we’ll route it correctly.",
      showCompany: true,
      showPhone: false,
      companyRequired: false,
      phoneRequired: false,
    },
    b2b: {
      title: "Business inquiry",
      subtitle: "For partnerships, pilots, OEMs, and building operators.",
      showCompany: true,
      showPhone: true,
      companyRequired: true,
      phoneRequired: true,
    },
    b2c: {
      title: "Consumer inquiry",
      subtitle: "For individual stakeholders and residential deployments.",
      showCompany: false,
      showPhone: false,
      companyRequired: false,
      phoneRequired: false,
    },
  } satisfies Record<InquiryType, {
    title: string;
    subtitle: string;
    showCompany: boolean;
    showPhone: boolean;
    companyRequired: boolean;
    phoneRequired: boolean;
  }>;

  const scrollToContact = () => {
    document.getElementById("contact")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleEmailSubmit = async (e: FormEvent<HTMLFormElement>) => {
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
            phone: formState.phone,
            company: formState.company,
            inquiry_type: formState.inquiry,
            message: formState.message,
          },
        }),
      });

      if (res.ok) {
        setFormStatus("success");
        setTimeout(() => {
          setIsContactOpen(false);
          setFormStatus("idle");
          setFormState({ name: "", email: "", phone: "", company: "", inquiry: "general", message: "" });
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
  const heroRef = useRef<HTMLElement | null>(null);
  const { scrollYProgress: heroScroll } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  const heroY = useTransform(heroScroll, [0, 1], [0, 160]);
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

                <h3 className="text-3xl font-semibold mb-2" style={{ letterSpacing: "-0.03em" }}>
                  {inquiryMeta[formState.inquiry].title}
                </h3>
                {formStatus === "success" ? (
                  <div className="flex flex-col items-center justify-center h-full text-center py-20">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
                      <Zap size={24} color="#10b981" />
                    </div>
                    <h3 className="text-2xl font-semibold mb-2">Message sent</h3>
                    <p className="text-gray-500">We’ll be in touch with you shortly.</p>
                  </div>
                ) : (
                  <>
                    <p className="text-gray-500 mb-10 text-sm leading-relaxed">
                      {inquiryMeta[formState.inquiry].subtitle}
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

                      {inquiryMeta[formState.inquiry].showPhone && (
                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                            Phone
                          </label>
                          <input
                            type="tel"
                            required={inquiryMeta[formState.inquiry].phoneRequired}
                            value={formState.phone}
                            onChange={(e) => setFormState({ ...formState, phone: e.target.value })}
                            placeholder="+91 ..."
                            className="w-full pb-3 border-b border-gray-200 outline-none focus:border-[#2c6bde] transition-colors bg-transparent placeholder:text-gray-300"
                          />
                        </div>
                      )}

                      {inquiryMeta[formState.inquiry].showCompany && (
                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                            Company{inquiryMeta[formState.inquiry].companyRequired ? " *" : ""}
                          </label>
                          <input
                            type="text"
                            required={inquiryMeta[formState.inquiry].companyRequired}
                            value={formState.company}
                            onChange={(e) => setFormState({ ...formState, company: e.target.value })}
                            placeholder={formState.inquiry === "b2b" ? "Company name" : "Organization name"}
                            className="w-full pb-3 border-b border-gray-200 outline-none focus:border-[#2c6bde] transition-colors bg-transparent placeholder:text-gray-300"
                          />
                        </div>
                      )}

                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Message</label>
                        <textarea
                          rows={4}
                          value={formState.message}
                          onChange={(e) => setFormState({ ...formState, message: e.target.value })}
                          placeholder="Tell us what you want to explore."
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
                        {formStatus === "loading" ? "Sending..." : "Submit request"}
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
              className="h-8 w-8 object-contain"
            />
            <span
              className="text-[1.05rem] font-semibold tracking-tight"
              style={{ color: "#2c6bde" }}
            >
              Occulo
            </span>
          </motion.a>

          <motion.button
            onClick={scrollToContact}
            whileHover={{ scale: 1.05, backgroundColor: "#2459c0" }}
            whileTap={{ scale: 0.95 }}
            transition={SPRING}
            className="px-6 py-2.5 rounded-full text-[13px] font-medium text-white shadow-sm cursor-pointer"
            style={{ background: "#2c6bde" }}
          >
            Contact
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


          <motion.div variants={fadeUp} className="mb-0">
            <img
              src={heroLogo}
              alt="Occulo"
              className="w-[85%] max-w-[20rem] md:max-w-[28rem] h-auto object-contain object-center mx-auto pointer-events-none relative z-20"
              style={{ mixBlendMode: "plus-lighter" }}
            />
          </motion.div>

          <motion.p
            variants={fadeUp}
            className="text-[11px] font-bold tracking-[0.3em] uppercase -mt-32 mb-8 text-white/70 relative z-30"
          >
            AI-powered spatial intelligence for smarter buildings
          </motion.p>

<motion.h1
  variants={fadeUp}
  className="relative z-10 text-center text-white"
  style={{
    fontSize: "clamp(2rem, 4.5vw, 4rem)",
    lineHeight: 1.1,
    letterSpacing: "-0.03em",
    fontWeight: 700,
    textWrap: "balance",
    maxWidth: "16ch",
    margin: "0 auto",
  }}
>
  Real-Time Reduction in Elevator Overcrowding & Wait Times
</motion.h1>

          <motion.p
            variants={fadeUp}
            className="text-base md:text-lg max-w-2xl mx-auto mt-8 mb-12"
            style={{ color: "rgba(255,255,255,0.75)", lineHeight: 1.6 }}
          >
            Occulo enables elevators to make decisions based on available space—improving safety and passenger flow without infrastructure changes.
          </motion.p>
        </motion.div>



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
              Elevators are blind.
            </h2>
            <p
              className="text-lg md:text-xl max-w-3xl mx-auto"
              style={{ color: "#666", lineHeight: 1.6 }}
            >
              Elevators waste capacity. Lobbies overcrowd silently. Spaces are mismanaged because they can't see themselves. Currently, legacy systems are outdated and not accurate or efficient.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {problemCards.map((item, i) => (
              <motion.div
                key={item.title}
                variants={{
                  hidden: { opacity: 0, x: 250, y: 50, rotate: 15, scale: 0.85 },
                  visible: {
                    opacity: 1,
                    x: 0,
                    y: 0,
                    rotate: 0,
                    scale: 1,
                    transition: { type: "spring", damping: 18, stiffness: 75, delay: i * 0.15 },
                  },
                }}
                whileHover={{ y: -8, boxShadow: "0 20px 40px rgba(0,0,0,0.06)", scale: 1.02 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className="p-8 md:p-10 rounded-3xl bg-white"
                style={{
                  border: "1px solid rgba(0,0,0,0.03)",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.02)",
                }}
              >
                <div className="text-[11px] font-bold tracking-[0.25em] uppercase mb-4" style={{ color: "#2c6bde" }}>
                  {item.label}
                </div>
                <div className="text-2xl md:text-3xl font-bold mb-4" style={{ letterSpacing: "-0.03em" }}>
                  {item.title}
                </div>
                <div className="text-[14px]" style={{ color: "#666", lineHeight: 1.6 }}>
                  {item.desc}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ───────── How It Works ───────── */}
      <section className="py-32 md:py-48 px-6 md:px-10 overflow-hidden" style={{ background: "#fff" }}>
        <div className="max-w-4xl mx-auto">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-10%" }}
            className="text-center mb-20"
          >
            <motion.p
              variants={fadeUp}
              className="text-[11px] font-bold tracking-[0.25em] uppercase mb-6"
              style={{ color: "#2c6bde" }}
            >
              How It Works
            </motion.p>
            <motion.h2
              variants={fadeUp}
              className="text-4xl md:text-[3.2rem] font-semibold mb-6"
              style={{ letterSpacing: "-0.035em", lineHeight: 1.1 }}
            >
              A brief view of the workflow.
            </motion.h2>
            <motion.p variants={fadeUp} className="text-lg md:text-xl max-w-3xl mx-auto" style={{ color: "#666", lineHeight: 1.6 }}>
              A high-level view of how we turn spatial activity into actionable intelligence.
            </motion.p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {howItWorksSteps.map((item) => (
              <motion.div
                key={item.step}
                variants={fadeUp}
                className="flex flex-col gap-6 p-8 rounded-3xl"
                style={{ background: "#f8f8f8", border: "1px solid rgba(0,0,0,0.04)" }}
                whileHover={{ y: -8, boxShadow: "0 20px 40px rgba(0,0,0,0.04)" }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 font-semibold text-lg"
                  style={{ background: "rgba(44,107,222,0.08)", color: "#2c6bde" }}
                >
                  {item.step}
                </div>
                <div>
                  <div className="text-xl font-semibold mb-3" style={{ letterSpacing: "-0.02em" }}>
                    {item.title}
                  </div>
                  <div className="text-[15px]" style={{ color: "#666", lineHeight: 1.6 }}>
                    {item.desc}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div variants={fadeUp} className="text-center mt-20">
            <motion.button
              onClick={scrollToContact}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-10 py-4 rounded-full text-[15px] font-semibold text-white shadow-lg cursor-pointer"
              style={{ background: "#2c6bde" }}
            >
              Request a pilot
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* ───────── Platform / Dashboard ───────── */}
      <section className="py-32 md:py-48 px-6 md:px-10 overflow-hidden" style={{ background: "#fff" }}>
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
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
              The Platform
            </motion.p>
            <motion.h2
              variants={fadeUp}
              className="text-4xl md:text-5xl font-semibold mb-6"
              style={{ letterSpacing: "-0.035em", lineHeight: 1.1 }}
            >
              Configure. Monitor. Act.
            </motion.h2>
            <motion.p variants={fadeUp} className="text-lg md:text-xl mb-8" style={{ color: "#666", lineHeight: 1.6 }}>
              The SPADES dashboard provides intuitive controls for defining zones, adjusting sensitivity, and monitoring occupancy in real-time.
            </motion.p>
            <motion.ul variants={staggerContainer} className="space-y-4">
              <motion.li variants={fadeUp} className="flex gap-3 text-[15px]" style={{ color: "#555" }}>
                <div className="w-1.5 h-1.5 rounded-full bg-[#2c6bde] mt-2 shrink-0" />
                Define custom regions of interest for each space
              </motion.li>
              <motion.li variants={fadeUp} className="flex gap-3 text-[15px]" style={{ color: "#555" }}>
                <div className="w-1.5 h-1.5 rounded-full bg-[#2c6bde] mt-2 shrink-0" />
                Adjust detection parameters to match your environment
              </motion.li>
              <motion.li variants={fadeUp} className="flex gap-3 text-[15px]" style={{ color: "#555" }}>
                <div className="w-1.5 h-1.5 rounded-full bg-[#2c6bde] mt-2 shrink-0" />
                Real-time occupancy visualization and alerts
              </motion.li>
            </motion.ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: true, margin: "-10%" }}
            transition={{ duration: 1, ease: EASE }}
            className="relative"
          >
            <div className="absolute inset-0 bg-[#2c6bde] opacity-10 blur-3xl rounded-full transform scale-110" />
            <div className="relative overflow-hidden rounded-[2rem] border border-black/5 bg-white shadow-[0_24px_70px_rgba(0,0,0,0.08)]">
              <img
                src={dashboardImg}
                alt="SPADES dashboard interface"
                className="w-full h-auto object-cover"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* ───────── Built Different ───────── */}
      <section className="py-32 md:py-48 px-6 md:px-10 overflow-hidden relative" style={{ background: "#2c6bde" }}>
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
              Built Different
            </p>
            <h2 className="text-4xl md:text-6xl font-semibold mb-6" style={{ letterSpacing: "-0.035em" }}>
              Built different. Deployed faster.
            </h2>
            <p className="text-lg md:text-xl max-w-2xl mx-auto text-white/70" style={{ lineHeight: 1.6 }}>
              Where others can take months and lakhs, Occulo is designed for faster deployment and lower rollout
              friction.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {featureCards.map((item) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.title}
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
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center mb-5"
                    style={{ background: "rgba(255,255,255,0.08)" }}
                  >
                    <Icon size={18} style={{ color: "#fff" }} />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                  <p className="text-[15px]" style={{ color: "rgba(255,255,255,0.7)", lineHeight: 1.6 }}>
                    {item.desc}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </section>

      {/* ───────── Validation ───────── */}
      <section className="py-28 md:py-40 px-6 md:px-10" style={{ background: "#f4f4f4" }}>
        <div className="max-w-6xl mx-auto grid lg:grid-cols-[1.1fr_0.9fr] gap-12 lg:gap-16 items-start">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-10%" }}
          >
            <motion.div variants={fadeUp}>
              <p className="text-[11px] font-bold tracking-[0.25em] uppercase mb-4" style={{ color: "#2c6bde" }}>
                Validation
              </p>
              <h2 className="text-3xl md:text-5xl font-semibold mb-6 max-w-lg" style={{ letterSpacing: "-0.03em" }}>
                Readiness is part of the story.
              </h2>
              <p className="text-lg md:text-xl mb-10 max-w-lg" style={{ color: "#666", lineHeight: 1.6 }}>
                Validated performance in field testing for stakeholder evaluation.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-1 gap-4">
              {validationCards.map((item) => (
                <motion.div
                  key={item.label}
                  variants={fadeUp}
                  className="rounded-3xl bg-white p-6 flex flex-col gap-3"
                  style={{
                    border: "1px solid rgba(0,0,0,0.04)",
                    boxShadow: "0 10px 30px rgba(0,0,0,0.04)",
                  }}
                >
                  <div className="text-xl font-semibold text-[#2c6bde]" style={{ letterSpacing: "-0.02em" }}>
                    {item.label}
                  </div>
                  <div className="text-[14px] max-w-sm" style={{ color: "#666", lineHeight: 1.6 }}>
                    {item.desc}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: true, margin: "-10%" }}
            transition={{ duration: 1, ease: EASE }}
            className="relative flex flex-col gap-6"
          >
            <div className="absolute inset-0 bg-[#2c6bde] opacity-10 blur-3xl rounded-full transform scale-110" />

            <div className="relative overflow-hidden rounded-[2rem] border border-black/5 bg-white shadow-[0_24px_70px_rgba(0,0,0,0.08)]">
              <img
                src={RLT}
                alt="Real-world testing"
                className="w-full h-auto block"
              />
            </div>

            <div className="relative overflow-hidden rounded-[2rem] border border-black/5 bg-white shadow-[0_24px_70px_rgba(0,0,0,0.08)]">
              <img
                src={SLT}
                alt="Simulation testing"
                className="w-full h-auto block"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* ───────── Who It Is For ───────── */}
      <section className="py-28 md:py-40 px-6 md:px-10" style={{ background: "#fff" }}>
        <motion.div
          className="max-w-6xl mx-auto"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-10%" }}
        >
          <motion.div variants={fadeUp} className="text-center mb-16 md:mb-20">
            <p className="text-[11px] font-bold tracking-[0.25em] uppercase mb-4" style={{ color: "#2c6bde" }}>
              Who It Is For
            </p>
            <h2 className="text-3xl md:text-5xl font-semibold mb-6" style={{ letterSpacing: "-0.03em" }}>
              Choose your path.
            </h2>
            <p className="text-lg md:text-xl max-w-2xl mx-auto" style={{ color: "#666", lineHeight: 1.6 }}>
              Direct engagement paths for both enterprise partners and residential stakeholders.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-6">
            {audienceCards.map((item) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.title}
                  variants={fadeUp}
                  className="p-8 md:p-10 rounded-[2rem] bg-[#f8f8f8] h-full"
                  style={{ border: "1px solid rgba(0,0,0,0.05)" }}
                >
                  <div className="flex items-start gap-4 mb-6">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: "rgba(44,107,222,0.08)" }}
                    >
                      <Icon size={20} style={{ color: "#2c6bde" }} />
                    </div>
                    <div>
                      <h3 className="text-2xl font-semibold mb-2" style={{ letterSpacing: "-0.03em" }}>
                        {item.title}
                      </h3>
                      <p className="text-[15px]" style={{ color: "#666", lineHeight: 1.7 }}>
                        {item.desc}
                      </p>
                    </div>
                  </div>

                  <motion.button
                    onClick={() => openContact(item.inquiry)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    transition={SPRING}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full text-[14px] font-semibold text-white cursor-pointer"
                    style={{ background: "#2c6bde" }}
                  >
                    {item.cta}
                    <ArrowRight size={16} />
                  </motion.button>
                  {item.inquiry === "b2b" && (
                    <motion.button
                      onClick={() => openContact("demo")}
                      whileHover={{ scale: 1.02, color: "#2c6bde" }}
                      className="ml-4 text-[13px] font-semibold text-gray-500 hover:text-[#2c6bde] transition-colors"
                    >
                      Partner with us
                    </motion.button>
                  )}
                </motion.div>
              );
            })}
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
          viewport={{ once: true, margin: "0%" }}
        >
          <motion.p
            variants={fadeUp}
            className="text-[11px] font-bold tracking-[0.3em] uppercase mb-8 text-white/40"
          >
          </motion.p>

          <motion.h2
            variants={fadeUp}
            className="text-4xl md:text-[4.5rem] font-semibold text-white mb-8"
            style={{ letterSpacing: "-0.035em", lineHeight: 1.05 }}
          >
            Ready to start
            <br />
            the conversation?
          </motion.h2>

          <motion.p
            variants={fadeUp}
            className="text-lg md:text-xl text-white/50 mb-12 max-w-2xl mx-auto"
            style={{ lineHeight: 1.6 }}
          >
            Tell us what you want to explore and we’ll route it correctly.
          </motion.p>

          <motion.div variants={fadeUp} className="mb-20">
            <motion.button
              onClick={() => openContact("general")}
              whileHover={{ scale: 1.04, boxShadow: "0 0 40px rgba(44,107,222,0.4)" }}
              whileTap={{ scale: 0.96 }}
              transition={SPRING}
              className="inline-flex items-center gap-2 px-10 py-4 rounded-full text-[15px] font-semibold text-white cursor-pointer"
              style={{ background: "#2c6bde" }}
            >
              Contact us
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
                  className="h-6 w-6"
                />
                <span className="text-sm font-medium text-white">Occulo</span>
              </div>
              <span className="hidden md:block w-1 h-1 rounded-full bg-white/20" />
              <span className="text-[13px] text-white/30 font-medium text-center md:text-left">
                © {new Date().getFullYear()} Occulo. All rights reserved.
              </span>
            </div>

            {/* Right side: contact links */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-[13px] font-medium text-white/50">
              <a href="tel:+917483651130" className="hover:text-white transition-colors inline-flex items-center gap-2">
                <Phone size={14} />
                +91 7483651130
              </a>
              <a href="mailto:contact@occulo.co" className="hover:text-white transition-colors inline-flex items-center gap-2">
                <Mail size={14} />
                contact@occulo.co
              </a>
              <a
                href="https://www.linkedin.com/company/occulopvtltd/"
                target="_blank"
                rel="noreferrer"
                className="hover:text-white transition-colors inline-flex items-center gap-2"
              >
                <Linkedin size={14} />
                LinkedIn
              </a>
            </div>
          </motion.div>
        </motion.div>
      </section>
    </div>
  );
}
