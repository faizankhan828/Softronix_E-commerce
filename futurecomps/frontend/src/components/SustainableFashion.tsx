import { motion } from "framer-motion";

const sustainableFeatures = [
  "100% Quality Products",
  "Eco-friendly Packaging",
  "Fair Trade Certified",
  "Carbon Neutral Shipping",
];

export function SustainableFashion() {
  return (
    <section className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto bg-white dark:bg-gray-900">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10 lg:gap-12 items-center">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="order-2 lg:order-1"
        >
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6 text-gray-900 dark:text-white">
            Sustainable Shopping for a Better Tomorrow
          </h2>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-6 sm:mb-8 leading-relaxed">
            We're committed to providing high-quality products that are
            made to last. Our sustainable practices include using eco-friendly
            materials, ethical sourcing, and reducing waste at every stage.
          </p>
          <ul className="space-y-3 sm:space-y-4 mb-6 sm:mb-8 text-sm sm:text-base text-gray-800 dark:text-gray-300">
            {sustainableFeatures.map((feature, idx) => (
              <li key={idx} className="flex items-center gap-3">
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center text-green-800 dark:text-green-300 text-xs sm:text-sm flex-shrink-0">
                  ✓
                </div>
                <span className="flex-1">{feature}</span>
              </li>
            ))}
          </ul>
          <button className="bg-black dark:bg-gray-800 text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-full hover:bg-neutral-800 dark:hover:bg-gray-700 transition-colors text-sm sm:text-base">
            Learn More About Our Mission
          </button>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="rounded-lg overflow-hidden shadow-md order-1 lg:order-2"
        >
          <img
            src="https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=1000"
            alt="Sustainable Shopping"
            className="w-full h-auto object-cover aspect-[4/3] sm:aspect-[16/10] lg:aspect-auto"
          />
        </motion.div>
      </div>
    </section>
  );
}
