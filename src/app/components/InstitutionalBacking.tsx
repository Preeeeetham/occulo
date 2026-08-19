import { motion } from "motion/react";

interface PillarItem {
  name: string;
  logo: string;
  alt: string;
  imgClass: string;
}

interface Pillar {
  category: string;
  items: PillarItem[];
}

const pillars: Pillar[] = [
  {
    category: "Accelerated by",
    items: [
      {
        name: "Cisco",
        logo: "https://assets.occulo.co/cisco-logo.png",
        alt: "Cisco",
        imgClass: "h-7 md:h-8 max-w-[105px] md:max-w-[125px] w-auto",
      },
      {
        name: "NASSCOM",
        logo: "https://assets.occulo.co/nasscom-logo.png",
        alt: "NASSCOM",
        imgClass: "h-5 md:h-5.5 max-w-[115px] md:max-w-[135px] w-auto",
      },
    ],
  },
  {
    category: "Recognised by",
    items: [
      {
        name: "DPIIT",
        logo: "https://assets.occulo.co/dpiit-startup-india-logo.png",
        alt: "DPIIT - Department for Promotion of Industry and Internal Trade",
        imgClass: "h-8 md:h-9 max-w-[125px] md:max-w-[150px] w-auto",
      },
      {
        name: "Ministry of MSME",
        logo: "https://assets.occulo.co/msme-logo.png",
        alt: "Ministry of MSME, Govt. of India",
        imgClass: "h-8 md:h-9 max-w-[115px] md:max-w-[135px] w-auto",
      },
    ],
  },
  {
    category: "Part of",
    items: [
      {
        name: "Google for Startups",
        logo: "https://assets.occulo.co/gfs-logo.png",
        alt: "Google for Startups",
        imgClass: "h-9 md:h-11 max-w-[115px] md:max-w-[135px] w-auto",
      },
    ],
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
      staggerChildren: 0.1,
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
    <section className="w-full bg-[#fbfbfd] border-b border-black/[0.06] py-10 md:py-12 px-4 sm:px-6 md:px-8 relative z-20">
      <div className="max-w-6xl mx-auto">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-5%" }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-0 items-center md:divide-x divide-black/[0.06]"
        >
          {pillars.map((pillar) => (
            <motion.div
              key={pillar.category}
              variants={itemVariants}
              whileHover={{ y: -2 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="flex flex-col items-center justify-center text-center group px-4 sm:px-6 lg:px-10 w-full"
            >
              <span className="text-[10px] md:text-[11px] font-bold tracking-[0.2em] uppercase text-gray-400 mb-3 group-hover:text-[#2c6bde] transition-colors duration-200 select-none">
                {pillar.category}
              </span>

              <div className="h-14 md:h-16 w-full flex items-center justify-center gap-6 md:gap-8">
                {pillar.items.map((item) => (
                  <div key={item.name} className="flex items-center justify-center">
                    <img
                      src={item.logo}
                      alt={item.alt}
                      className={`object-contain transition-transform duration-300 hover:scale-105 ${item.imgClass}`}
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
