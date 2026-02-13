
import { useEffect } from "react";
import { Link } from "react-router-dom";

const Success = () => {
  useEffect(() => {
    // Optional: You could verify the session_id here if passed in query params
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-green-50">
      <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md">
        <svg
          className="w-16 h-16 text-green-500 mx-auto mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M5 13l4 4L19 7"
          ></path>
        </svg>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Payment Successful!</h2>
        <p className="text-gray-600 mb-6">
          Thank you for your purchase. Your order has been processed successfully.
        </p>
        <Link
          to="/shop"
          className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 transition duration-200"
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  );
};

export default Success;
