import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const categories = [
  {
    name: "Electronics",
    image: "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=500",
    count: 42,
    color: "from-blue-500/20 to-blue-600/20",
  },
  {
    name: "Clothing",
    image: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=500",
    count: 156,
    color: "from-pink-500/20 to-pink-600/20",
  },
  {
    name: "Home & Garden",
    image: "https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=500",
    count: 89,
    color: "from-green-500/20 to-green-600/20",
  },
  {
    name: "Sports",
    image: "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=500",
    count: 67,
    color: "from-orange-500/20 to-orange-600/20",
  },
];

export function Categories() {
  return (
    <section className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto bg-gray-50 dark:bg-gray-900/50">
      <div className="text-center mb-10">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          Shop by Category
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          Browse our wide selection of products
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {categories.map((category, index) => (
          <motion.div
            key={category.name}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
          >
            <Link
              to={`/shop?category=${category.name.toLowerCase()}`}
              className="group block relative aspect-[4/3] rounded-2xl overflow-hidden"
            >
              <img
                src={category.image}
                alt={category.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <h3 className="text-xl font-bold mb-1">{category.name}</h3>
                <p className="text-white/80 text-sm">{category.count} products</p>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
