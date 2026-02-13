import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to Our Platform
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            A complete authentication system with email verification, password
            reset, and profile management.
          </p>
          <div className="space-x-4">
            <Link
              to="/login"
              className="inline-block px-6 py-3 text-base font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="inline-block px-6 py-3 text-base font-medium text-blue-600 bg-white hover:bg-gray-50 border border-blue-600 rounded-md"
            >
              Sign Up
            </Link>
          </div>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              🔐 Secure Authentication
            </h3>
            <p className="text-gray-600">
              Email verification with OTP, secure password hashing, and JWT
              tokens.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              👤 Profile Management
            </h3>
            <p className="text-gray-600">
              Update your profile information, change password, and manage your
              account.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              📧 Email Features
            </h3>
            <p className="text-gray-600">
              Password reset via email, OTP verification, and welcome emails.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
