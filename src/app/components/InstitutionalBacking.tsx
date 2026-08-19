import { motion } from "motion/react";

interface CredentialItem {
  category: string;
  name: string;
  logo: string;
  alt: string;
  imgClass: string;
}

const credentials: CredentialItem[] = [
  {
    category: "Accelerated by",
    name: "Cisco",
    logo: "https://assets.occulo.co/cisco-logo.png",
    alt: "Cisco",
    imgClass: "h-10 md:h-12 max-w-[150px] md:max-w-[175px] w-auto",
  },
  {
    category: "Recognised by",
    name: "DPIIT",
    logo: "https://assets.occulo.co/dpiit-startup-india-logo.png",
    alt: "DPIIT - Department for Promotion of Industry and Internal Trade",
    imgClass: "h-11 md:h-13 max-w-[190px] md:max-w-[230px] w-auto",
  },
  {
    category: "Recognised by",
    name: "Ministry of MSME",
    logo: "https://assets.occulo.co/msme-logo.png",
    alt: "Ministry of MSME, Govt. of India",
    imgClass: "h-10 md:h-12 max-w-[160px] md:max-w-[190px] w-auto",
  },
  {
    category: "Part of",
    name: "Global Forum for Startups",
    logo: "https://assets.occulo.co/gfs-logo.png",
    alt: "GFS - Global Forum for Startups",
    imgClass: "h-11 md:h-13 max-w-[120px] md:max-w-[145px] w-auto",
  },
];

const containerVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.16, 1, 0.3, 1],
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  },
};

export function InstitutionalBacking() {
  return (
    <section className="w-full bg-[#fbfbfd] border-b border-black/[0.06] py-10 md:py-14 px-6 md:px-10 relative z-20">
      <div className="max-w-6xl mx-auto">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-5%" }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12 items-center divide-y lg:divide-y-0 lg:divide-x divide-black/[0.06]"
        >
          {credentials.map((item, idx) => (
            <motion.div
              key={item.name}
              variants={itemVariants}
              whileHover={{ y: -2 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className={`flex flex-col items-center justify-center text-center group ${
                idx > 0 ? "pt-6 lg:pt-0" : ""
              } ${idx > 0 ? "lg:pl-8" : ""}`}
            >
              <span className="text-[10px] md:text-[11px] font-bold tracking-[0.22em] uppercase text-gray-400 mb-3.5 group-hover:text-[#2c6bde] transition-colors duration-200 select-none">
                {item.category}
              </span>

              <div className="h-14 md:h-16 w-full flex items-center justify-center px-4">
                <img
                  src={item.logo}
                  alt={item.alt}
                  className={`object-contain transition-transform duration-300 group-hover:scale-105 ${item.imgClass}`}
                  loading="lazy"
                />
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
