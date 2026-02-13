import { MainLayout } from "@/components/layout/MainLayout";
import BoundaryCarousel from "@/components/Carousel";
import { NewArrivals } from "@/components/NewArrivals";
import { Categories } from "@/components/Categories";
import { SustainableFashion } from "@/components/SustainableFashion";
import { ShopBenefits } from "@/components/ShopBenefits";
import Newsletter from "@/components/Newsletter";

export function Storefront() {
  return (
    <MainLayout>
      <div className="bg-white dark:bg-gray-900">
        {/* Hero Carousel - mamo style */}
        <BoundaryCarousel />

        {/* New Arrivals / Featured Products */}
        <NewArrivals />

        {/* Categories */}
        <Categories />

        {/* Sustainable Section */}
        <SustainableFashion />

        {/* Shop Benefits Bar */}
        <ShopBenefits />

        {/* Newsletter */}
        <Newsletter />
      </div>
    </MainLayout>
  );
}
