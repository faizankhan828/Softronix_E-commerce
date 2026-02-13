import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  currency: string;
}

const Shop = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/products`);
      setProducts(data);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const handleBuyNow = async (productId: string) => {
    if (!user) {
      alert("Please login to purchase");
      return;
    }

    try {
      const { data } = await axios.post(
        `${API_URL}/payment/create-checkout-session`,
        {
          productId,
          userId: user.id, // Ensure user object has id
        },
      );

      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error("No checkout URL returned");
        alert("Failed to initiate checkout");
      }
    } catch (error) {
      console.error("Error creating checkout session:", error);
      alert("Failed to initiate checkout");
    }
  };

  // Correction: I cannot use window.Stripe without the script tag or package.
  // I will update this file in a moment after installing payload.

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Shop</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {products.map((product) => (
          <div
            key={product._id}
            className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col"
          >
            {product.imageUrl && (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-48 object-cover"
              />
            )}
            <div className="p-4 flex-1 flex flex-col">
              <h2 className="text-xl font-semibold mb-2">{product.name}</h2>
              <p className="text-gray-600 mb-4 flex-1">{product.description}</p>
              <div className="flex justify-between items-center mt-auto">
                <span className="text-lg font-bold text-green-600">
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: product.currency,
                  }).format(product.price)}
                </span>
                <button
                  onClick={() => handleBuyNow(product._id)}
                  className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition"
                >
                  Buy Now
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Shop;
