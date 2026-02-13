// React import not needed
import { Link } from "react-router-dom";
import {
  Facebook,
  Instagram,
  Twitter,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";
import { useStoreSettings } from "../contexts/StoreSettingsContext";
import { Logo } from "./ui/logo";

export default function Footer() {
  const { settings } = useStoreSettings();

  return (
    <footer className="bg-gray-100 dark:bg-gray-800 pt-8 sm:pt-12 pb-6 sm:pb-8 text-gray-600 dark:text-gray-300">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {/* Store Info */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Logo className="max-h-12" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {settings.storeName}
              </h3>
            </div>
            <ul className="space-y-3">
              <li className="flex items-start">
                <MapPin className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                <span>{settings.storeAddress}</span>
              </li>
              <li className="flex items-center">
                <Phone className="h-5 w-5 mr-2 flex-shrink-0" />
                <span>{settings.storePhone}</span>
              </li>
              <li className="flex items-center">
                <Mail className="h-5 w-5 mr-2 flex-shrink-0" />
                <a
                  href={`mailto:${settings.storeEmail}`}
                  className="hover:text-primary"
                >
                  {settings.storeEmail}
                </a>
              </li>
            </ul>
          </div>

          {/* Shop Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Shop
            </h3>
            <ul className="space-y-2">
              <li>
                <Link to="/shop" className="hover:text-primary">
                  All Products
                </Link>
              </li>
              <li>
                <Link to="/shop?category=men" className="hover:text-primary">
                  Men's Collection
                </Link>
              </li>
              <li>
                <Link to="/shop?category=women" className="hover:text-primary">
                  Women's Collection
                </Link>
              </li>
              <li>
                <Link
                  to="/shop?category=accessories"
                  className="hover:text-primary"
                >
                  Accessories
                </Link>
              </li>
              <li>
                <Link to="/shop?filter=sale" className="hover:text-primary">
                  Sale Items
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Customer Service
            </h3>
            <ul className="space-y-2">
              <li>
                <Link to="/account/orders" className="hover:text-primary">
                  Track Order
                </Link>
              </li>
              <li>
                <Link to="/shipping" className="hover:text-primary">
                  Shipping Policy
                </Link>
              </li>
              <li>
                <Link to="/returns" className="hover:text-primary">
                  Returns & Exchanges
                </Link>
              </li>
              <li>
                <Link to="/faq" className="hover:text-primary">
                  FAQ
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-primary">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Stay Connected
            </h3>
            <p className="mb-4">
              Subscribe to our newsletter for updates on new arrivals, sales,
              and more.
            </p>
            <div className="flex mb-4">
              <input
                type="email"
                placeholder="Your email"
                className="px-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-l-md focus:outline-none focus:ring-1 focus:ring-primary dark:bg-gray-700"
              />
              <button className="bg-primary text-white px-4 py-2 rounded-r-md hover:bg-primary/90">
                Subscribe
              </button>
            </div>
            <div className="flex space-x-4 mt-4">
              <a
                href="#"
                className="text-gray-600 hover:text-primary dark:text-gray-400 dark:hover:text-primary"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="text-gray-600 hover:text-primary dark:text-gray-400 dark:hover:text-primary"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="text-gray-600 hover:text-primary dark:text-gray-400 dark:hover:text-primary"
              >
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm">
            &copy; {new Date().getFullYear()} {settings.storeName}. All rights
            reserved.
          </p>
          <div className="flex space-x-4 mt-4 md:mt-0">
            <Link to="/privacy" className="text-sm hover:text-primary">
              Privacy Policy
            </Link>
            <Link to="/terms" className="text-sm hover:text-primary">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
