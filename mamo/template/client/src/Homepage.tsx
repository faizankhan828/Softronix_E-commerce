import NewArrivals from "./components/NewArrivals";
import Categories from "./components/Categories";
import SustainableFashion from "./components/SustainableFashion";
import ShopBenefits from "./components/ShopBenefits";
import Newsletter from "./components/Newsletter";
import Carousel from "./components/Carousel";

function Homepage() {
  return (
    <div className="bg-white dark:bg-gray-900">
      {/* Hero Carousel */}
      <section className="relative">
        <Carousel />
      </section>

      {/* New Arrivals Section */}
      <NewArrivals />

      {/* Categories Section */}
      <Categories />

      {/* Sustainable Fashion Section */}
      <SustainableFashion />

      {/* Shop Benefits */}
      <ShopBenefits />

      {/* Newsletter Signup */}
      <Newsletter />
    </div>
  );
}

export default Homepage;
