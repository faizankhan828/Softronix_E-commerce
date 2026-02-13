
import { Link } from "react-router-dom";

const Cancel = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-red-50">
      <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md">
        <svg
          className="w-16 h-16 text-red-500 mx-auto mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M6 18L18 6M6 6l12 12"
          ></path>
        </svg>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Payment Canceled</h2>
        <p className="text-gray-600 mb-6">
          Your payment was canceled. No charges were made.
        </p>
        <Link
          to="/shop"
          className="bg-gray-800 text-white px-6 py-2 rounded hover:bg-gray-900 transition duration-200"
        >
          Return to Shop
        </Link>
      </div>
    </div>
  );
};

export default Cancel;
