export default function Newsletter() {
  return (
    <section className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto bg-white dark:bg-gray-900">
      <div className="text-center max-w-2xl mx-auto">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4 text-gray-900 dark:text-white">
          Join Our Community
        </h2>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-6 sm:mb-8 leading-relaxed px-4 sm:px-0">
          Subscribe to our newsletter and be the first to know about new
          collections, exclusive offers and fashion inspiration.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto px-4 sm:px-0">
          <input
            type="email"
            placeholder="Your email address"
            className="flex-grow px-4 py-2.5 sm:py-3 border border-gray-300 dark:border-gray-700 rounded-full focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-gray-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 text-sm sm:text-base"
          />
          <button className="bg-black dark:bg-gray-800 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-full hover:bg-neutral-800 dark:hover:bg-gray-700 transition-colors whitespace-nowrap text-sm sm:text-base">
            Subscribe
          </button>
        </div>
      </div>
    </section>
  );
}
